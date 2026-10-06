/**
 * Application state management and persistence.
 */

import { STORE_KEY } from "./constants.js";
import { toSec, fmt } from "./time.js";
import { suggestName } from "./validation.js";

let clips = [];
let uid = 0;
let undoSnap = null;
let savedSession = null;
let activeId = null;

const listeners = new Set();

function notify() {
  listeners.forEach(fn => fn(getState()));
}

/**
 * Creates a normalized clip object.
 * @param {object} o
 * @returns {object}
 */
export function makeClip(o = {}) {
  return {
    title: "",
    start: "",
    end: "",
    output_name: "",
    extra: {},
    ok: false,
    ...o,
    id: ++uid
  };
}

/**
 * Parses an array of raw JSON objects into internal clip records.
 * @param {Array<object>} arr
 * @returns {Array<object>}
 */
export function fromJSON(arr) {
  return arr.map(o => {
    const { title, start, end, output_name, _ok, ...extra } = o || {};
    return makeClip({
      title: String(title ?? ""),
      start: String(start ?? ""),
      end: String(end ?? ""),
      output_name: String(output_name ?? ""),
      extra,
      ok: _ok === true
    });
  });
}

/**
 * Formats current clips for export (excludes internal id and ok properties).
 * @param {Array<object>} [clipList=clips]
 * @returns {Array<object>}
 */
export function toJSON(clipList = clips) {
  return clipList.map(c => {
    const s = toSec(c.start);
    const e = toSec(c.end);
    return {
      title: (c.title || "").trim(),
      start: s === null ? (c.start || "").trim() : fmt(s),
      end: e === null ? (c.end || "").trim() : fmt(e),
      output_name: (c.output_name || "").trim(),
      ...c.extra
    };
  });
}

/**
 * Prepares clips for localStorage by appending _ok state.
 * @returns {Array<object>}
 */
export function toSaved() {
  const j = toJSON(clips);
  return j.map((o, i) => ({ ...o, _ok: clips[i].ok }));
}

/**
 * Saves current state into localStorage.
 */
export function persistState() {
  try {
    if (clips.length) {
      localStorage.setItem(STORE_KEY, JSON.stringify(toSaved()));
    } else {
      localStorage.removeItem(STORE_KEY);
    }
  } catch (_) {
    // Ignore storage quota/security errors
  }
}

/**
 * Reads any saved session from localStorage.
 * @returns {Array<object>|null}
 */
export function loadSavedSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (Array.isArray(saved) && saved.length) {
      savedSession = saved;
      return saved;
    }
  } catch (_) {}
  return null;
}

/**
 * Stores snapshot for undo action.
 */
export function takeSnapshot() {
  undoSnap = JSON.stringify(toSaved());
}

/**
 * Restores state from the last snapshot.
 * @returns {boolean} Whether an undo was performed
 */
export function restoreSnapshot() {
  if (!undoSnap) return false;
  clips = fromJSON(JSON.parse(undoSnap));
  undoSnap = null;
  notify();
  persistState();
  return true;
}

export function getState() {
  return {
    clips: [...clips],
    activeId,
    savedSession,
    hasUndo: Boolean(undoSnap)
  };
}

export function setActiveId(id) {
  activeId = id;
  notify();
}

export function getActiveId() {
  return activeId;
}

export function getClip(id) {
  return clips.find(c => c.id === id);
}

export function setClips(newClips) {
  clips = newClips;
  notify();
  persistState();
}

export function resumeSavedSession() {
  if (!savedSession) return false;
  clips = fromJSON(savedSession);
  savedSession = null;
  notify();
  persistState();
  return true;
}

export function addClip() {
  const last = clips[clips.length - 1];
  const start = last && toSec(last.end) !== null ? toSec(last.end) + 1 : 0;
  const newClip = makeClip({ start: fmt(start), end: fmt(start + 30) });
  clips.push(newClip);
  notify();
  persistState();
  return newClip;
}

export function removeClip(id) {
  takeSnapshot();
  const index = clips.findIndex(c => c.id === id);
  if (index >= 0) {
    clips.splice(index, 1);
    if (activeId === id) activeId = null;
    notify();
    persistState();
    return true;
  }
  return false;
}

export function duplicateClip(id) {
  takeSnapshot();
  const index = clips.findIndex(c => c.id === id);
  if (index >= 0) {
    const source = clips[index];
    const newClip = makeClip({
      ...source,
      output_name: "",
      ok: false,
      extra: { ...source.extra }
    });
    clips.splice(index + 1, 0, newClip);
    notify();
    persistState();
    return newClip;
  }
  return null;
}

export function moveClip(id, direction) {
  takeSnapshot();
  const i = clips.findIndex(c => c.id === id);
  if (i < 0) return false;
  let j = i + direction;
  while (j >= 0 && j < clips.length && clips[j].ok) {
    j += direction;
  }
  if (j >= 0 && j < clips.length) {
    [clips[i], clips[j]] = [clips[j], clips[i]];
    notify();
    persistState();
    return true;
  }
  return false;
}

export function updateClip(id, updates) {
  const clip = getClip(id);
  if (!clip) return false;
  Object.assign(clip, updates);
  notify();
  persistState();
  return true;
}

export function toggleApproval(id) {
  const i = clips.findIndex(c => c.id === id);
  if (i < 0) return null;
  const clip = clips[i];
  if (clip.ok) {
    clip.ok = false;
    setActiveId(clip.id);
    notify();
    persistState();
    return { clip, index: i, approved: false, nextId: null };
  } else {
    takeSnapshot();
    clip.ok = true;
    let nextId = null;
    for (let k = 1; k < clips.length; k++) {
      const nextCandidate = clips[(i + k) % clips.length];
      if (!nextCandidate.ok) {
        nextId = nextCandidate.id;
        break;
      }
    }
    if (nextId !== null) {
      setActiveId(nextId);
    }
    notify();
    persistState();
    return { clip, index: i, approved: true, nextId };
  }
}

export function resetAllApprovals() {
  if (!clips.some(c => c.ok)) return false;
  takeSnapshot();
  clips.forEach(c => (c.ok = false));
  notify();
  persistState();
  return true;
}

export function sortClipsByStart() {
  takeSnapshot();
  clips.sort((a, b) => (toSec(a.start) ?? Infinity) - (toSec(b.start) ?? Infinity));
  notify();
  persistState();
}

export function suggestAllNames() {
  const open = clips.filter(c => !c.ok).length;
  if (!open) return 0;
  takeSnapshot();
  clips.forEach((c, i) => {
    if (!c.ok) {
      c.output_name = suggestName(c.title, i, clips.length);
    }
  });
  notify();
  persistState();
  return open;
}

export function clearAll() {
  takeSnapshot();
  clips = [];
  savedSession = null;
  activeId = null;
  notify();
  persistState();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
