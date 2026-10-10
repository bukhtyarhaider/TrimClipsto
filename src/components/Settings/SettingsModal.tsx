import React, { useState } from "react";
import { useSettingsStore, DEFAULT_SETTINGS } from "../../store/useSettingsStore";
import { useClipStore } from "../../store/useClipStore";
import { suggestName, sanitizeProjectName } from "../../utils/validation";
import { Button } from "../ui/Button";
import { Logo } from "../ui/Logo";
import {
  X,
  Settings as SettingsIcon,
  FolderEdit,
  Film,
  FileJson,
  Zap,
  RotateCcw,
  Trash2,
  Check,
  Sparkles,
  Info,
  User,
  ExternalLink,
} from "lucide-react";

type SettingsTab = "project" | "playback" | "export" | "workflow" | "storage" | "about";

export function SettingsModal() {
  const { isOpen, closeSettings, settings, updateSettings, resetSettings } =
    useSettingsStore();
  const { clearAll, showToast, openConfirmModal } = useClipStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>("project");

  if (!isOpen) return null;

  // Generate live sample preview based on active settings
  const sampleName = suggestName("Why AI Won't Replace You", 0, 10, {
    projectName: settings.projectName,
    pattern: settings.namingPattern,
    extension: settings.fileExtension,
    separator: settings.slugSeparator,
    maxWords: settings.maxSlugWords,
  });

  const sep = settings.slugSeparator;
  const patternPresets = [
    { label: "Project + Number + Title", pattern: `{project}${sep}{index0}${sep}{slug}.{ext}` },
    { label: "Project + Title + Number", pattern: `{project}${sep}{slug}${sep}{index0}.{ext}` },
    { label: "Classic Clip + Number", pattern: `clip${sep}{index0}${sep}{slug}.{ext}` },
    { label: "Number + Title", pattern: `{index0}${sep}{slug}.{ext}` },
  ];

  const handleResetSettings = () => {
    openConfirmModal(
      "Reset All Settings",
      "Are you sure you want to restore all settings to their default values?",
      () => {
        resetSettings();
        showToast("Settings reset to defaults");
      }
    );
  };

  const handleClearSession = () => {
    openConfirmModal(
      "Clear Session Data",
      "Are you sure you want to clear all loaded clips and stored workspace data? This cannot be undone.",
      () => {
        clearAll();
        closeSettings();
      }
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={closeSettings}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="settings-dialog-title" className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Workspace Settings
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Configure project preferences, naming conventions, and video workflows.
              </p>
            </div>
          </div>
          <button
            onClick={closeSettings}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("project")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === "project"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <FolderEdit className="w-3.5 h-3.5" />
            Project & Naming
          </button>
          <button
            onClick={() => setActiveTab("playback")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === "playback"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Video & Playback
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === "export"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            JSON & Export
          </button>
          <button
            onClick={() => setActiveTab("workflow")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === "workflow"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Workflow
          </button>
          <button
            onClick={() => setActiveTab("storage")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === "storage"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Storage & Reset
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === "about"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            About
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-zinc-800 dark:text-zinc-200">
          {/* TAB 1: Project & Naming */}
          {activeTab === "project" && (
            <div className="space-y-6">
              {/* Project Name Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Project Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={settings.projectName}
                    onChange={e => updateSettings({ projectName: e.target.value })}
                    placeholder="e.g. MyPodcast_Ep12 or DevVlog_01"
                    className="w-full text-sm font-medium p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  {settings.projectName && (
                    <span className="absolute right-3 top-3 text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                      prefix: {sanitizeProjectName(settings.projectName, settings.slugSeparator)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Used directly in generated clip file names and as the default downloaded JSON name ({sanitizeProjectName(settings.projectName) || "clips"}.json).
                </p>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live Filename Preview
                </div>
                <div className="font-mono text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 break-all select-all">
                  {sampleName}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Generated for clip 1 with title <em>"Why AI Won't Replace You"</em>.
                </p>
              </div>

              {/* Naming Pattern Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Filename Template Presets
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {patternPresets.map(preset => (
                    <button
                      key={preset.pattern}
                      onClick={() => updateSettings({ namingPattern: preset.pattern })}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        settings.namingPattern === preset.pattern
                          ? "bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500"
                          : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="text-xs font-semibold">{preset.label}</div>
                      <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                        {preset.pattern}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Naming Pattern Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Custom Template String
                </label>
                <input
                  type="text"
                  value={settings.namingPattern}
                  onChange={e => updateSettings({ namingPattern: e.target.value })}
                  placeholder="{project}_{index0}_{slug}.{ext}"
                  className="w-full text-xs font-mono p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["{project}", "{index0}", "{index}", "{slug}", "{title}", "{ext}"].map(token => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => {
                        if (!settings.namingPattern.includes(token)) {
                          updateSettings({ namingPattern: `${settings.namingPattern}_${token}` });
                        }
                      }}
                      className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                      title={`Append ${token}`}
                    >
                      +{token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extension & Separator Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* File Extension */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    File Extension
                  </label>
                  <select
                    value={settings.fileExtension}
                    onChange={e => updateSettings({ fileExtension: e.target.value as any })}
                    className="w-full text-xs font-mono p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value=".mp4">.mp4</option>
                    <option value=".mkv">.mkv</option>
                    <option value=".mov">.mov</option>
                    <option value=".webm">.webm</option>
                  </select>
                </div>

                {/* Slug Word Separator */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Word Separator
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = settings.namingPattern.replace(/-/g, "_");
                        updateSettings({ slugSeparator: "_", namingPattern: updated });
                      }}
                      className={`flex-1 py-2 text-xs font-mono font-bold rounded-xl border transition-colors cursor-pointer ${
                        settings.slugSeparator === "_"
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      _ (snake)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = settings.namingPattern.replace(/_/g, "-");
                        updateSettings({ slugSeparator: "-", namingPattern: updated });
                      }}
                      className={`flex-1 py-2 text-xs font-mono font-bold rounded-xl border transition-colors cursor-pointer ${
                        settings.slugSeparator === "-"
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      - (kebab)
                    </button>
                  </div>
                </div>

                {/* Max Slug Words */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Max Title Words: {settings.maxSlugWords}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={settings.maxSlugWords}
                    onChange={e => updateSettings({ maxSlugWords: Number(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Video & Playback */}
          {activeTab === "playback" && (
            <div className="space-y-6">
              {/* Timeline FPS */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Timeline Frame Rate (FPS)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[23.976, 24, 25, 29.97, 30, 60].map(fpsVal => (
                    <button
                      key={fpsVal}
                      type="button"
                      onClick={() => updateSettings({ fps: fpsVal })}
                      className={`p-2 rounded-xl border text-xs font-mono font-semibold transition-colors cursor-pointer ${
                        settings.fps === fpsVal
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {fpsVal} fps
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Determines step size for frame-by-frame stepping (<kbd className="font-mono">,</kbd> and <kbd className="font-mono">.</kbd> keys: 1/{settings.fps}s).
                </p>
              </div>

              {/* Default Clip Duration */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Default New Clip Duration
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={5}
                    max={300}
                    step={5}
                    value={settings.defaultClipDuration}
                    onChange={e => updateSettings({ defaultClipDuration: Math.max(5, Number(e.target.value)) })}
                    className="w-32 text-sm font-mono p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-zinc-500">seconds (e.g. 15s for shorts, 30s or 60s for standard clips)</span>
                </div>
              </div>

              {/* Nudge Deltas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Small Nudge (← / →)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0.1}
                      max={5}
                      step={0.1}
                      value={settings.nudgeSmall}
                      onChange={e => updateSettings({ nudgeSmall: Math.max(0.1, Number(e.target.value)) })}
                      className="w-24 text-xs font-mono p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                    <span className="text-xs text-zinc-500">seconds</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Large Nudge (Shift + ← / →)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      step={1}
                      value={settings.nudgeLarge}
                      onChange={e => updateSettings({ nudgeLarge: Math.max(1, Number(e.target.value)) })}
                      className="w-24 text-xs font-mono p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                    />
                    <span className="text-xs text-zinc-500">seconds</span>
                  </div>
                </div>
              </div>

              {/* Auto Loop Preview */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Loop Clip Preview by Default
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Continuously replay the active clip between In and Out points during clip preview.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.loopClipPlayback}
                  onChange={e => updateSettings({ loopClipPlayback: e.target.checked })}
                  className="w-5 h-5 rounded accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 3: JSON & Export */}
          {activeTab === "export" && (
            <div className="space-y-6">
              {/* Timestamp Format */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  Export Timestamp Format
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: "timecode", label: "Full Timecode", example: "00:01:23.500" },
                    { id: "short", label: "Short Timecode", example: "01:23.500" },
                    { id: "seconds", label: "Raw Seconds (Float)", example: "83.500" },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateSettings({ timestampFormat: item.id as any })}
                      className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        settings.timestampFormat === item.id
                          ? "bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500"
                          : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-1">
                        {item.example}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Raw decimal seconds are ideal for downstream FFmpeg / Python scripts; full timecode is best for human editing.
                </p>
              </div>

              {/* Strict Approval Requirement */}
              <div className="flex items-start justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Strict Approval Guard
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    When enabled, downloading JSON requires all clips to be approved and locked. When disabled, draft unapproved clips can be downloaded.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.strictApprovalGuard}
                  onChange={e => updateSettings({ strictApprovalGuard: e.target.checked })}
                  className="w-5 h-5 rounded accent-blue-500 cursor-pointer mt-0.5"
                />
              </div>

              {/* JSON Indentation */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                  JSON Indentation
                </label>
                <div className="flex gap-2">
                  {[
                    { id: "2", label: "2 Spaces (Standard)" },
                    { id: "4", label: "4 Spaces" },
                    { id: "minified", label: "Minified (Compact)" },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateSettings({ jsonIndent: item.id as any })}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        settings.jsonIndent === item.id
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Workflow */}
          {activeTab === "workflow" && (
            <div className="space-y-4">
              {/* Auto Advance on Approval */}
              <div className="flex items-start justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Auto-Advance to Next Clip on Approval
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    When approving a clip in Studio Mode (<kbd className="font-mono">Enter</kbd>) or via the Approve button, automatically jump focus and playhead to the next unapproved clip.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoAdvanceOnApprove}
                  onChange={e => updateSettings({ autoAdvanceOnApprove: e.target.checked })}
                  className="w-5 h-5 rounded accent-blue-500 cursor-pointer mt-0.5"
                />
              </div>

              {/* Auto Seek on Card Select */}
              <div className="flex items-start justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Auto-Seek Playhead When Selecting a Clip
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Clicking any clip card in the list automatically moves the video playhead to that clip's start time.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSeekOnSelect}
                  onChange={e => updateSettings({ autoSeekOnSelect: e.target.checked })}
                  className="w-5 h-5 rounded accent-blue-500 cursor-pointer mt-0.5"
                />
              </div>
            </div>
          )}

          {/* TAB 5: Storage & Reset */}
          {activeTab === "storage" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Reset Settings to Defaults
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Restores all filename patterns, FPS, and workflow preferences to factory defaults.
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={handleResetSettings}
                >
                  Reset Defaults
                </Button>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-rose-700 dark:text-rose-400">
                    Wipe Workspace Session Data
                  </div>
                  <div className="text-xs text-rose-600/80 dark:text-rose-400/80">
                    Removes all clips from local storage and starts a completely fresh workspace session.
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={handleClearSession}
                >
                  Clear Session
                </Button>
              </div>
            </div>
          )}

          {/* TAB 6: About & Developer */}
          {activeTab === "about" && (
            <div className="space-y-6">
              {/* App Brand Hero */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-cyan-500/10 border border-blue-500/20 text-center space-y-3">
                <div className="inline-flex p-3 rounded-2xl bg-white dark:bg-zinc-800 shadow-md">
                  <Logo size="md" showBadge={false} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Trim Clipsto
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                    v1.0.0 • Pro Video Workstation
                  </p>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-md mx-auto leading-relaxed">
                  A high-performance, client-side video workstation designed for video editors,
                  content creators, and automated clipping pipelines.
                </p>
              </div>

              {/* Developer Profile Card */}
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                      BH
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Bukhtyar Haider
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Creator & Lead Developer
                      </div>
                    </div>
                  </div>

                  <a
                    href="https://github.com/bukhtyarhaider"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors shadow-xs w-fit"
                  >
                    <span>@bukhtyarhaider</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                  </a>
                </div>
              </div>

              {/* Architecture & Tech Stack Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80">
                  <span className="text-zinc-400 dark:text-zinc-500 block text-[10px] uppercase font-mono">
                    Frontend
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    React 18 + TS
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80">
                  <span className="text-zinc-400 dark:text-zinc-500 block text-[10px] uppercase font-mono">
                    Styling
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Tailwind v4
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80">
                  <span className="text-zinc-400 dark:text-zinc-500 block text-[10px] uppercase font-mono">
                    State
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Zustand
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80">
                  <span className="text-zinc-400 dark:text-zinc-500 block text-[10px] uppercase font-mono">
                    Privacy
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    100% Offline
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              Trim Clipsto • Developed by{" "}
              <strong className="text-zinc-700 dark:text-zinc-300">
                Bukhtyar Haider
              </strong>
            </span>
          </div>
          <Button variant="primary" size="sm" onClick={closeSettings}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
