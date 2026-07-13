import { USER_AGENT, FETCH_TIMEOUT_MS } from './config.js';

/** Fetch a URL as text with a normal browser UA and a hard timeout. Throws on non-2xx. */
export async function fetchText(url, extraHeaders = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,application/xml', ...extraHeaders },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export function resolveUrl(base, href) {
  if (!href) return null;
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

export function clean(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

/** Simple politeness delay between requests to the same site. */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
