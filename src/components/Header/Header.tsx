import { useRef } from "react";
import { useClipStore, toExportJSON } from "../../store/useClipStore";
import { useThemeStore } from "../../store/useThemeStore";
import { Button } from "../ui/Button";
import {
  Film,
  FolderOpen,
  Clipboard,
  Video,
  Maximize2,
  Download,
  CheckCircle2,
  Sun,
  Moon,
} from "lucide-react";

export function Header() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const {
    clips,
    isStudioOpen,
    setIsStudioOpen,
    loadVideoFile,
    importText,
    openPasteModal,
    showToast,
    setActiveId,
  } = useClipStore();

  const { theme, toggleTheme } = useThemeStore();

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
    const unapproved = clips.filter(c => !c.ok);
    if (unapproved.length) {
      showToast(
        `${unapproved.length} clip${unapproved.length === 1 ? " still needs" : "s still need"} approval before download`
      );
      setActiveId(unapproved[0].id);
      return;
    }

    const exported = toExportJSON(clips);
    const blob = new Blob([JSON.stringify(exported, null, 2) + "\n"], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clips.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Downloaded clips.json");
  };

  const approvedCount = clips.filter(c => c.ok).length;
  const isAllApproved = clips.length > 0 && approvedCount === clips.length;

  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800/80 transition-colors">
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 border border-blue-400/30">
          <Film className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Trim Clipsto
            </h1>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              React + TS
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Open your clip file, fine-tune titles, timestamps and file names, then download the updated file. All processing happens entirely offline in your browser.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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

        {/* Theme Toggle Button */}
        <Button
          variant="secondary"
          size="sm"
          icon={
            theme === "dark" ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
            )
          }
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
        >
          {theme === "dark" ? "Light" : "Dark"}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<FolderOpen className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-300" />}
          onClick={() => fileInputRef.current?.click()}
        >
          Open file
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<Clipboard className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-300" />}
          onClick={openPasteModal}
        >
          Paste
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<Video className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-300" />}
          onClick={() => videoInputRef.current?.click()}
        >
          Load video
        </Button>

        <Button
          variant="accent"
          size="sm"
          icon={<Maximize2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
          kbd="M"
          onClick={() => setIsStudioOpen(!isStudioOpen)}
        >
          Studio View
        </Button>

        <Button
          variant={isAllApproved ? "primary" : "secondary"}
          size="sm"
          icon={
            isAllApproved ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )
          }
          onClick={handleDownload}
          disabled={!clips.length}
        >
          Download
        </Button>
      </div>
    </header>
  );
}
