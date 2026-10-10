import { useRef } from "react";
import { useClipStore } from "../../store/useClipStore";
import { Button } from "../ui/Button";
import {
  FolderOpen,
  Clipboard,
  Plus,
  RotateCcw,
  FileCode2,
} from "lucide-react";

export function EmptyState() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    savedSession,
    resumeSavedSession,
    addClip,
    openPasteModal,
    importText,
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
  const approvedSavedCount =
    savedSession?.filter((c: any) => c && c._ok === true).length || 0;

  return (
    <div className="relative rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800/80 hover:border-blue-500/40 dark:hover:border-blue-500/40 bg-white/60 dark:bg-zinc-900/30 p-6 sm:p-8 text-center transition-all duration-200 flex flex-col items-center justify-center shadow-xs">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleJsonUpload}
      />

      {/* Modern Compact Brand Icon */}
      <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 shadow-xs">
        <FileCode2 className="w-5 h-5" />
      </div>

      {/* Typography */}
      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
        No clips in review queue
      </h3>
      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-5 leading-relaxed">
        Drop a <code className="text-blue-600 dark:text-blue-400 font-mono font-medium">.json</code> file here, open an existing list, or start from scratch.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="primary"
          size="sm"
          icon={<FolderOpen className="w-3.5 h-3.5" />}
          onClick={() => fileInputRef.current?.click()}
        >
          Open JSON
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<Clipboard className="w-3.5 h-3.5" />}
          onClick={openPasteModal}
        >
          Paste JSON
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => addClip(useClipStore.getState().currentTime || 0)}
        >
          New Clip
        </Button>
      </div>

      {/* Resume Session Button if cached session exists */}
      {savedSession && savedCount > 0 && (
        <button
          onClick={resumeSavedSession}
          className="mt-4 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>
            Restore previous session ({savedCount} clip{savedCount === 1 ? "" : "s"}
            {approvedSavedCount > 0 ? `, ${approvedSavedCount} approved` : ""})
          </span>
        </button>
      )}

      {/* Pro-Tip Footer */}
      <div className="mt-5 pt-3.5 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
        <span>Tip: Press</span>
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[10px] text-zinc-600 dark:text-zinc-300">
          +
        </kbd>
        <span>to add a clip at the playhead</span>
      </div>
    </div>
  );
}
