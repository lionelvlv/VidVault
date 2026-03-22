// server.dev.js — local development server only (not deployed to Vercel)
// Usage: node server.dev.js
// Requires: YOUTUBE_API_KEY in a .env file or environment

import http      from 'node:http';
import fs        from 'node:fs';
import path      from 'node:path';
import { URL }   from 'node:url';

const PORT    = 3000;
const ROOT    = new URL('.', import.meta.url).pathname;
const API_KEY = process.env.YOUTUBE_API_KEY ?? (() => {
  // Try to read .env manually (no dotenv dependency)
  try {
    const env = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
    const m   = env.match(/^YOUTUBE_API_KEY=(.+)$/m);
    return m ? m[1].trim() : null;
  } catch { return null; }
})();

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
};

const YT_SEARCH = 'https://www.googleapis.com/youtube/v3/search';
const YT_VIDEOS = 'https://www.googleapis.com/youtube/v3/videos';
const ERA_START = '2005-04-23T00:00:00Z';
const ERA_END   = '2009-12-31T23:59:59Z';

async function handleApi(req, res, parsedUrl) {
  if (!API_KEY) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'YOUTUBE_API_KEY not set' }));
  }

  const q = parsedUrl.searchParams;

  try {
    let upstream;
    if (parsedUrl.pathname === '/api/search') {
      const params = new URLSearchParams({
        part: 'snippet', q: q.get('q'), type: 'video',
        maxResults: 12, publishedAfter: ERA_START, publishedBefore: ERA_END,
        order: q.get('order') || 'relevance', key: API_KEY,
      });
      if (q.get('pageToken')) params.set('pageToken', q.get('pageToken'));
      upstream = await fetch(YT_SEARCH + '?' + params);
    } else {
      const params = new URLSearchParams({
        part: 'snippet,statistics,contentDetails', id: q.get('ids'), key: API_KEY,
      });
      upstream = await fetch(YT_VIDEOS + '?' + params);
    }
    const data = await upstream.json();
    res.writeHead(upstream.status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(data));
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname  = parsedUrl.pathname;

  if (pathname.startsWith('/api/')) return handleApi(req, res, parsedUrl);

  // Serve static files
  let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath)) filePath = path.join(ROOT, 'index.html'); // SPA fallback

  const ext  = path.extname(filePath);
  const mime = MIME[ext] ?? 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`VidVault dev server → http://localhost:${PORT}`);
  if (!API_KEY) console.warn('⚠  YOUTUBE_API_KEY not set — API calls will fail');
});
