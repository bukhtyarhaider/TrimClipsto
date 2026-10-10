import React, { useRef } from "react";
import { Clip, ClipValidation } from "../../types";
import { useClipStore } from "../../store/useClipStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { getColor } from "../../utils/constants";
import { human, fmt, toSec } from "../../utils/time";
import { Button } from "../ui/Button";
import {
  Check,
  Target,
  Wand2,
  Play,
  Square,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";

interface ClipCardProps {
  clip: Clip;
  index: number;
  validation: ClipValidation;
  playClip: (id: number) => void;
  seekTo: (sec: number) => void;
}

export function ClipCard({
  clip,
  index,
  validation,
  playClip,
  seekTo,
}: ClipCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const {
    activeId,
    playingClip,
    setActiveId,
    updateClip,
    toggleApproval,
    nudgeClipTime,
    duplicateClip,
    removeClip,
    moveClip,
    suggestClipName,
    showToast,
  } = useClipStore();

  const isActive = clip.id === activeId;
  const isPlaying = playingClip?.id === clip.id;
  const hasErrors = validation.issues.some(x => x.l === "err");

  const handleTimeKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "start" | "end"
  ) => {
    if (clip.ok) return;
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const delta = (e.shiftKey ? 10 : 1) * (e.key === "ArrowUp" ? 1 : -1);
      nudgeClipTime(clip.id, field, delta);
    }
  };

  const handlePinTime = (field: "start" | "end") => {
    if (clip.ok) return;
    const cur = useClipStore.getState().currentTime;
    updateClip(clip.id, { [field]: fmt(cur) });
    showToast(`Set ${field} time to ${fmt(cur)}`);
  };

  return (
    <article
      ref={cardRef}
      onClick={() => {
        setActiveId(clip.id);
        if (seekTo && useSettingsStore.getState().settings.autoSeekOnSelect) {
          const startSec = toSec(clip.start);
          if (startSec !== null) seekTo(startSec);
        }
      }}
      className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer ${
        isActive
          ? "bg-white dark:bg-zinc-900/95 border-blue-500 dark:border-blue-500/80 shadow-md dark:shadow-lg dark:shadow-blue-500/10 ring-2 ring-blue-500/30"
          : "bg-white dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700/80 shadow-xs dark:shadow-none"
      } ${clip.ok ? "border-emerald-500/40 bg-emerald-500/[0.02]" : ""}`}
    >
      <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-start">
        {/* Number Badge */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-zinc-950 shrink-0 shadow-xs"
          style={{ backgroundColor: getColor(index) }}
        >
          {index + 1}
        </div>

        {/* Main Body */}
        <div className="flex-1 w-full space-y-4">
          {/* Top Row: Title, Status & Approve/Unlock */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                disabled={clip.ok}
                value={clip.title}
                onChange={e => updateClip(clip.id, { title: e.target.value })}
                placeholder="What happens in this clip?"
                className="w-full text-sm font-medium p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:disabled:bg-zinc-900/60 transition-colors"
              />
              {clip.ok && (
                <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  <Lock className="w-3 h-3" />
                  Locked
                </span>
              )}
            </div>

            <Button
              variant={clip.ok ? "secondary" : "primary"}
              size="sm"
              icon={clip.ok ? <Unlock className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              disabled={hasErrors && !clip.ok}
              onClick={e => {
                e.stopPropagation();
                toggleApproval(clip.id);
              }}
              title={clip.ok ? "Unlock this clip to make changes" : "Lock this clip and move to Approved"}
            >
              {clip.ok ? "Unlock" : "Approve"}
            </Button>
          </div>

          {/* Time & File Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            {/* Start Time */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Starts at</span>
              <div className="relative flex items-center">
                <input
                  type="text"
                  disabled={clip.ok}
                  value={clip.start}
                  onChange={e => updateClip(clip.id, { start: e.target.value })}
                  onKeyDown={e => handleTimeKeyDown(e, "start")}
                  placeholder="00:00:00.000"
                  className="w-full text-xs font-mono p-2 pr-8 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  title="Press ↑ / ↓ to nudge 1s (Shift: 10s)"
                />
                <button
                  type="button"
                  disabled={clip.ok}
                  onClick={() => handlePinTime("start")}
                  className="absolute right-1.5 p-1 rounded text-zinc-400 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Use current video time"
                >
                  <Target className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* End Time */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Ends at</span>
              <div className="relative flex items-center">
                <input
                  type="text"
                  disabled={clip.ok}
                  value={clip.end}
                  onChange={e => updateClip(clip.id, { end: e.target.value })}
                  onKeyDown={e => handleTimeKeyDown(e, "end")}
                  placeholder="00:00:00.000"
                  className="w-full text-xs font-mono p-2 pr-8 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  title="Press ↑ / ↓ to nudge 1s (Shift: 10s)"
                />
                <button
                  type="button"
                  disabled={clip.ok}
                  onClick={() => handlePinTime("end")}
                  className="absolute right-1.5 p-1 rounded text-zinc-400 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Use current video time"
                >
                  <Target className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Duration pill */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Length</span>
              <div
                className={`h-9 px-3 rounded-lg border flex items-center font-mono text-xs font-semibold ${
                  validation.dur !== null && !hasErrors
                    ? "bg-zinc-50 dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                    : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400"
                }`}
              >
                {validation.dur !== null ? human(validation.dur) : "–"}
              </div>
            </div>

            {/* Output Name */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">Saved as</span>
              <div className="relative flex items-center">
                <input
                  type="text"
                  disabled={clip.ok}
                  value={clip.output_name}
                  onChange={e => updateClip(clip.id, { output_name: e.target.value })}
                  placeholder="clip_01_name.mp4"
                  className="w-full text-xs font-mono p-2 pr-8 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                />
                <button
                  type="button"
                  disabled={clip.ok}
                  onClick={() => suggestClipName(clip.id)}
                  className="absolute right-1.5 p-1 rounded text-zinc-400 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Suggest file name from title"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Inline Validation Warnings / Errors */}
          {validation.issues.length > 0 && (
            <div className="space-y-1 pt-1">
              {validation.issues.map((iss, i) => (
                <p
                  key={i}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border leading-tight ${
                    iss.l === "err"
                      ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20"
                      : "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/20"
                  }`}
                >
                  {iss.t}
                </p>
              ))}
            </div>
          )}

          {/* Footer Tools: Preview, Move Up/Down, Duplicate, Delete */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800/60">
            <Button
              variant={isPlaying ? "accent" : "secondary"}
              size="xs"
              icon={
                isPlaying ? (
                  <Square className="w-3 h-3 fill-current text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <Play className="w-3 h-3 fill-current text-zinc-500 dark:text-zinc-300" />
                )
              }
              onClick={e => {
                e.stopPropagation();
                playClip(clip.id);
              }}
            >
              {isPlaying ? "Stop Preview" : "Preview"}
            </Button>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="xs"
                icon={<ChevronUp className="w-3.5 h-3.5" />}
                onClick={e => {
                  e.stopPropagation();
                  moveClip(clip.id, -1);
                }}
                disabled={index === 0 || clip.ok}
                title={clip.ok ? "Locked (unapprove to reorder)" : "Move up"}
              />
              <Button
                variant="ghost"
                size="xs"
                icon={<ChevronDown className="w-3.5 h-3.5" />}
                onClick={e => {
                  e.stopPropagation();
                  moveClip(clip.id, 1);
                }}
                disabled={clip.ok}
                title={clip.ok ? "Locked (unapprove to reorder)" : "Move down"}
              />
              <Button
                variant="ghost"
                size="xs"
                icon={<Copy className="w-3.5 h-3.5" />}
                onClick={e => {
                  e.stopPropagation();
                  duplicateClip(clip.id);
                }}
                title="Duplicate clip"
              />
              <Button
                variant="ghost"
                size="xs"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                disabled={clip.ok}
                onClick={e => {
                  e.stopPropagation();
                  removeClip(clip.id);
                }}
                title={clip.ok ? "Locked (unapprove to delete)" : "Delete clip"}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
