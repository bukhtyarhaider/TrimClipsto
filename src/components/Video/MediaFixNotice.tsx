import { useState } from "react";
import { useClipStore } from "../../store/useClipStore";
import { AlertTriangle, Copy, Check, X } from "lucide-react";
import { Button } from "../ui/Button";

export function MediaFixNotice() {
  const {
    videoFile,
    mediaInspectInfo,
    fixDismissed,
    setFixDismissed,
    showToast,
  } = useClipStore();

  const [copied, setCopied] = useState(false);

  if (fixDismissed || !videoFile) return null;

  const fileName = videoFile.name || "your-video.mp4";
  const baseName = fileName.replace(/\.[^/.]+$/, "");

  let title = "";
  let message = "";
  let command = "";

  if (mediaInspectInfo?.isUnsupportedAudio) {
    const audioName = mediaInspectInfo.audioName || "AC-3 / DTS";
    title = `MKV Audio Not Supported by Browser (${audioName})`;
    message = `Video picture plays normally, but web browsers cannot decode ${audioName} audio natively. To get full audio preview instantly, copy the video stream and convert only the audio to AAC (~2 seconds):`;
    command = `ffmpeg -i "${fileName}" -c:v copy -c:a aac "${baseName}_preview.mp4"`;
  } else if (mediaInspectInfo?.noPicture) {
    title = "Video Picture Format Not Supported";
    message = "Your browser can't decode this video's picture (often H.265/HEVC or AV1). Create a lightweight preview copy for trimming:";
    command = `ffmpeg -i "${fileName}" -vf scale=-2:480 -c:v libx264 -preset veryfast -crf 28 -c:a aac "${baseName}_preview.mp4"`;
  } else {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      showToast("FFmpeg command copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {
      showToast("Failed to copy automatically. Please copy manually.");
    }
  };

  return (
    <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-4 space-y-3 transition-colors animate-in fade-in duration-150">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{title}</span>
        </div>
        <button
          onClick={() => setFixDismissed(true)}
          className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors"
          title="Dismiss notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">{message}</p>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-lg bg-white dark:bg-zinc-950/80 border border-amber-200/80 dark:border-zinc-800 shadow-xs dark:shadow-none">
        <code className="flex-1 font-mono text-xs text-amber-800 dark:text-amber-300 break-all select-all">
          {command}
        </code>
        <Button
          variant="secondary"
          size="xs"
          icon={copied ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
          onClick={handleCopy}
        >
          {copied ? "Copied!" : "Copy command"}
        </Button>
      </div>

      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
        <span>Tip: <code>-c:v copy</code> finishes in ~2 seconds because it does not re-encode video.</span>
        <button
          onClick={() => setFixDismissed(true)}
          className="hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
