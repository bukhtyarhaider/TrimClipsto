import { useRef } from "react";
import { useClipStore } from "../../store/useClipStore";
import { Button } from "../ui/Button";
import {
  FolderOpen,
  Clipboard,
  PlusCircle,
  RotateCcw,
  Video,
  FileCheck2,
  SlidersHorizontal,
  DownloadCloud,
} from "lucide-react";

export function EmptyState() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    savedSession,
    resumeSavedSession,
    addClip,
    openPasteModal,
    importText,
    currentTime,
  } = useClipStore();

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

  const savedCount = savedSession?.length || 0;
  const approvedSavedCount = savedSession?.filter((c: any) => c && c._ok === true).length || 0;

  return (
    <div className="relative rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 p-8 sm:p-12 text-center overflow-hidden shadow-xs dark:shadow-none transition-colors space-y-8">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleJsonUpload}
      />

      {/* Decorative gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto space-y-3">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Open your clip file to begin
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Drop a <code className="text-blue-600 dark:text-blue-400 font-mono font-medium">.json</code> file anywhere on this page, or choose one from your computer to inspect, retime, and refine your video clips.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Button
            variant="primary"
            size="md"
            icon={<FolderOpen className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Open file
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={<Clipboard className="w-4 h-4" />}
            onClick={openPasteModal}
          >
            Paste JSON
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => addClip(currentTime || 0)}
          >
            Start from scratch
          </Button>

          {savedSession && savedCount > 0 && (
            <Button
              variant="accent"
              size="md"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={resumeSavedSession}
            >
              Resume session ({savedCount} clips, {approvedSavedCount} approved)
            </Button>
          )}
        </div>
      </div>

      {/* Step by Step Workflow Guide */}
      <div className="relative z-10 max-w-3xl mx-auto pt-6 border-t border-zinc-200 dark:border-zinc-800/80">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4">
          Recommended Workflow
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-left">
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">1. Load video</h5>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">
              Drop your source video for instant scrubbing & timeline previews.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">2. Open clip file</h5>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">
              Import existing timestamp lists or create new clips directly.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">3. Retime & review</h5>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">
              Set In/Out marks, preview cuts, fix filenames, and approve clips.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DownloadCloud className="w-4 h-4" />
            </div>
            <h5 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">4. Download</h5>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-normal">
              Export clean, validated JSON ready for your rendering pipelines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
