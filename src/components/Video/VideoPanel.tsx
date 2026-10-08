import React, { useRef, useMemo, useEffect, useState } from "react";
import { useClipStore } from "../../store/useClipStore";
import { useThemeStore } from "../../store/useThemeStore";
import { toSec, fmt, human, short } from "../../utils/time";
import { getColor } from "../../utils/constants";
import { validateClips } from "../../utils/validation";
import { Button } from "../ui/Button";
import { MediaFixNotice } from "./MediaFixNotice";
import {
  Maximize,
  Minimize2,
  Maximize2,
  Trash2,
  RefreshCw,
  Repeat,
  Gauge,
  Upload,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Wand2,
  Check,
  Target,
  Film,
  RotateCcw,
  Sun,
  Moon,
} from "lucide-react";

interface VideoPanelProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoHandlers: {
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
    onPlay: () => void;
    onPause: () => void;
    onTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
    onError: () => void;
  };
  togglePlayPause: () => void;
  seekTo: (sec: number) => void;
  nudge: (delta: number) => void;
  playClip: (id: number) => void;
}

export function VideoPanel({
  videoRef,
  videoHandlers,
  togglePlayPause,
  seekTo,
  nudge,
  playClip,
}: VideoPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrubBarRef = useRef<HTMLDivElement | null>(null);
  const activeNavRef = useRef<HTMLDivElement | null>(null);

  const {
    videoFile,
    videoUrl,
    videoDuration,
    currentTime,
    isPlaying,
    playingClip,
    isStudioOpen,
    isLooping,
    playbackRate,
    statusText,
    isStatusBad,
    activeId,
    clips,
    setIsStudioOpen,
    setIsLooping,
    setPlaybackRate,
    loadVideoFile,
    removeVideo,
    setActiveId,
    updateClip,
    toggleApproval,
    nudgeClipTime,
    addClip,
    duplicateClip,
    removeClip,
    suggestClipName,
    showToast,
  } = useClipStore();

  const { theme, toggleTheme } = useThemeStore();

  const validationResults = useMemo(() => {
    return validateClips(clips, videoDuration);
  }, [clips, videoDuration]);

  // Handle active clip resolution
  const curIndex = Math.max(0, clips.findIndex(c => c.id === activeId));
  const curClip = clips.length > 0 ? (clips[curIndex] || clips[0]) : null;
  const curVal = validationResults[curIndex] || { issues: [], dur: null, s: null, e: null };
  const hasErrors = curVal.issues.some(x => x.l === "err");
  const approvedCount = clips.filter(c => c.ok).length;

  // Auto-scroll active item into view in studio mini navigator
  useEffect(() => {
    if (isStudioOpen && activeNavRef.current) {
      activeNavRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeId, isStudioOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadVideoFile(file);
    }
    e.target.value = "";
  };

  // Drag and click scrubbing on the studio scrubber bar
  const handleScrubMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoDuration || !scrubBarRef.current) return;
    const bar = scrubBarRef.current;

    const updateSeek = (clientX: number) => {
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      seekTo(ratio * videoDuration);
    };

    updateSeek(e.clientX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateSeek(moveEvent.clientX);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handlePrevClip = () => {
    if (!clips.length) return;
    const prevIdx = curIndex <= 0 ? clips.length - 1 : curIndex - 1;
    setActiveId(clips[prevIdx].id);
    const s = toSec(clips[prevIdx].start);
    if (s !== null) seekTo(s);
  };

  const handleNextClip = () => {
    if (!clips.length) return;
    const nextIdx = curIndex >= clips.length - 1 ? 0 : curIndex + 1;
    setActiveId(clips[nextIdx].id);
    const s = toSec(clips[nextIdx].start);
    if (s !== null) seekTo(s);
  };

  const handleApproveAndNext = () => {
    if (!curClip) return;
    const res = toggleApproval(curClip.id);
    if (res?.approved) {
      if (res.nextId !== null) {
        setActiveId(res.nextId);
        const nextClip = clips.find(c => c.id === res.nextId);
        const s = nextClip ? toSec(nextClip.start) : null;
        if (s !== null) seekTo(s);
      } else {
        handleNextClip();
      }
    }
  };

  const handleTimeKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: "start" | "end"
  ) => {
    if (!curClip) return;
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const delta = (e.shiftKey ? 10 : 1) * (e.key === "ArrowUp" ? 1 : -1);
      nudgeClipTime(curClip.id, field, delta);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Scrub range calculation for active clip
  const inSec = curVal.s;
  const outSec = curVal.e;
  const hasValidRange =
    videoDuration > 0 && inSec !== null && outSec !== null && outSec > inSec;
  const rangeLeft = hasValidRange
    ? Math.max(0, Math.min(100, (inSec / videoDuration) * 100))
    : 0;
  const rangeWidth = hasValidRange
    ? Math.max(0, Math.min(100 - rangeLeft, ((outSec - inSec) / videoDuration) * 100))
    : 0;

  const isCurrentClipPlaying = Boolean(curClip && playingClip?.id === curClip.id);

  /* ========================================================
     STUDIO MODE FULLSCREEN RENDER
     ======================================================== */
  if (isStudioOpen) {
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden animate-in fade-in duration-150 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,.mkv,.mov,.m4v,.webm"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Studio Top Header */}
        <header className="h-14 px-5 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 flex items-center justify-between shrink-0 select-none backdrop-blur-md transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
              STUDIO MODE
            </span>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-md">
              {videoFile?.name || "No video loaded"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium hidden sm:block">
              {approvedCount} of {clips.length} approved
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle Button */}
              <Button
                variant="secondary"
                size="sm"
                icon={
                  theme === "dark" ? (
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  )
                }
                onClick={toggleTheme}
                title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
              >
                {theme === "dark" ? "Light" : "Dark"}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                icon={<Maximize className="w-3.5 h-3.5" />}
                kbd="F"
                onClick={toggleFullscreen}
              >
                Fullscreen
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={<Minimize2 className="w-3.5 h-3.5" />}
                kbd="Esc"
                onClick={() => setIsStudioOpen(false)}
              >
                Exit Studio
              </Button>
            </div>
          </div>
        </header>

        {/* Studio Body: Left Video + Transport, Right Inspector */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: Video Stage + Transport */}
          <div className="flex-1 flex flex-col bg-zinc-200/50 dark:bg-black/95 p-3 sm:p-5 overflow-hidden transition-colors">
            <div className="flex-1 relative flex items-center justify-center min-h-0 bg-zinc-900 dark:bg-zinc-950 rounded-2xl border border-zinc-300 dark:border-zinc-800/80 overflow-hidden shadow-xl group">
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={togglePlayPause}
                  {...videoHandlers}
                />
              ) : (
                <label className="flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:bg-zinc-800/30 dark:hover:bg-zinc-900/60 transition-colors w-full h-full">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 dark:bg-zinc-900 border border-zinc-700/80 dark:border-zinc-800 text-blue-400 flex items-center justify-center mb-3 shadow-lg">
                    <Film className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-100">No video loaded</h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                    Click here or drop your video to preview and set trim marks
                  </p>
                </label>
              )}
            </div>

            {/* Studio Transport Controls Below Video */}
            <div className="mt-3 p-3.5 rounded-2xl bg-white/95 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800/80 space-y-3 shrink-0 shadow-md transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Playhead Timecode */}
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/60 px-2 py-0.5 rounded">
                    PLAYHEAD
                  </span>
                  <span className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
                    {fmt(currentTime)}
                  </span>
                  {videoDuration > 0 && (
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      / {fmt(videoDuration)}
                    </span>
                  )}
                </div>

                {/* Video Step & Play Buttons */}
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => nudge(-5)}
                    title="Skip back 5s (Shift + Left)"
                    icon={<SkipBack className="w-3.5 h-3.5" />}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const vid = videoRef.current;
                      if (vid && !vid.paused) vid.pause();
                      nudge(-1 / 30);
                    }}
                    title="Step back 1 frame (,)"
                  >
                    <span className="font-mono text-xs">-1f</span>
                  </Button>

                  <button
                    onClick={togglePlayPause}
                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer"
                    title="Play / Pause (Space)"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current translate-x-0.5" />
                    )}
                  </button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const vid = videoRef.current;
                      if (vid && !vid.paused) vid.pause();
                      nudge(1 / 30);
                    }}
                    title="Step forward 1 frame (.)"
                  >
                    <span className="font-mono text-xs">+1f</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => nudge(5)}
                    title="Skip forward 5s (Shift + Right)"
                    icon={<SkipForward className="w-3.5 h-3.5" />}
                  />
                </div>

                {/* Loop & Speed */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isLooping}
                      onChange={e => setIsLooping(e.target.checked)}
                      className="w-3.5 h-3.5 rounded bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Loop</span>
                  </label>

                  <div className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                    <select
                      value={playbackRate}
                      onChange={e => setPlaybackRate(Number(e.target.value))}
                      className="bg-white dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs rounded px-2 py-0.5 focus:outline-none cursor-pointer shadow-xs"
                    >
                      <option value={0.5}>0.5×</option>
                      <option value={0.75}>0.75×</option>
                      <option value={1}>1×</option>
                      <option value={1.25}>1.25×</option>
                      <option value={1.5}>1.5×</option>
                      <option value={2}>2×</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Precision Scrub Bar with Click and Drag Seeking */}
              <div
                ref={scrubBarRef}
                onMouseDown={handleScrubMouseDown}
                className="relative h-4 w-full bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-300 dark:border-zinc-800 cursor-crosshair select-none overflow-hidden"
                title="Click or drag to scrub playhead"
              >
                {/* Active Clip Trim Range */}
                {hasValidRange && (
                  <div
                    className="absolute top-0 bottom-0 bg-blue-500/35 border-x-2 border-blue-500 pointer-events-none transition-all duration-75"
                    style={{
                      left: `${rangeLeft}%`,
                      width: `${rangeWidth}%`,
                    }}
                  />
                )}

                {/* Playhead Needle */}
                {videoDuration > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-rose-500 dark:bg-white shadow-md shadow-rose-500/50 dark:shadow-white/80 pointer-events-none z-10 transition-transform duration-75"
                    style={{
                      left: `${Math.min(100, Math.max(0, (currentTime / videoDuration) * 100))}%`,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Media Compatibility Notice if Needed */}
            <div className="mt-2">
              <MediaFixNotice />
            </div>
          </div>

          {/* Right Column: Studio Inspector & Mini Navigator */}
          <aside className="w-full lg:w-96 border-l border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto shrink-0 shadow-xl transition-colors">
            {/* Inspector Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Clip Inspector</h3>
                {curClip && (
                  <span
                    className="px-2 py-0.5 text-xs font-bold rounded-md text-zinc-950 shadow-xs"
                    style={{ backgroundColor: getColor(curIndex) }}
                  >
                    #{curIndex + 1}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="xs"
                  icon={<ChevronLeft className="w-3.5 h-3.5" />}
                  onClick={handlePrevClip}
                  disabled={clips.length <= 1}
                  title="Previous clip (PageUp)"
                />
                <Button
                  variant="ghost"
                  size="xs"
                  icon={<ChevronRight className="w-3.5 h-3.5" />}
                  onClick={handleNextClip}
                  disabled={clips.length <= 1}
                  title="Next clip (PageDown)"
                />
              </div>
            </div>

            {curClip ? (
              <div className="space-y-4">
                {/* Title Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Clip Title</label>
                  <input
                    type="text"
                    value={curClip.title}
                    onChange={e => updateClip(curClip.id, { title: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApproveAndNext();
                      }
                    }}
                    placeholder="What happens in this clip?"
                    className="w-full text-xs p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/50 shadow-xs transition-colors"
                  />
                </div>

                {/* Trim Marks Box */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-3 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Trim Marks</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        curVal.dur !== null && !hasErrors
                          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                          : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                      }`}
                    >
                      {curVal.dur !== null ? human(curVal.dur) : "Invalid"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* IN POINT */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 space-y-2 shadow-xs transition-colors">
                      <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                        <span>IN POINT</span>
                        <button
                          type="button"
                          onClick={() => {
                            const s = toSec(curClip.start);
                            if (s !== null) seekTo(s);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Seek
                        </button>
                      </div>
                      <input
                        type="text"
                        value={curClip.start}
                        onChange={e => updateClip(curClip.id, { start: e.target.value })}
                        onKeyDown={e => handleTimeKeyDown(e, "start")}
                        placeholder="00:00:00.000"
                        className="w-full text-xs font-mono p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500/50"
                        title="Press ↑ / ↓ to nudge 1s (Shift: 10s)"
                      />
                      <Button
                        variant="accent"
                        size="xs"
                        className="w-full"
                        icon={<Target className="w-3 h-3" />}
                        kbd="I"
                        onClick={() => {
                          updateClip(curClip.id, { start: fmt(currentTime) });
                          showToast(`Set In mark: ${fmt(currentTime)}`);
                        }}
                      >
                        Set In
                      </Button>
                    </div>

                    {/* OUT POINT */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 space-y-2 shadow-xs transition-colors">
                      <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                        <span>OUT POINT</span>
                        <button
                          type="button"
                          onClick={() => {
                            const e = toSec(curClip.end);
                            if (e !== null) seekTo(e);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Seek
                        </button>
                      </div>
                      <input
                        type="text"
                        value={curClip.end}
                        onChange={e => updateClip(curClip.id, { end: e.target.value })}
                        onKeyDown={e => handleTimeKeyDown(e, "end")}
                        placeholder="00:00:00.000"
                        className="w-full text-xs font-mono p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500/50"
                        title="Press ↑ / ↓ to nudge 1s (Shift: 10s)"
                      />
                      <Button
                        variant="accent"
                        size="xs"
                        className="w-full"
                        icon={<Target className="w-3 h-3" />}
                        kbd="O"
                        onClick={() => {
                          updateClip(curClip.id, { end: fmt(currentTime) });
                          showToast(`Set Out mark: ${fmt(currentTime)}`);
                        }}
                      >
                        Set Out
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Output File Name */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Output File Name</label>
                    <button
                      type="button"
                      onClick={() => suggestClipName(curClip.id)}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 cursor-pointer"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Suggest Name</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={curClip.output_name}
                    onChange={e => updateClip(curClip.id, { output_name: e.target.value })}
                    placeholder="clip_01_name.mp4"
                    className="w-full text-xs font-mono p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/50 shadow-xs transition-colors"
                  />
                </div>

                {/* Validation Alerts */}
                {curVal.issues.length > 0 && (
                  <div className="space-y-1">
                    {curVal.issues.map((iss, idx) => (
                      <p
                        key={idx}
                        className={`text-[11px] p-2 rounded-lg border leading-tight ${
                          iss.l === "err"
                            ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20"
                            : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20"
                        }`}
                      >
                        {iss.t}
                      </p>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
                  <Button
                    variant={curClip.ok ? "secondary" : "primary"}
                    size="md"
                    className="w-full"
                    icon={curClip.ok ? <RotateCcw className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    kbd="Enter"
                    disabled={hasErrors && !curClip.ok}
                    onClick={handleApproveAndNext}
                  >
                    {curClip.ok
                      ? "Approved (Click to Unlock)"
                      : hasErrors
                      ? "Fix Errors to Approve"
                      : "Approve & Next"}
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={isCurrentClipPlaying ? "accent" : "secondary"}
                      size="sm"
                      icon={
                        isCurrentClipPlaying ? (
                          <Square className="w-3.5 h-3.5 fill-current text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current text-zinc-600 dark:text-zinc-300" />
                        )
                      }
                      kbd="P"
                      onClick={() => playClip(curClip.id)}
                    >
                      {isCurrentClipPlaying ? "Stop Preview" : "Preview Clip"}
                    </Button>
                    <Button
                      variant="accent"
                      size="sm"
                      icon={<Plus className="w-3.5 h-3.5" />}
                      kbd="+"
                      onClick={() => {
                        const newClip = addClip(currentTime);
                        showToast(`Created clip at ${newClip.start}`);
                      }}
                    >
                      + New Clip
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={<Copy className="w-3 h-3" />}
                      onClick={() => duplicateClip(curClip.id)}
                    >
                      Duplicate
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      icon={<Trash2 className="w-3 h-3" />}
                      onClick={() => removeClip(curClip.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">No clips in project yet.</p>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => addClip(currentTime || 0)}
                >
                  + Add First Clip
                </Button>
              </div>
            )}

            {/* Mini Clips Navigator Section */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/80 flex-1 flex flex-col min-h-[160px]">
              <div className="flex items-center justify-between pb-2 text-xs">
                <span className="font-semibold text-zinc-800 dark:text-zinc-300">
                  All Clips ({clips.length})
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Click to switch & seek</span>
              </div>

              <div className="flex-1 space-y-1.5 overflow-y-auto max-h-56 pr-1">
                {clips.map((c, i) => {
                  const v = validationResults[i] || {};
                  const len = v.dur !== null ? human(v.dur) : "";
                  const isActive = c.id === activeId;

                  return (
                    <div
                      key={c.id}
                      ref={isActive ? activeNavRef : null}
                      onClick={() => {
                        setActiveId(c.id);
                        const s = toSec(c.start);
                        if (s !== null) seekTo(s);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer border transition-all ${
                        isActive
                          ? "bg-blue-50 dark:bg-zinc-800/90 border-blue-500 text-zinc-900 dark:text-white shadow-xs ring-1 ring-blue-500/50"
                          : "bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] text-zinc-950 shrink-0 shadow-xs"
                        style={{ backgroundColor: getColor(i) }}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-zinc-900 dark:text-zinc-200">
                          {c.title || "Untitled"}
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                          {short(toSec(c.start) || 0)} → {short(toSec(c.end) || 0)}{" "}
                          {len && `(${len})`}
                        </p>
                      </div>
                      {c.ok && (
                        <span className="p-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shortcuts Reference Guide */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 grid grid-cols-3 gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
              <span className="bg-zinc-100 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 p-1 rounded text-center">
                <kbd className="text-[9px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1 py-0.5 rounded mr-0.5">Space</kbd> Play
              </span>
              <span className="bg-zinc-100 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 p-1 rounded text-center">
                <kbd className="text-[9px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1 py-0.5 rounded mr-0.5">I</kbd> Set In
              </span>
              <span className="bg-zinc-100 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 p-1 rounded text-center">
                <kbd className="text-[9px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1 py-0.5 rounded mr-0.5">O</kbd> Set Out
              </span>
              <span className="bg-zinc-100 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 p-1 rounded text-center">
                <kbd className="text-[9px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1 py-0.5 rounded mr-0.5">,</kbd><kbd className="text-[9px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1 py-0.5 rounded mr-0.5">.</kbd> Frame
              </span>
              <span className="bg-zinc-100 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 p-1 rounded text-center">
                <kbd className="text-[9px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1 py-0.5 rounded mr-0.5">N</kbd> Next
              </span>
              <span className="bg-zinc-100 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 p-1 rounded text-center">
                <kbd className="text-[9px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1 py-0.5 rounded mr-0.5">Esc</kbd> Exit
              </span>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  /* ========================================================
     NORMAL INLINE MODE RENDER
     ======================================================== */
  return (
    <section className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 space-y-4 shadow-xs dark:shadow-none transition-colors">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mkv,.mov,.m4v,.webm"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Video Stage */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="relative w-full aspect-video rounded-xl bg-zinc-950 border border-zinc-300 dark:border-zinc-800/90 overflow-hidden flex items-center justify-center group shadow-inner">
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                playsInline
                preload="metadata"
                controls
                className="w-full h-full object-contain"
                {...videoHandlers}
              />
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-zinc-900/40 transition-colors w-full h-full gap-3 select-none"
              >
                <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 flex items-center justify-center group-hover:scale-105 group-hover:text-blue-400 group-hover:border-blue-500/40 transition-all">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200">Load a video file</h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                    Drop your video here or click to choose (.mp4, .mov, .mkv, .webm)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Video Info & Quick Controls */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Header / Actions */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800/60">
              <div className="min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                  Loaded Video
                </span>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate" title={videoFile?.name}>
                  {videoFile?.name || "No video loaded"}
                </p>
              </div>

              {videoUrl && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="accent"
                    size="xs"
                    icon={<Maximize2 className="w-3.5 h-3.5" />}
                    kbd="M"
                    onClick={() => setIsStudioOpen(true)}
                  >
                    Studio
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                    onClick={() => fileInputRef.current?.click()}
                    title="Change video"
                  />
                  <Button
                    variant="danger"
                    size="xs"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={removeVideo}
                    title="Remove video"
                  />
                </div>
              )}
            </div>

            {/* Timecode & Status */}
            <div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-white drop-shadow-xs">
                  {fmt(currentTime)}
                </span>
                {videoDuration > 0 && (
                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    / {fmt(videoDuration)}
                  </span>
                )}
              </div>

              <p
                className={`text-xs mt-1.5 leading-relaxed ${
                  isStatusBad
                    ? "text-rose-600 dark:text-rose-400 font-medium"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {statusText}
              </p>
            </div>

            {/* Active clip hint */}
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 text-xs transition-colors">
              <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                Selection Hint
              </span>
              <p className="text-zinc-800 dark:text-zinc-300 font-medium truncate mt-0.5">
                {curClip
                  ? `Active #${curIndex + 1}: ${curClip.title || "Untitled"}`
                  : "No clip selected. Click a clip or timeline bar to inspect."}
              </p>
            </div>
          </div>

          {/* Controls: Loop & Speed */}
          {videoUrl && (
            <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800/60">
              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isLooping}
                    onChange={e => setIsLooping(e.target.checked)}
                    className="w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-blue-500 focus:ring-0 cursor-pointer"
                  />
                  <Repeat className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span>Loop clip preview</span>
                </label>

                <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <Gauge className="w-3.5 h-3.5" />
                  <span>Speed:</span>
                  <select
                    value={playbackRate}
                    onChange={e => setPlaybackRate(Number(e.target.value))}
                    className="bg-zinc-100 dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-xs rounded-md px-2 py-0.5 focus:outline-none"
                  >
                    <option value={0.5}>0.5×</option>
                    <option value={0.75}>0.75×</option>
                    <option value={1}>1×</option>
                    <option value={1.25}>1.25×</option>
                    <option value={1.5}>1.5×</option>
                    <option value={2}>2×</option>
                  </select>
                </div>
              </div>

              {/* Keyboard shortcuts quick row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                <span className="bg-zinc-50 dark:bg-zinc-950/60 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800/80">
                  <kbd className="text-[10px] bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-700 dark:text-zinc-300 mr-1">Space</kbd> Play
                </span>
                <span className="bg-zinc-50 dark:bg-zinc-950/60 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800/80">
                  <kbd className="text-[10px] bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-700 dark:text-zinc-300 mr-1">I</kbd> Set In
                </span>
                <span className="bg-zinc-50 dark:bg-zinc-950/60 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800/80">
                  <kbd className="text-[10px] bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-700 dark:text-zinc-300 mr-1">O</kbd> Set Out
                </span>
                <span className="bg-zinc-50 dark:bg-zinc-950/60 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800/80">
                  <kbd className="text-[10px] bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-700 dark:text-zinc-300 mr-1">N</kbd> Next
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Format compatibility notice banner */}
      <MediaFixNotice />
    </section>
  );
}
