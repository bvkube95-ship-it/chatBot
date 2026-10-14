import express from 'express'
import cors from 'cors'
import SYSTEM_PROMPT from './prompts/SYSTEM_PROMPT'
import { TITLE_SYSTEM, TITLE_EXAMPLES } from './prompts/TITLE_PROMPTS'

const app = express()
app.use(cors({
    origin: 'http://localhost:5173'
}))
app.use(express.json())

const OLLAMA_URL = 'http://localhost:11434/api/chat'
const AI_MODEL = 'qwen3.5:4b'

function parseTitle(raw: string): string | null {
    try {
        const { title } = JSON.parse(raw) as { title?: unknown }
        if (typeof title !== 'string') return null

        const clean = title
            .trim()
            .replace(/^["'«“]+|["'»”.]+$/g, '')
            .slice(0, 40)
            .trim()

        if (!clean || clean.split(/\s+/).length > 6) return null
        if (/^(okay|ok|we are|the user|let me)/i.test(clean)) return null

        return clean
    } catch {
        return null
    }
}

app.post('/api/chat', async (req, res) => {
    const { message } = req.body as { message: string }

    if (!message) {
        return res.status(400).json({ error: 'Message is required' })
    }

    const controller = new AbortController()

    res.on('close', () => {
        if (!res.writableEnded) {
            controller.abort()
        }
    })

    try {
        const ollamaRes = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: message }
                ],
                stream: false,
                keep_alive: '30m'
            }),
            signal: controller.signal,
        })

        if (!ollamaRes.ok) {
            throw new Error(`Ollama API error: ${ollamaRes.statusText}`)
        }

        const data = await ollamaRes.json()
        res.json({ reply: data.message.content })
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            return
        }
        console.log(error)
        res.status(500).json({ error: 'Internal server error' })
    }
})

app.post('/api/title', async (req, res) => {
    const { message } = req.body as { message: string }

    if (!message) {
        return res.status(400).json({ error: 'Message is required' })
    }

    try {
        const ollamaRes = await fetch(OLLAMA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages: [
                    { role: 'system', content: TITLE_SYSTEM },
                    ...TITLE_EXAMPLES,
                    { role: 'user', content: `Message: ${message.slice(0, 500)}` },
                ],
                format: {
                    type: 'object',
                    properties: {
                        language: { type: 'string' },   // should be first
                        title: { type: 'string' },
                    },
                    required: ['language', 'title'],
                },
                think: false,
                stream: false,
                options: { temperature: 0.3, num_predict: 80 },
                keep_alive: '30m',
            }),
        })

        if (!ollamaRes.ok) {
            throw new Error(`Ollama API error: ${ollamaRes.statusText}`)
        }

        const data = await ollamaRes.json()

        res.json({ title: parseTitle(data.message.content) })
    } catch (error) {
        console.log(error)
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' })
        }
    }
})

const PORT = 3001
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})