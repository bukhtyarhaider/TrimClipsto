/**
 * Time formatting, parsing, and text escaping helpers.
 */

/**
 * Escapes HTML characters in a string.
 * @param {string|number} s
 * @returns {string}
 */
export const esc = s =>
  String(s ?? "").replace(
    /[&<>"']/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

/**
 * Left-pads a number or string with zeros.
 * @param {number|string} n
 * @param {number} l
 * @returns {string}
 */
export const pad = (n, l = 2) => String(n).padStart(l, "0");

/**
 * Parses timestamp string (e.g., '01:23:45.678', '02:18', or '45.5') to seconds.
 * Returns null if invalid or minute/second values >= 60.
 * @param {string} str
 * @returns {number|null}
 */
export function toSec(str) {
  str = String(str ?? "").trim();
  if (!str || !/^\d+(:\d{1,2}){0,2}(\.\d+)?$/.test(str)) return null;
  const parts = str.split(":");
  for (let i = 1; i < parts.length; i++) {
    if (parseFloat(parts[i]) >= 60) return null;
  }
  return parts.reduce((s, p) => s * 60 + parseFloat(p), 0);
}

/**
 * Formats seconds into HH:MM:SS.mmm format.
 * @param {number} sec
 * @returns {string}
 */
export function fmt(sec) {
  const ms = Math.round(sec * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms % 1000, 3)}`;
}

/**
 * Formats seconds into human-readable duration (e.g., "1 h 12 min", "2 min 14 s", "35 s").
 * @param {number} sec
 * @returns {string}
 */
export function human(sec) {
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h} h ${m} min`;
  if (m) return s ? `${m} min ${s} s` : `${m} min`;
  return `${s} s`;
}

/**
 * Formats seconds into short clock format (e.g., "1:23:45" or "2:18").
 * @param {number} sec
 * @returns {string}
 */
export function short(sec) {
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
