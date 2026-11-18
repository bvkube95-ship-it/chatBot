import { Router, Request, Response, NextFunction, CookieOptions } from 'express'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { OAuth2Client } from 'google-auth-library'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import prisma from './Db'

const {
  DATABASE_URL,
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
        expiresIn: SESSION_DAYS * 24 * 60 * 60, // в секундах
    })
    res.cookie(SESSION_COOKIE, token, {
        ...baseCookie,
        maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000, // в миллисекундах
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