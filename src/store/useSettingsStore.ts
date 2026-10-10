import { create } from "zustand";
import { AppSettings } from "../types";

const SETTINGS_STORAGE_KEY = "trimclipsto-settings-v1";

export const DEFAULT_SETTINGS: AppSettings = {
  // Project Name
  projectName: "",

  // Naming & Files
  namingPattern: "{project}_{index0}_{slug}.{ext}",
  fileExtension: ".mp4",
  slugSeparator: "_",
  maxSlugWords: 5,

  // Video & Playback
  fps: 30,
  defaultClipDuration: 30,
  nudgeSmall: 1.0,
  nudgeLarge: 5.0,
  loopClipPlayback: false,

  // Export & JSON
  timestampFormat: "timecode",
  strictApprovalGuard: true,
  jsonIndent: "2",

  // Workflow
  autoAdvanceOnApprove: true,
  autoSeekOnSelect: true,
};

function loadStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (_) {
    // Ignore storage parse errors
  }
  return { ...DEFAULT_SETTINGS };
}

function persistSettings(settings: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (_) {
    // Ignore quota errors
  }
}

interface SettingsStoreState {
  settings: AppSettings;
  isOpen: boolean;

  openSettings: () => void;
  closeSettings: () => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  setProjectName: (name: string) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  settings: loadStoredSettings(),
  isOpen: false,

  openSettings: () => set({ isOpen: true }),
  closeSettings: () => set({ isOpen: false }),

  updateSettings: (partial: Partial<AppSettings>) => {
    const current = get().settings;
    const updated = { ...current, ...partial };
    set({ settings: updated });
    persistSettings(updated);
  },

  setProjectName: (name: string) => {
    get().updateSettings({ projectName: name });
  },

  resetSettings: () => {
    set({ settings: { ...DEFAULT_SETTINGS } });
    persistSettings(DEFAULT_SETTINGS);
  },
}));
