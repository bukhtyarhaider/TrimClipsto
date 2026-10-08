import React, { useRef, useCallback, useEffect, useMemo } from "react";
import { useClipStore } from "../store/useClipStore";
import { toSec } from "../utils/time";

export function useVideoController() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number>(0);
  const isSeekingToStartRef = useRef<boolean>(false);
  const lastTimeUpdateRef = useRef<number>(0);

  const {
    videoDuration,
    playingClip,
    isLooping,
    playbackRate,
    clips,
    setCurrentTime,
    setVideoDuration,
    setIsPlaying,
    setPlayingClip,
    setStatus,
    showToast,
    setActiveId,
  } = useClipStore();

  // Tick loop for high-precision timecode tracking and clip boundary detection
  const tick = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const cur = vid.currentTime;
    const now = performance.now();

    // Smooth state updates to ~30fps (every 33ms) to avoid flooded React renders
    if (now - lastTimeUpdateRef.current >= 33 || vid.paused) {
      lastTimeUpdateRef.current = now;
      setCurrentTime(cur);
    }

    const activePlaying = useClipStore.getState().playingClip;
    const looping = useClipStore.getState().isLooping;

    if (activePlaying) {
      // If we were seeking to the start of the clip, check if playhead has reached start
      if (isSeekingToStartRef.current) {
        if (
          Math.abs(cur - activePlaying.s) <= 0.35 ||
          (cur >= activePlaying.s && cur < activePlaying.e)
        ) {
          isSeekingToStartRef.current = false;
        }
      }

      // Check if clip reached end (only after start was reached!)
      if (!vid.seeking && !isSeekingToStartRef.current && cur >= activePlaying.e) {
        if (looping) {
          isSeekingToStartRef.current = true;
          vid.currentTime = activePlaying.s;
          setCurrentTime(activePlaying.s);
        } else {
          vid.pause();
          setPlayingClip(null);
          isSeekingToStartRef.current = false;
          vid.currentTime = Math.min(activePlaying.e, vid.duration || activePlaying.e);
          setCurrentTime(vid.currentTime);
        }
      }
    }

    if (!vid.paused) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [setCurrentTime, setPlayingClip]);

  const handleLoadedMetadata = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const vid = e.currentTarget;
      const dur = vid.duration;
      if (dur && !isNaN(dur) && isFinite(dur)) {
        setVideoDuration(dur);
        setStatus(`Video ready (${dur.toFixed(1)}s)`);
      }
      vid.playbackRate = useClipStore.getState().playbackRate;
    },
    [setVideoDuration, setStatus]
  );

  const handleDurationChange = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const dur = e.currentTarget.duration;
      if (dur && !isNaN(dur) && isFinite(dur)) {
        setVideoDuration(dur);
      }
    },
    [setVideoDuration]
  );

  const handleCanPlay = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    vid.playbackRate = useClipStore.getState().playbackRate;
  }, []);

  const handleSeeked = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    setCurrentTime(vid.currentTime);
    isSeekingToStartRef.current = false;
  }, [setCurrentTime]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [setIsPlaying, tick]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    isSeekingToStartRef.current = false;
    // If we paused manually, clear playing clip preview
    const activePlaying = useClipStore.getState().playingClip;
    if (activePlaying) {
      setPlayingClip(null);
    }
  }, [setIsPlaying, setPlayingClip]);

  const handleTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      // Sync on native timeupdate if RAF is not actively firing
      if (videoRef.current?.paused) {
        setCurrentTime(e.currentTarget.currentTime);
      }
    },
    [setCurrentTime]
  );

  const handleError = useCallback(() => {
    const vid = videoRef.current;
    if (!vid || !vid.getAttribute("src")) return;
    setVideoDuration(0);
    setStatus("Your browser can't decode or play this file.", true);
  }, [setVideoDuration, setStatus]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Sync playback rate when changed in store
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
      videoRef.current.defaultPlaybackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlayPause = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      const activePlaying = useClipStore.getState().playingClip;
      if (activePlaying && vid.currentTime >= activePlaying.e - 0.05) {
        setPlayingClip(null);
      }
      if ((vid.duration || 0) > 0 && vid.currentTime >= (vid.duration || 0) - 0.1) {
        vid.currentTime = 0;
        setCurrentTime(0);
      }
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [setPlayingClip, setCurrentTime]);

  const seekTo = useCallback(
    (sec: number) => {
      const vid = videoRef.current;
      if (!vid) return;
      setPlayingClip(null);
      isSeekingToStartRef.current = false;
      const dur = vid.duration || videoDuration || 0;
      const clamped = dur > 0 ? Math.min(Math.max(0, sec), dur) : Math.max(0, sec);
      vid.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [videoDuration, setPlayingClip, setCurrentTime]
  );

  const nudge = useCallback(
    (delta: number) => {
      const vid = videoRef.current;
      if (!vid) return;
      setPlayingClip(null);
      isSeekingToStartRef.current = false;
      const dur = vid.duration || videoDuration || 0;
      const target =
        dur > 0
          ? Math.min(Math.max(0, vid.currentTime + delta), dur)
          : Math.max(0, vid.currentTime + delta);
      vid.currentTime = target;
      setCurrentTime(target);
    },
    [videoDuration, setPlayingClip, setCurrentTime]
  );

  const playClip = useCallback(
    (id: number) => {
      const vid = videoRef.current;
      if (!vid || !vid.duration) {
        showToast("Load a video first, then preview clips");
        return;
      }

      if (playingClip && playingClip.id === id) {
        vid.pause();
        setPlayingClip(null);
        isSeekingToStartRef.current = false;
        return;
      }

      const clip = clips.find(c => c.id === id);
      if (!clip) return;

      const s = toSec(clip.start);
      const e = toSec(clip.end);
      if (s === null || e === null || e <= s) {
        showToast("Fix this clip's start and end times first");
        return;
      }

      setActiveId(id);
      setPlayingClip({ id, s, e });
      isSeekingToStartRef.current = true;
      const targetStart = Math.min(s, vid.duration || s);
      vid.currentTime = targetStart;
      setCurrentTime(targetStart);
      vid.play().catch(() => {
        setPlayingClip(null);
        isSeekingToStartRef.current = false;
      });
      setStatus(`Previewing clip: ${clip.title || "Untitled"}`);
    },
    [clips, playingClip, setActiveId, setPlayingClip, setStatus, showToast, setCurrentTime]
  );

  const stopPreview = useCallback(() => {
    const vid = videoRef.current;
    if (vid && !vid.paused) {
      vid.pause();
    }
    setPlayingClip(null);
    isSeekingToStartRef.current = false;
  }, [setPlayingClip]);

  const videoHandlers = useMemo(
    () => ({
      onLoadedMetadata: handleLoadedMetadata,
      onDurationChange: handleDurationChange,
      onCanPlay: handleCanPlay,
      onSeeked: handleSeeked,
      onPlay: handlePlay,
      onPause: handlePause,
      onTimeUpdate: handleTimeUpdate,
      onError: handleError,
    }),
    [
      handleLoadedMetadata,
      handleDurationChange,
      handleCanPlay,
      handleSeeked,
      handlePlay,
      handlePause,
      handleTimeUpdate,
      handleError,
    ]
  );

  return {
    videoRef,
    videoHandlers,
    togglePlayPause,
    seekTo,
    nudge,
    playClip,
    stopPreview,
  };
}
