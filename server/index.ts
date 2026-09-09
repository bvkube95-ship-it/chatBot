import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors({
    origin: 'http://localhost:5173'
}))
app.use(express.json())

const OLLAMA_URL = 'http://localhost:11434/api/chat'
const AI_MODEL = 'qwen3:4b'

app.post('/api/chat', async (req, res) => {
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
                messages: [{ role: 'user', content: message }],
                stream: false,
                keep_alive: '30m'
        })
    })

    if (!ollamaRes.ok) {
        throw new Error(`Ollama API error: ${ollamaRes.statusText}`)
    }

    const data = await ollamaRes.json()
    res.json({ reply: data.message.content})
    } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Internal server error' })
    }
})

const PORT = 3001
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})