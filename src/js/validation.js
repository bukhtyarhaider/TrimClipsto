/**
 * Clip validation rules and filename generator helpers.
 */

import { toSec, fmt, pad } from "./time.js";

/**
 * Creates a clean slug from a clip title, filtering common stop words.
 * @param {string} title
 * @returns {string}
 */
export function slug(title) {
  const stop = new Set(["the", "a", "an", "and", "of", "to", "at", "in", "on", "for"]);
  const t = String(title || "")
    .replace(/\([^)]*\)/g, " ")
    .toLowerCase()
    .replace(/['’]s\b/g, "s");
  let words = t
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(w => w && !stop.has(w));
  if (!words.length) {
    words = String(title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean);
  }
  return words.slice(0, 5).join("_") || "clip";
}

/**
 * Suggests a structured filename for a clip based on its index and title.
 * @param {string} title
 * @param {number} index - 0-based index
 * @param {number} totalClips - Total number of clips
 * @returns {string} E.g., "clip_01_intro.mp4"
 */
export function suggestName(title, index, totalClips = 10) {
  const width = Math.max(2, String(totalClips).length);
  return `clip_${pad(index + 1, width)}_${slug(title)}.mp4`;
}

/**
 * Cleans a filename: removes invalid OS characters, replaces spaces, ensures .mp4 suffix.
 * @param {string} val
 * @returns {string}
 */
export function cleanFileName(val) {
  let v = String(val || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[\\/:*?"<>|]/g, "");
  if (v && !/\.mp4$/i.test(v)) v += ".mp4";
  return v;
}

/**
 * Validates a list of clips against formatting rules, duplicates, video boundaries, and overlaps.
 * @param {Array<object>} clips
 * @param {number} [videoDur=0]
 * @returns {Array<object>} Array of validation descriptors { issues, s, e, dur }
 */
export function validateClips(clips, videoDur = 0) {
  const names = {};
  clips.forEach(c => {
    const k = (c.output_name || "").trim().toLowerCase();
    if (k) names[k] = (names[k] || 0) + 1;
  });

  return clips.map((c, i) => {
    const issues = [];
    const s = toSec(c.start);
    const e = toSec(c.end);

    if (!(c.title || "").trim()) {
      issues.push({ f: "title", l: "warn", t: "Add a title so this clip is easy to recognise." });
    }
    if (s === null) {
      issues.push({ f: "start", l: "err", t: "Start time isn't valid. Use a format like 00:02:18.000 or 2:18." });
    }
    if (e === null) {
      issues.push({ f: "end", l: "err", t: "End time isn't valid. Use a format like 00:02:46.000 or 2:46." });
    }
    if (s !== null && e !== null && e <= s) {
      issues.push({ f: "end", l: "err", t: "The end must come after the start." });
    }

    if (videoDur && e !== null && e > videoDur + 0.05) {
      issues.push({ f: "end", l: "warn", t: `This is past the end of your video (${fmt(videoDur)}).` });
    } else if (videoDur && s !== null && s >= videoDur) {
      issues.push({ f: "start", l: "warn", t: `This is past the end of your video (${fmt(videoDur)}).` });
    }

    const n = (c.output_name || "").trim();
    if (!n) {
      issues.push({ f: "output_name", l: "err", t: "Add a file name." });
    } else if (!/\.mp4$/i.test(n)) {
      issues.push({ f: "output_name", l: "err", t: "File name should end in .mp4." });
    } else if (/[\s\\/:*?"<>|]/.test(n)) {
      issues.push({ f: "output_name", l: "err", t: "File name can't contain spaces or these characters: \\ / : * ? \" < > |" });
    } else if (names[n.toLowerCase()] > 1 && !c.ok) {
      issues.push({ f: "output_name", l: "err", t: "Another clip uses this file name. Each clip needs its own." });
    }

    if (s !== null && e !== null && e > s) {
      for (let j = 0; j < i; j++) {
        const s2 = toSec(clips[j].start);
        const e2 = toSec(clips[j].end);
        if (s2 !== null && e2 !== null && e2 > s2 && s < e2 && e > s2) {
          issues.push({ f: "start", l: "warn", t: `Overlaps with clip ${j + 1}. That's fine if it's on purpose.` });
        }
      }
    }

    return {
      issues,
      s,
      e,
      dur: s !== null && e !== null && e > s ? e - s : null
    };
  });
}
