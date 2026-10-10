import { create } from "zustand";
import { Clip, MediaInspectInfo, PlayingClipState, TimeFormatOption } from "../types";
import { STORE_KEY, DEFAULT_STATUS } from "../utils/constants";
import { toSec, fmt, fmtShort } from "../utils/time";
import { suggestName } from "../utils/validation";
import { inspectFileMedia } from "../utils/mediaInspect";
import { useSettingsStore } from "./useSettingsStore";

let uidCounter = 0;

export function makeClip(o: Partial<Clip> = {}): Clip {
  return {
    id: ++uidCounter,
    title: "",
    start: "",
    end: "",
    output_name: "",
    ok: false,
    extra: {},
    ...o,
  };
}

export function fromJSON(arr: any[]): Clip[] {
  return arr.map(o => {
    const { title, start, end, output_name, _ok, ...extra } = o || {};
    return makeClip({
      title: String(title ?? ""),
      start: String(start ?? ""),
      end: String(end ?? ""),
      output_name: String(output_name ?? ""),
      extra: extra || {},
      ok: _ok === true,
    });
  });
}

export function toExportJSON(clips: Clip[], formatOverride?: TimeFormatOption): any[] {
  const format =
    formatOverride || useSettingsStore.getState().settings.timestampFormat || "timecode";
  return clips.map(c => {
    const s = toSec(c.start);
    const e = toSec(c.end);
    let startVal: any = (c.start || "").trim();
    let endVal: any = (c.end || "").trim();

    if (s !== null) {
      if (format === "seconds") {
        startVal = Number(s.toFixed(3));
      } else if (format === "short") {
        startVal = fmtShort(s);
      } else {
        startVal = fmt(s);
      }
    }

    if (e !== null) {
      if (format === "seconds") {
        endVal = Number(e.toFixed(3));
      } else if (format === "short") {
        endVal = fmtShort(e);
      } else {
        endVal = fmt(e);
      }
    }

    return {
      title: (c.title || "").trim(),
      start: startVal,
      end: endVal,
      output_name: (c.output_name || "").trim(),
      ...(c.extra || {}),
    };
  });
}

function toSavedJSON(clips: Clip[]): any[] {
  const exported = toExportJSON(clips, "timecode");
  return exported.map((o, i) => ({ ...o, _ok: clips[i].ok }));
}

function persistToStorage(clips: Clip[]) {
  try {
    if (clips.length) {
      localStorage.setItem(STORE_KEY, JSON.stringify(toSavedJSON(clips)));
    } else {
      localStorage.removeItem(STORE_KEY);
    }
  } catch (_) {
    // Ignore quota/security errors
  }
}

interface ToastState {
  show: boolean;
  message: string;
  withUndo?: boolean;
}

interface ConfirmState {
  title: string;
  message: string;
  onConfirm: () => void;
}

interface ClipStoreState {
  // Clip state
  clips: Clip[];
  activeId: number | null;
  savedSession: any[] | null;
  undoSnap: string | null;

  // Video playback state
  videoFile: File | null;
  videoUrl: string | null;
  videoDuration: number;
  currentTime: number;
  isPlaying: boolean;
  playingClip: PlayingClipState | null;
  isStudioOpen: boolean;
  isLooping: boolean;
  playbackRate: number;
  mediaInspectInfo: MediaInspectInfo | null;
  fixDismissed: boolean;
  statusText: string;
  isStatusBad: boolean;

  // Dialog & Toast state
  toast: ToastState | null;
  isPasteOpen: boolean;
  confirmModal: ConfirmState | null;

  // Clip actions
  setClips: (clips: Clip[]) => void;
  addClip: (startSec?: number) => Clip;
  removeClip: (id: number) => boolean;
  duplicateClip: (id: number) => Clip | null;
  moveClip: (id: number, direction: -1 | 1) => boolean;
  updateClip: (id: number, updates: Partial<Clip>) => void;
  nudgeClipTime: (id: number, field: "start" | "end", delta: number) => void;
  toggleApproval: (id: number) => { clip: Clip; index: number; approved: boolean; nextId: number | null } | null;
  resetAllApprovals: () => boolean;
  sortClipsByStart: () => void;
  suggestAllNames: () => number;
  suggestClipName: (id: number) => void;
  clearAll: () => void;
  setActiveId: (id: number | null) => void;
  takeSnapshot: () => void;
  restoreSnapshot: () => boolean;
  loadSavedSession: () => any[] | null;
  resumeSavedSession: () => boolean;
  importText: (text: string) => Promise<string | null>;

  // Video actions
  loadVideoFile: (file: File) => void;
  removeVideo: () => void;
  setCurrentTime: (t: number) => void;
  setVideoDuration: (d: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlayingClip: (clip: PlayingClipState | null) => void;
  setIsStudioOpen: (open: boolean) => void;
  setIsLooping: (loop: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setStatus: (text: string, isBad?: boolean) => void;
  setFixDismissed: (dismissed: boolean) => void;

  // UI actions
  showToast: (message: string, withUndo?: boolean) => void;
  hideToast: () => void;
  openPasteModal: () => void;
  closePasteModal: () => void;
  openConfirmModal: (title: string, message: string, onConfirm: () => void) => void;
  closeConfirmModal: () => void;
}

let toastTimer: any = null;

export const useClipStore = create<ClipStoreState>((set, get) => ({
  clips: [],
  activeId: null,
  savedSession: null,
  undoSnap: null,

  videoFile: null,
  videoUrl: null,
  videoDuration: 0,
  currentTime: 0,
  isPlaying: false,
  playingClip: null,
  isStudioOpen: false,
  isLooping: false,
  playbackRate: 1,
  mediaInspectInfo: null,
  fixDismissed: false,
  statusText: DEFAULT_STATUS,
  isStatusBad: false,

  toast: null,
  isPasteOpen: false,
  confirmModal: null,

  setClips: (clips: Clip[]) => {
    set({ clips });
    persistToStorage(clips);
  },

  addClip: (startSec?: number) => {
    const { clips, currentTime } = get();
    const last = clips[clips.length - 1];
    let start: number;
    if (startSec !== undefined) {
      start = startSec;
    } else if (last && toSec(last.end) !== null) {
      start = toSec(last.end)! + 1;
    } else {
      start = currentTime || 0;
    }

    const defaultDur = useSettingsStore.getState().settings.defaultClipDuration || 30;
    const newClip = makeClip({
      start: fmt(start),
      end: fmt(start + defaultDur),
    });
    const updated = [...clips, newClip];
    set({ clips: updated, activeId: newClip.id });
    persistToStorage(updated);
    return newClip;
  },

  removeClip: (id: number) => {
    const { clips, activeId } = get();
    const index = clips.findIndex(c => c.id === id);
    if (index >= 0) {
      if (clips[index].ok) {
        get().showToast("Clip is approved and locked. Unapprove it before deleting.");
        return false;
      }
      get().takeSnapshot();
      const updated = clips.filter(c => c.id !== id);
      set({
        clips: updated,
        activeId: activeId === id ? null : activeId,
      });
      persistToStorage(updated);
      get().showToast("Clip removed", true);
      return true;
    }
    return false;
  },

  duplicateClip: (id: number) => {
    get().takeSnapshot();
    const { clips } = get();
    const index = clips.findIndex(c => c.id === id);
    if (index >= 0) {
      const source = clips[index];
      const newClip = makeClip({
        ...source,
        output_name: "",
        ok: false,
        extra: { ...source.extra },
      });
      const updated = [...clips];
      updated.splice(index + 1, 0, newClip);
      set({ clips: updated, activeId: newClip.id });
      persistToStorage(updated);
      get().showToast("Clip duplicated", true);
      return newClip;
    }
    return null;
  },

  moveClip: (id: number, direction: -1 | 1) => {
    const { clips } = get();
    const i = clips.findIndex(c => c.id === id);
    if (i < 0) return false;
    const clip = clips[i];
    if (clip && clip.ok) {
      get().showToast("Clip is approved and locked. Unapprove it to make changes.");
      return false;
    }
    get().takeSnapshot();
    let j = i + direction;
    while (j >= 0 && j < clips.length && clips[j].ok) {
      j += direction;
    }
    if (j >= 0 && j < clips.length) {
      const updated = [...clips];
      const temp = updated[i];
      updated[i] = updated[j];
      updated[j] = temp;
      set({ clips: updated });
      persistToStorage(updated);
      return true;
    }
    return false;
  },

  updateClip: (id: number, updates: Partial<Clip>) => {
    const { clips } = get();
    const clip = clips.find(c => c.id === id);
    if (clip && clip.ok && updates.ok === undefined) {
      get().showToast("Clip is approved and locked. Unapprove it to make changes.");
      return;
    }
    const updated = clips.map(c => (c.id === id ? { ...c, ...updates } : c));
    set({ clips: updated });
    persistToStorage(updated);
  },

  nudgeClipTime: (id: number, field: "start" | "end", delta: number) => {
    const clip = get().clips.find(c => c.id === id);
    if (!clip) return;
    if (clip.ok) {
      get().showToast("Clip is approved and locked. Unapprove it to make changes.");
      return;
    }
    const currentVal = toSec(clip[field]);
    const base = currentVal !== null ? currentVal : get().currentTime;
    const newVal = Math.max(0, base + delta);
    get().updateClip(id, { [field]: fmt(newVal) });
  },

  toggleApproval: (id: number) => {
    const { clips } = get();
    const i = clips.findIndex(c => c.id === id);
    if (i < 0) return null;
    const clip = clips[i];

    if (clip.ok) {
      // Unapprove
      const updated = clips.map(c => (c.id === id ? { ...c, ok: false } : c));
      set({ clips: updated, activeId: id });
      persistToStorage(updated);
      return { clip: { ...clip, ok: false }, index: i, approved: false, nextId: null };
    } else {
      // Approve
      get().takeSnapshot();
      const autoAdvance = useSettingsStore.getState().settings.autoAdvanceOnApprove;
      let nextId: number | null = null;
      if (autoAdvance) {
        for (let k = 1; k < clips.length; k++) {
          const nextCandidate = clips[(i + k) % clips.length];
          if (!nextCandidate.ok) {
            nextId = nextCandidate.id;
            break;
          }
        }
      }
      const updated = clips.map(c => (c.id === id ? { ...c, ok: true } : c));
      set({
        clips: updated,
        activeId: nextId !== null ? nextId : id,
      });
      persistToStorage(updated);
      return { clip: { ...clip, ok: true }, index: i, approved: true, nextId };
    }
  },

  resetAllApprovals: () => {
    const { clips } = get();
    if (!clips.some(c => c.ok)) return false;
    get().takeSnapshot();
    const updated = clips.map(c => ({ ...c, ok: false }));
    set({ clips: updated });
    persistToStorage(updated);
    get().showToast("All approvals reset", true);
    return true;
  },

  sortClipsByStart: () => {
    get().takeSnapshot();
    const { clips } = get();
    const updated = [...clips].sort(
      (a, b) => (toSec(a.start) ?? Infinity) - (toSec(b.start) ?? Infinity)
    );
    set({ clips: updated });
    persistToStorage(updated);
    get().showToast("Clips sorted by start time", true);
  },

  suggestClipName: (id: number) => {
    const { clips } = get();
    const i = clips.findIndex(c => c.id === id);
    if (i < 0) return;
    if (clips[i].ok) {
      get().showToast("Clip is approved and locked. Unapprove it to make changes.");
      return;
    }
    const settings = useSettingsStore.getState().settings;
    const name = suggestName(clips[i].title, i, clips.length, {
      projectName: settings.projectName,
      pattern: settings.namingPattern,
      extension: settings.fileExtension,
      separator: settings.slugSeparator,
      maxWords: settings.maxSlugWords,
    });
    get().updateClip(id, { output_name: name });
  },

  suggestAllNames: () => {
    const { clips } = get();
    const openCount = clips.filter(c => !c.ok).length;
    if (!openCount) return 0;
    get().takeSnapshot();
    const settings = useSettingsStore.getState().settings;
    const updated = clips.map((c, i) => {
      if (!c.ok) {
        return {
          ...c,
          output_name: suggestName(c.title, i, clips.length, {
            projectName: settings.projectName,
            pattern: settings.namingPattern,
            extension: settings.fileExtension,
            separator: settings.slugSeparator,
            maxWords: settings.maxSlugWords,
          }),
        };
      }
      return c;
    });
    set({ clips: updated });
    persistToStorage(updated);
    get().showToast(`Generated names for ${openCount} clip${openCount === 1 ? "" : "s"}`, true);
    return openCount;
  },

  clearAll: () => {
    get().takeSnapshot();
    set({
      clips: [],
      savedSession: null,
      activeId: null,
    });
    persistToStorage([]);
    get().showToast("Cleared all clips", true);
  },

  setActiveId: (id: number | null) => {
    set({ activeId: id });
  },

  takeSnapshot: () => {
    const { clips } = get();
    set({ undoSnap: JSON.stringify(toSavedJSON(clips)) });
  },

  restoreSnapshot: () => {
    const { undoSnap } = get();
    if (!undoSnap) return false;
    try {
      const parsed = JSON.parse(undoSnap);
      const restored = fromJSON(parsed);
      set({ clips: restored, undoSnap: null });
      persistToStorage(restored);
      get().showToast("Undo completed");
      return true;
    } catch (_) {
      return false;
    }
  },

  loadSavedSession: () => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length) {
          set({ savedSession: saved });
          return saved;
        }
      }
    } catch (_) {}
    return null;
  },

  resumeSavedSession: () => {
    const { savedSession } = get();
    if (!savedSession) return false;
    const resumed = fromJSON(savedSession);
    set({ clips: resumed, savedSession: null, activeId: resumed[0]?.id || null });
    persistToStorage(resumed);
    get().showToast(`Resumed ${resumed.length} clips from your saved session`);
    return true;
  },

  importText: async (text: string): Promise<string | null> => {
    try {
      const raw = text.trim();
      if (!raw) return "The text you pasted is empty.";
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return "JSON must be a list (array) of clip objects.";
      }
      if (!parsed.length) {
        return "The list in this JSON file doesn't have any clips.";
      }
      get().takeSnapshot();
      const imported = fromJSON(parsed);
      set({ clips: imported, activeId: imported[0]?.id || null });
      persistToStorage(imported);
      get().showToast(`Loaded ${imported.length} clips`, true);
      return null;
    } catch (err: any) {
      return `Couldn't read this JSON: ${err.message}`;
    }
  },

  loadVideoFile: (file: File) => {
    const prevUrl = get().videoUrl;
    if (prevUrl) URL.revokeObjectURL(prevUrl);

    const url = URL.createObjectURL(file);
    set({
      videoFile: file,
      videoUrl: url,
      videoDuration: 0,
      currentTime: 0,
      playingClip: null,
      fixDismissed: false,
      mediaInspectInfo: null,
      statusText: `Loading video ${file.name}…`,
    });

    inspectFileMedia(file).then(info => {
      set({ mediaInspectInfo: info });
      if (info.isUnsupportedAudio) {
        set({
          statusText: `Video loaded. Note: Audio (${info.audioName || "AC-3 / DTS"}) requires conversion for browser audio playback.`,
          isStatusBad: false,
        });
      }
    });
  },

  removeVideo: () => {
    const prevUrl = get().videoUrl;
    if (prevUrl) URL.revokeObjectURL(prevUrl);
    set({
      videoFile: null,
      videoUrl: null,
      videoDuration: 0,
      currentTime: 0,
      isPlaying: false,
      playingClip: null,
      isStudioOpen: false,
      mediaInspectInfo: null,
      fixDismissed: false,
      statusText: DEFAULT_STATUS,
    });
    get().showToast("Video removed");
  },

  setCurrentTime: (t: number) => set({ currentTime: t }),
  setVideoDuration: (d: number) => set({ videoDuration: d }),
  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),
  setPlayingClip: (clip: PlayingClipState | null) => set({ playingClip: clip }),
  setIsStudioOpen: (open: boolean) => set({ isStudioOpen: open }),
  setIsLooping: (loop: boolean) => set({ isLooping: loop }),
  setPlaybackRate: (rate: number) => set({ playbackRate: rate }),
  setStatus: (text: string, isBad = false) => set({ statusText: text, isStatusBad: isBad }),
  setFixDismissed: (dismissed: boolean) => set({ fixDismissed: dismissed }),

  showToast: (message: string, withUndo = false) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: { show: true, message, withUndo } });
    toastTimer = setTimeout(() => {
      set({ toast: null });
    }, withUndo ? 7000 : 2800);
  },

  hideToast: () => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: null });
  },

  openPasteModal: () => set({ isPasteOpen: true }),
  closePasteModal: () => set({ isPasteOpen: false }),

  openConfirmModal: (title: string, message: string, onConfirm: () => void) => {
    set({ confirmModal: { title, message, onConfirm } });
  },

  closeConfirmModal: () => set({ confirmModal: null }),
}));
