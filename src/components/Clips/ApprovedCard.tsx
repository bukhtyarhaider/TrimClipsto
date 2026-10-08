import React from "react";
import { Clip } from "../../types";
import { useClipStore } from "../../store/useClipStore";
import { getColor } from "../../utils/constants";
import { toSec, human } from "../../utils/time";
import { Button } from "../ui/Button";
import { Lock, Play, Square, Unlock } from "lucide-react";

interface ApprovedCardProps {
  clip: Clip;
  index: number;
  playClip: (id: number) => void;
}

export function ApprovedCard({ clip, index, playClip }: ApprovedCardProps) {
  const { playingClip, toggleApproval, setActiveId, activeId } = useClipStore();

  const isPlaying = playingClip?.id === clip.id;
  const isActive = activeId === clip.id;

  const s = toSec(clip.start);
  const e = toSec(clip.end);
  const duration = s !== null && e !== null && e > s ? human(e - s) : "";

  return (
    <article
      onClick={() => setActiveId(clip.id)}
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all duration-150 ${
        isActive
          ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-500/50"
          : "bg-white dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700/80 shadow-xs dark:shadow-none"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-zinc-950 shrink-0 opacity-80"
          style={{ backgroundColor: getColor(index) }}
        >
          {index + 1}
        </div>

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 truncate">
              {clip.title || "Untitled"}
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
            <span>
              {clip.start} → {clip.end}
            </span>
            {duration && (
              <span className="text-zinc-500 font-sans">({duration})</span>
            )}
            {clip.output_name && (
              <span className="text-zinc-400 dark:text-zinc-500 truncate max-w-xs">
                • {clip.output_name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <Button
          variant={isPlaying ? "accent" : "ghost"}
          size="xs"
          icon={
            isPlaying ? (
              <Square className="w-3 h-3 fill-current text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Play className="w-3 h-3 fill-current text-zinc-500 dark:text-zinc-400" />
            )
          }
          onClick={e => {
            e.stopPropagation();
            playClip(clip.id);
          }}
        >
          {isPlaying ? "Stop" : "Preview"}
        </Button>

        <Button
          variant="outline"
          size="xs"
          icon={<Unlock className="w-3 h-3" />}
          onClick={e => {
            e.stopPropagation();
            toggleApproval(clip.id);
          }}
          title="Unlock this clip so you can edit it"
        >
          Unapprove
        </Button>
      </div>
    </article>
  );
}
