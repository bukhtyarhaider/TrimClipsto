import { UploadCloud } from "lucide-react";

interface DropOverlayProps {
  isDragging: boolean;
}

export function DropOverlay({ isDragging }: DropOverlayProps) {
  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none flex items-center justify-center bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed border-blue-500/80 bg-blue-500/10 shadow-2xl max-w-lg text-center gap-4 animate-in zoom-in-95 duration-150">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shadow-lg border border-blue-500/30">
          <UploadCloud className="w-8 h-8 animate-bounce" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Drop your files here</h3>
          <p className="text-sm text-zinc-300 mt-1">
            Drop your clip file (.json) or video (.mp4, .mov, .mkv, .webm)
          </p>
        </div>
      </div>
    </div>
  );
}
