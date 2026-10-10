import { useRef } from "react";
import { useClipStore, toExportJSON } from "../../store/useClipStore";
import { useThemeStore } from "../../store/useThemeStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { sanitizeProjectName } from "../../utils/validation";
import { Button } from "../ui/Button";
import { Logo } from "../ui/Logo";
import {
  FolderOpen,
  Clipboard,
  Video,
  Maximize2,
  Download,
  CheckCircle2,
  Sun,
  Moon,
  Settings,
  FolderKanban,
  Check,
} from "lucide-react";

export function Header() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const {
    clips,
    videoUrl,
    isStudioOpen,
    setIsStudioOpen,
    loadVideoFile,
    importText,
    openPasteModal,
    showToast,
    setActiveId,
  } = useClipStore();

  const { theme, toggleTheme } = useThemeStore();
  const { settings, setProjectName, openSettings } = useSettingsStore();

  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const err = await importText(text);
      if (err) alert(err);
    } catch (err: any) {
      alert("Error reading file: " + err.message);
    }
    e.target.value = "";
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadVideoFile(file);
    }
    e.target.value = "";
  };

  const handleDownload = () => {
    if (!clips.length) return;
    const { strictApprovalGuard, projectName, jsonIndent, timestampFormat } =
      useSettingsStore.getState().settings;

    const unapproved = clips.filter(c => !c.ok);
    if (unapproved.length && strictApprovalGuard) {
      showToast(
        `${unapproved.length} clip${unapproved.length === 1 ? " still needs" : "s still need"} approval before download`
      );
      setActiveId(unapproved[0].id);
      return;
    }

    const exported = toExportJSON(clips, timestampFormat);
    const indent = jsonIndent === "minified" ? undefined : Number(jsonIndent);
    const jsonString = indent
      ? JSON.stringify(exported, null, indent) + "\n"
      : JSON.stringify(exported);

    const blob = new Blob([jsonString], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = projectName.trim() ? sanitizeProjectName(projectName) : "clips";
    a.download = `${baseName}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    if (unapproved.length) {
      showToast(
        `Downloaded ${a.download} (${unapproved.length} draft clip${
          unapproved.length === 1 ? "" : "s"
        })`
      );
    } else {
      showToast(`Downloaded ${a.download}`);
    }
  };

  const approvedCount = clips.filter(c => c.ok).length;
  const isAllApproved = clips.length > 0 && approvedCount === clips.length;

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleJsonUpload}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*,.mkv,.mov,.m4v,.webm"
        className="hidden"
        onChange={handleVideoUpload}
      />

      {/* Left: Brand & Inline Project Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Logo size="sm" showBadge={false} />

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />

        {/* Project Name Breadcrumb */}
        <div className="flex items-center gap-1.5 min-w-0 group">
          <FolderKanban className="w-3.5 h-3.5 text-zinc-400 group-focus-within:text-blue-500 shrink-0 transition-colors" />
          <input
            type="text"
            value={settings.projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder="Untitled Project"
            title="Click to rename project (drives file naming and export name)"
            className="text-xs sm:text-sm font-semibold bg-transparent hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 focus:bg-white dark:focus:bg-zinc-900 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/80 focus:border-blue-500/50 rounded-lg px-2 py-1 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none w-32 sm:w-48 transition-all truncate"
          />
        </div>
      </div>

      {/* Right: Grouped Tool Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Ingest Actions Segmented Group */}
        <div className="flex items-center bg-zinc-100/90 dark:bg-zinc-900/90 p-0.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Open JSON clip file"
          >
            <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
            <span>Open</span>
          </button>
          <button
            onClick={openPasteModal}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Paste JSON from clipboard"
          >
            <Clipboard className="w-3.5 h-3.5 text-zinc-400" />
            <span>Paste</span>
          </button>
          <div className="w-px h-3.5 bg-zinc-200 dark:bg-zinc-800 mx-0.5" />
          <button
            onClick={() => videoInputRef.current?.click()}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              videoUrl
                ? "text-emerald-700 dark:text-emerald-400 hover:bg-white dark:hover:bg-zinc-800 font-semibold"
                : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800"
            }`}
            title={videoUrl ? "Video loaded (click to replace)" : "Load video file for playback"}
          >
            <Video className={`w-3.5 h-3.5 ${videoUrl ? "text-emerald-500" : "text-blue-500"}`} />
            <span>{videoUrl ? "Video Loaded" : "Video"}</span>
          </button>
        </div>

        {/* Studio View Button */}
        <Button
          variant={isStudioOpen ? "primary" : "accent"}
          size="sm"
          icon={<Maximize2 className="w-3.5 h-3.5" />}
          kbd="M"
          onClick={() => setIsStudioOpen(!isStudioOpen)}
          title="Toggle Fullscreen Studio View (M)"
        >
          Studio
        </Button>

        {/* Utility Icon Buttons: Settings & Theme */}
        <button
          onClick={openSettings}
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800/80 transition-colors cursor-pointer"
          title="Settings (Project Name, Naming Rules & Preferences)"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800/80 transition-colors cursor-pointer"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Primary Download CTA */}
        <Button
          variant={isAllApproved ? "primary" : "secondary"}
          size="sm"
          icon={
            isAllApproved ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )
          }
          onClick={handleDownload}
          disabled={!clips.length}
        >
          <span>Download</span>
          {clips.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-200/70 dark:bg-zinc-700/70 text-zinc-700 dark:text-zinc-200 ml-0.5">
              {approvedCount}/{clips.length}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}
