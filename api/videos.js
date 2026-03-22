// api/videos.js — Vercel serverless function
const YT_VIDEOS = 'https://www.googleapis.com/youtube/v3/videos'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const API_KEY = process.env.YOUTUBE_API_KEY
  if (!API_KEY) return res.status(500).json({ error: 'YOUTUBE_API_KEY not set' })

  const { ids } = req.query
  if (!ids) return res.status(400).json({ error: 'Missing parameter: ids' })

  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails', id: ids, key: API_KEY,
  })

  try {
    const upstream = await fetch(YT_VIDEOS + '?' + params)
    const data = await upstream.json()
    res.status(upstream.ok ? 200 : upstream.status).json(data)
  } catch (err) {
    res.status(502).json({ error: 'YouTube API error', detail: err.message })
  }
}
