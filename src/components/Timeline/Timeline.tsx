import React, { useMemo } from "react";
import { useClipStore } from "../../store/useClipStore";
import { validateClips } from "../../utils/validation";
import { short, human } from "../../utils/time";
import { getColor } from "../../utils/constants";
import { Check, AlertCircle } from "lucide-react";

interface TimelineProps {
  seekTo: (sec: number) => void;
}

export function Timeline({ seekTo }: TimelineProps) {
  const {
    clips,
    activeId,
    videoDuration,
    currentTime,
    setActiveId,
  } = useClipStore();

  const validationResults = useMemo(() => {
    return validateClips(clips, videoDuration);
  }, [clips, videoDuration]);

  const validSegments = useMemo(() => {
    return validationResults
      .map((r, i) => ({ r, i, clip: clips[i] }))
      .filter(x => x.r.dur !== null && x.r.s !== null && x.r.e !== null);
  }, [validationResults, clips]);

  const tlMax = useMemo(() => {
    const maxEnd = validSegments.reduce((m, x) => Math.max(m, x.r.e || 0), 0);
    return Math.max(videoDuration || 0, maxEnd, 0);
  }, [videoDuration, validSegments]);

  const approvedCount = clips.filter(c => c.ok).length;
  const totalClips = clips.length;
  const progressPercent = totalClips ? Math.round((approvedCount / totalClips) * 100) : 0;

  const totalValidDur = validSegments.reduce((sum, x) => sum + (x.r.dur || 0), 0);
  const totalErrors = validationResults.reduce(
    (count, r) => count + r.issues.filter(i => i.l === "err").length,
    0
  );

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tlMax) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(clickRatio * tlMax);
  };

  const handleSegmentClick = (e: React.MouseEvent, id: number, startSec: number | null) => {
    e.stopPropagation();
    setActiveId(id);
    if (startSec !== null) {
      seekTo(startSec);
    }
  };

  return (
    <section className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-4 space-y-3.5 shadow-xs dark:shadow-none transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <strong className="text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
            {totalClips} clip{totalClips === 1 ? "" : "s"}
          </strong>
          <span className="text-zinc-500 dark:text-zinc-400">
            • {approvedCount} approved ({progressPercent}%)
          </span>
          {totalValidDur > 0 && (
            <span className="text-zinc-400 dark:text-zinc-500 hidden sm:inline">
              • Trimmed duration: {human(totalValidDur)}
            </span>
          )}
        </div>

        {totalErrors > 0 && (
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-500/20 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>
              {totalErrors} error{totalErrors === 1 ? "" : "s"} to fix
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Timeline Bar */}
      <div
        onClick={handleBarClick}
        className={`relative h-12 w-full bg-zinc-100 dark:bg-zinc-950/80 rounded-xl border border-zinc-200 dark:border-zinc-800/90 overflow-hidden select-none transition-colors ${
          tlMax ? "cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700/80" : ""
        }`}
      >
        {!tlMax ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500 dark:text-zinc-600">
            Clips will appear here as you add valid times
          </div>
        ) : (
          <>
            {/* Clip Segments */}
            {validSegments.map(({ r, i, clip }) => {
              const leftPercent = ((r.s! / tlMax) * 100);
              const widthPercent = Math.max(0.6, (((r.e! - r.s!) / tlMax) * 100));
              const hasErr = r.issues.some(x => x.l === "err");
              const isActive = clip.id === activeId;
              const accentColor = getColor(i);

              return (
                <button
                  key={clip.id}
                  onClick={e => handleSegmentClick(e, clip.id, r.s)}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    backgroundColor: clip.ok ? "rgba(34, 197, 94, 0.5)" : accentColor,
                    borderColor: isActive ? "#3b82f6" : hasErr ? "#f43f5e" : accentColor,
                  }}
                  title={`${i + 1}. ${clip.title || "Untitled"} (${short(r.s!)} – ${short(r.e!)})`}
                  className={`absolute top-1 bottom-1 rounded-md text-[11px] font-bold flex items-center justify-center transition-all overflow-hidden border ${
                    isActive ? "ring-2 ring-blue-500 z-20 shadow-lg" : "z-10 hover:brightness-110"
                  } ${clip.ok ? "text-emerald-950 dark:text-emerald-100" : "text-zinc-950"} ${
                    hasErr ? "border-rose-500 bg-rose-500/30 text-rose-800 dark:text-rose-200" : ""
                  }`}
                >
                  <span className="truncate px-1 drop-shadow-xs flex items-center gap-1">
                    {clip.ok && <Check className="w-2.5 h-2.5 inline shrink-0" />}
                    {i + 1}
                  </span>
                </button>
              );
            })}

            {/* Playhead */}
            {videoDuration > 0 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 shadow-md shadow-rose-500/50 pointer-events-none z-30 transition-transform duration-75"
                style={{
                  left: `${Math.min(100, Math.max(0, (currentTime / tlMax) * 100))}%`,
                }}
              >
                <div className="w-2.5 h-2.5 bg-rose-500 rotate-45 -translate-x-[4px] -translate-y-1 rounded-[1px]" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Axis Ticks */}
      {tlMax > 0 && (
        <div className="relative h-4 w-full text-[10px] text-zinc-500 font-mono">
          {[0, 0.25, 0.5, 0.75, 1].map(p => (
            <span
              key={p}
              className="absolute -translate-x-1/2"
              style={{ left: `${p * 100}%` }}
            >
              {short(tlMax * p)}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
