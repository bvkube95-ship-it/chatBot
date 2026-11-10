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

