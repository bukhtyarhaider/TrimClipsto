import { useClipStore } from "../../store/useClipStore";
import { Button } from "./Button";
import { AlertTriangle, X } from "lucide-react";

export function ConfirmDialog() {
  const { confirmModal, closeConfirmModal } = useClipStore();

  if (!confirmModal) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{confirmModal.title}</h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{confirmModal.message}</p>
            </div>
          </div>
          <button
            onClick={closeConfirmModal}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
          <Button variant="ghost" onClick={closeConfirmModal}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              confirmModal.onConfirm();
              closeConfirmModal();
            }}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
