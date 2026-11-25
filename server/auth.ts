import { Router, Request, Response, NextFunction, CookieOptions } from 'express'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { OAuth2Client } from 'google-auth-library'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import prisma from './db'

const {
  CLIENT_URL,
  SERVER_URL,
  JWT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GMAIL_USER,
  GMAIL_APP_PASSWORD,
} = process.env

if (
    !JWT_SECRET ||
    !GOOGLE_CLIENT_ID ||
    !GOOGLE_CLIENT_SECRET ||
    !SERVER_URL ||
    !CLIENT_URL ||
    !GMAIL_USER ||
    !GMAIL_APP_PASSWORD
) {
    throw new Error('Missing auth env variables, check your .env file')
}

const APP_NAME = "NYX Assist" // name in mail
const SESSION_DAYS = 30
const LINK_MINUTES = 15
const SESSION_COOKIE = "token"
const STATE_COOKIE = "oauth_state"

const googleClient = new OAuth2Client(
    GOOGLE_CLIENT_ID, 
    GOOGLE_CLIENT_SECRET,
    `${SERVER_URL}/auth/google/callback`,
)

const mailer = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
    },
})

const baseCookie: CookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
}

function setSession(res: Response, userId: string) {
    const token = jwt.sign({ sub: userId }, JWT_SECRET!, {
        expiresIn: SESSION_DAYS * 24 * 60 * 60, // in seconds
    })
    res.cookie(SESSION_COOKIE, token, {
        ...baseCookie,
        maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000, // in milliseconds
    })
}

function fail(res: Response, code: string) {
    res.redirect(`${CLIENT_URL}/?auth_error=${code}`)
}

function sha256(value: string) {
    return crypto.createHash('sha256').update(value).digest('hex')
}

function safeEqual(a: string, b: string) {
    const ba = Buffer.from(a)
    const bb = Buffer.from(b)
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb)
}

function publicUser(u: {
    id: string
    email: string
    name: string | null
    avatarUrl: string | null
}) {
    return { id: u.id, email: u.email, name: u.name, avatarUrl: u.avatarUrl }
}

async function upsertUser(data: {
    email: string
    googleId?: string
    name?: string
    avatarUrl?: string
}) {
    if (data.googleId) {
        const byGoogle = await prisma.user.findUnique({ where: { googleId: data.googleId } })
        if (byGoogle) return byGoogle
    }

    const byEmail = await prisma.user.findUnique({ where: { email: data.email } })

    if (byEmail) {
        if (data.googleId && !byEmail.googleId) {
            return prisma.user.update({
                where: { id: byEmail.id },
                data: {
                    googleId: data.googleId,
                    name: byEmail.name ?? data.name,
                    avatarUrl: byEmail.avatarUrl ?? data.avatarUrl,
                },
            })
        }
        return byEmail
    }

    return prisma.user.create({ data })
}

declare global {
    namespace Express {
        interface Request {
            userId?: string
        }
    }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.[SESSION_COOKIE]
    if (!token) return res.status(401).json({ error: "Not auntificated" })

    try {
        const payload = jwt.verify(token, JWT_SECRET!) as jwt.JwtPayload
        req.userId = payload.sub as string
        next()
    } catch {
        res.status(401).json({ error: 'Invalid or expired session' })
    }
}

export const authRouter = Router()

authRouter.use(
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false })
)

// Step A: send the browser to the Google page
authRouter.get('/google', (_req, res) => {
    const state = crypto.randomBytes(32).toString('hex')
    res.cookie(STATE_COOKIE, state, { ...baseCookie, maxAge: 10 * 60 * 1000 })

    const url = googleClient.generateAuthUrl({
        scope: ['openid', 'email', 'profile'],
        state,
        prompt: 'select_account',
    })
    res.redirect(url)
})

// Step B: Google redirects the user back here with a one-time code
authRouter.get('/google/callback', async (req, res) => {
    const { code, state, error } = req.query
    const savedState = req.cookies?.[STATE_COOKIE]
    res.clearCookie(STATE_COOKIE, baseCookie)

    if (error) return fail(res, 'google_denied')

    if (
        typeof code !== 'string' ||
        typeof state !== 'string' ||
        typeof savedState !== 'string' ||
        !safeEqual(state, savedState)
    ) {
        return fail(res, 'invalid_state')
    }

    try {
        const { tokens } = await googleClient.getToken(code)
        if (!tokens.id_token) return fail(res, 'google_failed')

        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: GOOGLE_CLIENT_ID,
        })
        const p = ticket.getPayload()

        if (!p?.sub || !p.email || !p.email_verified) {
            return fail(res, 'email_not_verified')
        }

        const user = await upsertUser({
            email: p.email.toLowerCase(),
            googleId: p.sub,
            name: p.name,
            avatarUrl: p.picture,
        })

        setSession(res, user.id)
        res.redirect(CLIENT_URL!)
    } catch (e) {
        console.error('Google auth failed:', e)
        fail(res, 'google_failed')
    }
})

const sendLinkLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
})

const emailSchema = z.object({
    email: z.string().trim().toLowerCase().email().max(254),
})

// Step A: the user enters their email, and we send a link
authRouter.post('/send-link', sendLinkLimiter, async (req, res) => {
    const parsed = emailSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid email' })

    const { email } = parsed.data

    const recent = await prisma.loginToken.count({
        where: { email, createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) } },
    })
    if (recent >= 3) return res.json({ ok: true })

    const token = crypto.randomBytes(32).toString('base64url')
    const record = await prisma.loginToken.create({
        data: {
            email,
            tokenHash: sha256(token),
            expiresAt: new Date(Date.now() + LINK_MINUTES * 60 * 1000),
        },
    })

    const link = `${SERVER_URL}/auth/verify?token=${token}`

    try {
        await mailer.sendMail({
            from: `"${APP_NAME}" <${GMAIL_USER}>`,
            to: email,
            subject: `Вход в ${APP_NAME}`,
            text:
                `Чтобы войти, откройте ссылку (действует ${LINK_MINUTES} минут):\n${link}\n\n` +
                `Если вы не запрашивали вход, просто проигнорируйте это письмо.`,
            html:
                `<p>Чтобы войти в ${APP_NAME}, нажмите на кнопку. Ссылка действует ${LINK_MINUTES} минут и работает один раз.</p>` +
                `<p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;border-radius:8px;text-decoration:none">Войти</a></p>` +
                `<p style="color:#666;font-size:13px">Если вы не запрашивали вход, просто проигнорируйте это письмо.</p>`,
        })
    } catch (e) {
        console.error('Failed to send email:', e)
        await prisma.loginToken.delete({ where: { id: record.id } }).catch(() => {})
        return res.status(500).json({ error: 'Could not send email' })
    }

    res.json({ ok: true })
})

// Step B: the user clicked on a link in the email
authRouter.get('/verify', async (req, res) => {
    const { token } = req.query
    if (typeof token !== 'string' || token.length < 20) return fail(res, 'invalid_link')

    const tokenHash = sha256(token)

    const { count } = await prisma.loginToken.updateMany({
        where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
    })
    if (count !== 1) return fail(res, 'invalid_link')

    const record = await prisma.loginToken.findUnique({ where: { tokenHash } })
    if (!record) return fail(res, 'invalid_link')

    const user = await upsertUser({ email: record.email })

    setSession(res, user.id)
    res.redirect(CLIENT_URL!)
})

authRouter.get('/me', requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) return res.status(401).json({ error: 'User not found' })
    res.json({ user: publicUser(user) })
})

authRouter.post('/logout', (_req, res) => {
    res.clearCookie(SESSION_COOKIE, baseCookie)
    res.json({ ok: true })
})