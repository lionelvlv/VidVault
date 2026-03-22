// js/app.js — main controller; wires up all pages and user interactions

import { ytSearch, ytVideoDetails } from './api.js';
import { makeGridCard, makeResultRow } from './render.js';
import { fmtCount, fmtDate, escHtml, getVideoId } from './utils.js';

// ── CONSTANTS ────────────────────────────────────────────────────────────────

const RANDOM_QUERIES = [
  'funny 2006', 'vlog 2007', 'music video 2006', 'viral clip 2007',
  'prank 2006', 'skateboard fail 2007', 'flash animation 2006',
  'gaming 2007', 'animals cute 2006', 'dance 2007', 'news 2006',
  'machinima 2007', 'anime amv 2006', 'comedy skit 2007',
];

// ── STATE ────────────────────────────────────────────────────────────────────

let currentSort    = 'relevance';
let currentQuery   = '';
let nextPageToken  = null;
let prevPageTokens = [];
let currentPage    = 0;
let lastVideoQuery = '';

// ── DOM HELPERS ──────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

function showLoading(v) {
  $('loading').className = v ? 'show' : '';
}

function setActiveNav(id) {
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
  const el = $(id);
  if (el) el.classList.add('active');
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  $('page-' + name).classList.add('active');
}

// ── GRID LOADER ───────────────────────────────────────────────────────────────

async function loadGrid(elementId, query, order, count) {
  const el = $(elementId);
  if (!el) return;
  el.innerHTML = '<div class="loading-inline">Loading...</div>';
  try {
    const data = await ytSearch(query, order);
    if (!data.items?.length) {
      el.innerHTML = '<div class="empty-box">No videos found for this era.</div>';
      return;
    }
    const items  = data.items.slice(0, count ?? 4);
    const ids    = items.map(getVideoId).filter(Boolean);
    const detail = await ytVideoDetails(ids);
    const map    = Object.fromEntries((detail.items ?? []).map(d => [d.id, d]));
    el.innerHTML = items
      .map(it => { const d = map[getVideoId(it)]; return d ? { ...it, statistics: d.statistics } : it; })
      .map(makeGridCard)
      .join('');
  } catch (err) {
    el.innerHTML = `<div class="error-box">Could not load. Check your API key or quota.<br><small>${escHtml(err.message)}</small></div>`;
  }
}

// ── HOME ──────────────────────────────────────────────────────────────────────

export async function showHome() {
  setActiveNav('nav-home');
  showPage('home');
  $('page-home').innerHTML = `
    <div class="section-header">
      <span class="section-title">Featured Videos</span>
      <span class="section-sub">Editor's Picks &middot; Classic Era</span>
      <span class="new-badge">NEW</span>
    </div>
    <div class="video-grid" id="featured-grid"></div>

    <div class="section-header">
      <span class="section-title">Most Viewed of the Era</span>
      <span class="section-sub">The videos everyone watched &middot; 2005&ndash;2009</span>
    </div>
    <div class="video-grid" id="mostviewed-grid"></div>

    <div class="section-header">
      <span class="section-title">Recently Rediscovered</span>
      <span class="section-sub">Recovered from backup tapes &middot; 2005&ndash;2006</span>
    </div>
    <div class="video-grid video-grid-3" id="recent-grid"></div>
  `;
  await Promise.all([
    loadGrid('featured-grid',   'viral funny 2006',         'relevance', 4),
    loadGrid('mostviewed-grid', 'classic youtube 2007',     'viewCount', 4),
    loadGrid('recent-grid',     'original video 2005 2006', 'date',      3),
  ]);
}

// ── SEARCH ────────────────────────────────────────────────────────────────────

export function focusSearch() { $('search-input').focus(); }

export async function doSearchTerm(term) {
  $('search-input').value = term;
  await doSearch();
}

export async function browseCat(cat) {
  $('search-input').value = cat;
  await doSearch();
}

export async function loadRandom() {
  const term = RANDOM_QUERIES[Math.floor(Math.random() * RANDOM_QUERIES.length)];
  await doSearchTerm(term);
}

export async function doSearch(pageToken) {
  const q = $('search-input').value.trim();
  if (!q) return;
  currentQuery = q;
  if (!pageToken) { nextPageToken = null; prevPageTokens = []; currentPage = 0; }

  setActiveNav('nav-search');
  showPage('search');
  showLoading(true);
  $('search-results').innerHTML = '';
  $('result-count-label').textContent = '';

  try {
    const data = await ytSearch(q, currentSort, pageToken);
    showLoading(false);

    if (!data.items?.length) {
      $('search-results').innerHTML = '<div class="empty-box">No videos found in the archive for this search.</div>';
      return;
    }

    const ids    = data.items.map(getVideoId).filter(Boolean);
    const detail = await ytVideoDetails(ids);
    const map    = Object.fromEntries((detail.items ?? []).map(d => [d.id, d]));
    const items  = data.items.map(it => {
      const d = map[getVideoId(it)];
      return d ? { ...it, statistics: d.statistics } : { ...it, _unavailable: true };
    });

    const total = data.pageInfo?.totalResults;
    if (total) $('result-count-label').textContent = `~${fmtCount(total)} results (2005–2009)`;

    $('search-results').innerHTML = items.map(makeResultRow).join('');
    nextPageToken = data.nextPageToken ?? null;
    _renderPagination();
  } catch (err) {
    showLoading(false);
    $('search-results').innerHTML = `<div class="error-box">Error loading results.<br><small>${escHtml(err.message)}</small></div>`;
  }
}

function _renderPagination() {
  let h = '';
  if (currentPage > 0)  h += `<button class="page-btn" onclick="window.__app.goPage(-1)">&#9668; Prev</button>`;
  h += `<button class="page-btn active">Page ${currentPage + 1}</button>`;
  if (nextPageToken)    h += `<button class="page-btn" onclick="window.__app.goPage(1)">Next &#9658;</button>`;
  $('pagination').innerHTML = h;
}

export function goPage(dir) {
  if (dir === 1 && nextPageToken) {
    prevPageTokens.push(nextPageToken);
    currentPage++;
    doSearch(nextPageToken);
  } else if (dir === -1 && currentPage > 0) {
    currentPage--;
    doSearch(currentPage === 0 ? null : prevPageTokens[currentPage - 1]);
  }
}

export function setSort(s, btn) {
  currentSort = s;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (currentQuery) doSearch();
}

// ── VIDEO PLAYER ──────────────────────────────────────────────────────────────

export async function openVideo(id, title) {
  if (!id) return;
  lastVideoQuery = currentQuery || title;
  showPage('video');

  $('yt-player').src         = `https://www.youtube.com/embed/${id}?autoplay=1`;
  $('player-title').textContent = 'Loading…';
  $('player-meta').innerHTML  = '';
  $('player-desc').textContent = '';
  $('related-grid').innerHTML  = '';

  $('back-btn').onclick = () => {
    $('yt-player').src = '';
    currentQuery ? (showPage('search'), setActiveNav('nav-search')) : showHome();
  };

  try {
    const data = await ytVideoDetails([id]);
    const v    = data.items?.[0];
    if (v) {
      const sn = v.snippet    ?? {};
      const st = v.statistics ?? {};
      $('player-title').textContent = sn.title ?? 'Unknown Title';
      $('player-meta').innerHTML = `
        <span>Uploaded: <strong>${fmtDate(sn.publishedAt)}</strong></span>
        <span>Views: <strong>${fmtCount(st.viewCount)}</strong></span>
        <span>Likes: <strong>${fmtCount(st.likeCount)}</strong></span>
        <span>Comments: <strong>${fmtCount(st.commentCount)}</strong></span>
        <span>Channel: <strong>${escHtml(sn.channelTitle ?? 'Unknown')}</strong></span>
      `;
      $('player-desc').textContent = sn.description ?? '';
    }
  } catch {
    $('player-title').textContent = title ?? 'Unknown Title';
  }

  loadGrid('related-grid', lastVideoQuery || title, 'relevance', 4);
}

// ── CLOCK ─────────────────────────────────────────────────────────────────────

function _updateClock() {
  const now  = new Date();
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map(n => n.toString().padStart(2, '0')).join(':');
  const mc = $('menu-clock');
  const tt = $('taskbar-time');
  if (mc) mc.textContent = time;
  if (tt) tt.textContent = time;
}

// ── BOOT ─────────────────────────────────────────────────────────────────────

// Expose a small API on window so inline onclick="" handlers in HTML can reach it
window.__app = { openVideo, goPage, doSearch, doSearchTerm, browseCat,
                 loadRandom, showHome, setSort, focusSearch };

$('search-input').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
setInterval(_updateClock, 1000);
_updateClock();
showHome();
