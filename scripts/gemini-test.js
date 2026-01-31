import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const PROXY_PORT = process.env.GEMINI_PROXY_PORT || 5178
const PROXY_URL = `http://localhost:${PROXY_PORT}/generate`

function extractJsonArray(text) {
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    const json = text.slice(start, end + 1)
    return JSON.parse(json)
  } catch (err) {
    return null
  }
}

async function run() {
  const prompt = `Generate 3 brief, realistic tweets about bitcoin. Return a valid JSON array only. Each item must be an object with fields: id (string), text (string), created_at (ISO string), author_id (string), public_metrics (object with like_count and retweet_count integers). Example: [{"id":"1","text":"...","created_at":"2025-01-01T00:00:00Z","author_id":"u1","public_metrics":{"like_count":2,"retweet_count":1}}]`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  }

  try {
    console.log('[gemini-test] POST ->', PROXY_URL)
    const resp = await axios.post(PROXY_URL, body, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 })
    console.log('[gemini-test] raw status:', resp.status)

    const raw = resp.data?.candidates?.[0]?.content?.[0]?.text || resp.data?.candidates?.[0]?.text || resp.data?.output?.[0]?.content?.[0]?.text || JSON.stringify(resp.data)

    const arr = extractJsonArray(String(raw))
    if (!arr) {
      console.error('[gemini-test] Could not parse JSON array from response. Raw output:\n', String(raw))
      process.exitCode = 2
      return
    }

    console.log('[gemini-test] Parsed tweets:')
    arr.forEach((t, i) => {
      console.log(`- [${i}] id=${t.id || 'n/a'} author=${t.author_id || 'n/a'} created_at=${t.created_at || 'n/a'}`)
      console.log(`  text: ${String(t.text || '').slice(0, 200)}`)
      console.log(`  metrics: ${JSON.stringify(t.public_metrics || {})}`)
    })
  } catch (err) {
    if (err.response) {
      console.error('[gemini-test] upstream error', err.response.status, err.response.data)
    } else {
      console.error('[gemini-test] request failed', err.message || err)
    }
    process.exitCode = 3
  }
}

run()
