// api/videos.js — no longer needed with Invidious (search returns viewCount inline)
// Kept as a stub so existing frontend code doesn't 404
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).json({ items: [] })
}
