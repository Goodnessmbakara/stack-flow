import express from 'express'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
// Use express's built-in JSON parser to avoid extra dependency on `body-parser`
app.use(express.json({ limit: '1mb' }))

const GEMINI_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_KEY) console.warn('[gemini-proxy] WARNING: GEMINI_API_KEY is not set in environment')

app.get('/health', (req, res) => res.json({ status: 'ok', hasKey: !!GEMINI_KEY }))

app.post('/generate', async (req, res) => {
  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_KEY || ''
        },
        timeout: 30000
      }
    )

    res.status(response.status).json(response.data)
  } catch (err) {
    if (err.response) {
      console.error('[gemini-proxy] upstream error', err.response.status, err.response.data)
      res.status(err.response.status).json({ error: err.response.data })
    } else {
      console.error('[gemini-proxy] unexpected error', err.message || err)
      res.status(500).json({ error: err.message || 'unknown error' })
    }
  }
})

const port = process.env.GEMINI_PROXY_PORT || 5178
app.listen(port, () => console.log(`[gemini-proxy] listening on http://localhost:${port}`))
