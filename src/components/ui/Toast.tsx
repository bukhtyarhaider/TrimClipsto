import { useClipStore } from "../../store/useClipStore";
import { RotateCcw, X } from "lucide-react";

export function Toast() {
  const { toast, hideToast, restoreSnapshot } = useClipStore();

  if (!toast || !toast.show) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-900/95 text-zinc-100 text-sm font-medium shadow-2xl shadow-black/80 border border-zinc-700/80 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200">
      <span className="max-w-md truncate">{toast.message}</span>
      {toast.withUndo && (
        <button
          onClick={() => {
            restoreSnapshot();
            hideToast();
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Undo
        </button>
      )}
      <button
        onClick={hideToast}
        className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
