import { useState } from "react";
import { useClipStore } from "../../store/useClipStore";
import { Button } from "./Button";
import { Clipboard, X } from "lucide-react";

export function PasteDialog() {
  const { isPasteOpen, closePasteModal, importText } = useClipStore();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isPasteOpen) return null;

  const handleLoad = async () => {
    setError(null);
    setLoading(true);
    const err = await importText(text);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setText("");
      closePasteModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              <Clipboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Paste your clip list</h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Paste raw JSON from your clip export file. It replaces current clips (you can undo right after).
              </p>
            </div>
          </div>
          <button
            onClick={closePasteModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <textarea
            value={text}
            onChange={e => {
              setText(e.target.value);
              if (error) setError(null);
            }}
            placeholder={`[
  {
    "title": "Introduction to setup",
    "start": "00:00:15.000",
    "end": "00:01:20.500",
    "output_name": "clip_01_intro.mp4"
  }
]`}
            rows={10}
            className="w-full font-mono text-xs p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/50 resize-y transition-colors"
            autoFocus
            spellCheck={false}
          />
          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-2.5 rounded-lg">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
          <Button variant="ghost" onClick={closePasteModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleLoad}
            loading={loading}
            disabled={!text.trim()}
          >
            Load clips
          </Button>
        </div>
      </div>
    </div>
  );
}
