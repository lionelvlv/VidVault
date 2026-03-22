// No longer needed — stats shown inline from search results
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).json({ items: [] })
}
