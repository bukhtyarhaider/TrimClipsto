/**
 * Clip validation rules and filename generator helpers.
 */

import { toSec, fmt, pad } from "./time";
import { Clip, ClipValidation, ValidationIssue } from "../types";

export interface NamingOptions {
  projectName?: string;
  pattern?: string;
  extension?: string;
  separator?: "_" | "-";
  maxWords?: number;
}

/**
 * Creates a clean slug from a clip title, filtering common stop words.
 */
export function slug(
  title: string,
  separator: "_" | "-" = "_",
  maxWords = 5
): string {
  const stop = new Set(["the", "a", "an", "and", "of", "to", "at", "in", "on", "for"]);
  const t = String(title || "")
    .replace(/\([^)]*\)/g, " ")
    .toLowerCase()
    .replace(/['’]s\b/g, "s")
    .replace(/['’]/g, "");
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
  const joined = words.slice(0, maxWords).join(separator);
  return joined || "clip";
}

/**
 * Sanitizes a project name for inclusion in filenames.
 */
export function sanitizeProjectName(name: string, separator: "_" | "-" = "_"): string {
  return String(name || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, separator)
    .replace(/^[-_]+|[-_]+$/g, "");
}

/**
 * Suggests a structured filename for a clip based on project preferences, index, and title.
 */
export function suggestName(
  title: string,
  index: number,
  totalClips = 10,
  options: NamingOptions = {}
): string {
  const {
    projectName = "",
    pattern = "{project}_{index0}_{slug}.{ext}",
    extension = ".mp4",
    separator = "_",
    maxWords = 5,
  } = options;

  const width = Math.max(2, String(totalClips).length);
  const index0 = pad(index + 1, width);
  const indexStr = String(index + 1);
  const slugStr = slug(title, separator, maxWords);
  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  const rawExt = ext.replace(/^\./, "");
  const projClean = sanitizeProjectName(projectName, separator);

  const cleanTitle = String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(/^[-_]+|[-_]+$/g, "") || "clip";

  // If pattern is used, replace placeholder tokens
  let result = pattern;

  // Handle project token
  if (projClean) {
    result = result.replace(/{project}/gi, projClean);
  } else {
    // If no project name is configured, cleanly remove {project} and adjoining separator
    result = result
      .replace(/{project}[_\-\s]*/gi, "")
      .replace(/[_\-\s]*{project}/gi, "");
    // If the pattern now starts empty or bare, fallback prefix
    if (!result || result.startsWith(".")) {
      result = `clip_${result}`;
    }
  }

  // Replace remaining tokens
  result = result
    .replace(/{index0}/gi, index0)
    .replace(/{index}/gi, indexStr)
    .replace(/{slug}/gi, slugStr)
    .replace(/{title}/gi, cleanTitle);

  // Handle extension in pattern
  if (/{ext}/i.test(result)) {
    result = result.replace(/{ext}/gi, rawExt);
  } else if (!new RegExp(`\\.${rawExt}$`, "i").test(result)) {
    result = `${result}${ext}`;
  }

  // Final cleanup of duplicate separators and invalid characters
  const extRegex = new RegExp(`\\.(${rawExt}|mp4|mkv|mov|webm)$`, "i");
  const extMatch = result.match(extRegex);
  const matchedExt = extMatch ? extMatch[0] : ext;
  let baseName = result.slice(0, result.length - matchedExt.length);

  baseName = baseName
    .replace(/[\\/:*?"<>|\s]+/g, separator)
    .replace(new RegExp(`[${separator}]+`, "g"), separator)
    .replace(new RegExp(`^${separator}+|${separator}+$`, "g"), "");

  if (!baseName) {
    baseName = `clip_${index0}`;
  }

  return `${baseName}${matchedExt}`;
}

/**
 * Cleans a filename: removes invalid OS characters, replaces spaces, ensures valid video suffix.
 */
export function cleanFileName(val: string, defaultExt = ".mp4"): string {
  let v = String(val || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[\\/:*?"<>|]/g, "");
  const hasExt = /\.(mp4|mkv|mov|webm)$/i.test(v);
  if (v && !hasExt) {
    const ext = defaultExt.startsWith(".") ? defaultExt : `.${defaultExt}`;
    v += ext;
  }
  return v;
}

/**
 * Validates a list of clips against formatting rules, duplicates, video boundaries, and overlaps.
 */
export function validateClips(
  clips: Clip[],
  videoDur = 0,
  expectedExt = ".mp4"
): ClipValidation[] {
  const names: Record<string, number> = {};
  clips.forEach(c => {
    const k = (c.output_name || "").trim().toLowerCase();
    if (k) names[k] = (names[k] || 0) + 1;
  });

  return clips.map((c, i) => {
    const issues: ValidationIssue[] = [];
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
    } else if (!/\.(mp4|mkv|mov|webm)$/i.test(n)) {
      issues.push({
        f: "output_name",
        l: "err",
        t: `File name should end in a valid video extension (${expectedExt || ".mp4"}, .mkv, .mov, or .webm).`,
      });
    } else if (/[\s\\/:*?"<>|]/.test(n)) {
      issues.push({
        f: "output_name",
        l: "err",
        t: "File name can't contain spaces or these characters: \\ / : * ? \" < > |",
      });
    } else if (names[n.toLowerCase()] > 1 && !c.ok) {
      issues.push({
        f: "output_name",
        l: "err",
        t: "Another clip uses this file name. Each clip needs its own.",
      });
    }

    if (s !== null && e !== null && e > s) {
      for (let j = 0; j < i; j++) {
        const s2 = toSec(clips[j].start);
        const e2 = toSec(clips[j].end);
        if (s2 !== null && e2 !== null && e2 > s2 && s < e2 && e > s2) {
          issues.push({
            f: "start",
            l: "warn",
            t: `Overlaps with clip ${j + 1}. That's fine if it's on purpose.`,
          });
        }
      }
    }

    return {
      issues,
      s,
      e,
      dur: s !== null && e !== null && e > s ? e - s : null,
    };
  });
}
