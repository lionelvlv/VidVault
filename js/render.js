// js/render.js — pure HTML-string builders, no direct fetch calls

import {
  fmtCount, fmtDate, fakeTimestamp,
  getVideoId, getThumbnailUrl,
  escHtml, safeAttr, computeStars, renderStars,
} from './utils.js';

function _thumb(item, isUnavailable) {
  const tn = getThumbnailUrl(item);
  const sn = item.snippet ?? {};
  let inner = tn
    ? `<img src="${tn}" alt="${escHtml(sn.title ?? '')}" loading="lazy" onerror="this.style.display='none'" />`
    : `<div class="thumb-placeholder"><div class="play-icon">&#9658;</div>${escHtml((sn.title ?? '').slice(0, 28))}</div>`;
  inner += `<div class="thumb-timestamp">${fakeTimestamp()}</div>`;
  if (isUnavailable) inner += `<div class="unavail-overlay">VIDEO UNAVAILABLE</div>`;
  return inner;
}

export function makeGridCard(item) {
  const id      = getVideoId(item);
  const sn      = item.snippet    ?? {};
  const st      = item.statistics ?? {};
  const unavail = !!item._unavailable;
  const onclick = (!unavail && id)
    ? `onclick="window.__app.openVideo('${id}','${safeAttr(sn.title ?? '')}')"`
    : '';
  return `
    <div class="video-card${unavail ? ' unavailable' : ''}" ${onclick}>
      <div class="thumb-wrap">${_thumb(item, unavail)}</div>
      <div class="video-info">
        <div class="video-title">${escHtml(sn.title ?? 'Untitled')}</div>
        <div class="video-date">${fmtDate(sn.publishedAt)}</div>
        ${st.viewCount ? `<div class="video-views">${fmtCount(st.viewCount)} views</div>` : ''}
      </div>
    </div>`;
}

export function makeResultRow(item) {
  const id      = getVideoId(item);
  const sn      = item.snippet    ?? {};
  const st      = item.statistics ?? {};
  const unavail = !!item._unavailable;
  const onclick = (!unavail && id)
    ? `onclick="window.__app.openVideo('${id}','${safeAttr(sn.title ?? '')}')"`
    : '';
  const desc  = (sn.description ?? '').slice(0, 130);
  const stars = renderStars(computeStars(st));
  return `
    <div class="result-row${unavail ? ' unavailable' : ''}" ${onclick}>
      <div class="result-thumb">${_thumb(item, unavail)}</div>
      <div class="result-info">
        <div class="result-title">${escHtml(sn.title ?? 'Untitled')}</div>
        <div class="result-channel">by ${escHtml(sn.channelTitle ?? 'Unknown')}</div>
        <div class="result-desc">${escHtml(desc)}${(sn.description ?? '').length > 130 ? '...' : ''}</div>
        <div class="result-meta">
          <span class="video-date">${fmtDate(sn.publishedAt)}</span>
          ${st.viewCount ? `<span class="video-views">${fmtCount(st.viewCount)} views</span>` : ''}
          ${stars        ? `<span class="stars">${stars}</span>` : ''}
          ${unavail      ? '<span style="color:#cc2200;font-weight:bold">Unavailable</span>' : ''}
        </div>
      </div>
    </div>`;
}
