/**
 * Time formatting, parsing, and text escaping helpers.
 */

/**
 * Escapes HTML characters in a string.
 */
export const esc = (s: string | number | null | undefined): string =>
  String(s ?? "").replace(
    /[&<>"']/g,
    c =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c] || c)
  );

/**
 * Left-pads a number or string with zeros.
 */
export const pad = (n: number | string, l = 2): string =>
  String(n).padStart(l, "0");

/**
 * Parses timestamp string (e.g., '01:23:45.678', '02:18', or '45.5') to seconds.
 * Returns null if invalid or minute/second values >= 60.
 */
export function toSec(str: string | null | undefined): number | null {
  const s = String(str ?? "").trim();
  if (!s || !/^\d+(:\d{1,2}){0,2}(\.\d+)?$/.test(s)) return null;
  const parts = s.split(":");
  for (let i = 1; i < parts.length; i++) {
    if (parseFloat(parts[i]) >= 60) return null;
  }
  return parts.reduce((acc, p) => acc * 60 + parseFloat(p), 0);
}

/**
 * Formats seconds into HH:MM:SS.mmm format.
 */
export function fmt(sec: number): string {
  if (isNaN(sec) || sec < 0) sec = 0;
  const ms = Math.round(sec * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms % 1000, 3)}`;
}

/**
 * Formats seconds into human-readable duration (e.g., "1 h 12 min", "2 min 14 s", "35 s").
 */
export function human(sec: number): string {
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
 */
export function short(sec: number): string {
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * Formats seconds into MM:SS.mmm format (or HH:MM:SS.mmm if >= 1 hour).
 */
export function fmtShort(sec: number): string {
  if (isNaN(sec) || sec < 0) sec = 0;
  const ms = Math.round(sec * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msPart = pad(ms % 1000, 3);
  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}.${msPart}`;
  }
  return `${pad(m)}:${pad(s)}.${msPart}`;
}
