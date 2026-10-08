import React, { useRef, useCallback, useEffect } from "react";
import { useClipStore } from "../store/useClipStore";
import { toSec } from "../utils/time";

export function useVideoController() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number>(0);

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
    setCurrentTime(cur);

    const activePlaying = useClipStore.getState().playingClip;
    const looping = useClipStore.getState().isLooping;

    if (activePlaying && !vid.paused && !vid.seeking && cur >= activePlaying.e) {
      if (looping) {
        vid.currentTime = activePlaying.s;
      } else {
        vid.pause();
        setPlayingClip(null);
        vid.currentTime = Math.min(activePlaying.e, vid.duration || activePlaying.e);
        setCurrentTime(vid.currentTime);
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
      }
      vid.playbackRate = useClipStore.getState().playbackRate;
      const savedTime = useClipStore.getState().currentTime;
      if (savedTime > 0 && dur && savedTime <= dur) {
        vid.currentTime = savedTime;
      }
      if (dur && isFinite(dur)) {
        setStatus(`Video ready (${dur.toFixed(1)}s)`);
      }
    },
    [setVideoDuration, setStatus]
  );

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
    // If we paused manually, clear playing clip preview
    const activePlaying = useClipStore.getState().playingClip;
    if (activePlaying) {
      setPlayingClip(null);
    }
  }, [setIsPlaying, setPlayingClip]);

  const handleTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      setCurrentTime(e.currentTarget.currentTime);
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
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, []);

  const seekTo = useCallback(
    (sec: number) => {
      const vid = videoRef.current;
      if (!vid) return;
      setPlayingClip(null);
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
      const dur = vid.duration || videoDuration || 0;
      const target = dur > 0 ? Math.min(Math.max(0, vid.currentTime + delta), dur) : Math.max(0, vid.currentTime + delta);
      vid.currentTime = target;
      setCurrentTime(target);
    },
    [videoDuration, setCurrentTime]
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
      vid.currentTime = Math.min(s, vid.duration);
      vid.play().catch(() => {
        setPlayingClip(null);
      });
      setStatus(`Previewing clip: ${clip.title || "Untitled"}`);
    },
    [clips, playingClip, setActiveId, setPlayingClip, setStatus, showToast]
  );

  const stopPreview = useCallback(() => {
    const vid = videoRef.current;
    if (vid && !vid.paused) {
      vid.pause();
    }
    setPlayingClip(null);
  }, [setPlayingClip]);

  return {
    videoRef,
    videoHandlers: {
      onLoadedMetadata: handleLoadedMetadata,
      onDurationChange: handleLoadedMetadata,
      onCanPlay: handleLoadedMetadata,
      onPlay: handlePlay,
      onPause: handlePause,
      onTimeUpdate: handleTimeUpdate,
      onError: handleError,
    },
    togglePlayPause,
    seekTo,
    nudge,
    playClip,
    stopPreview,
  };
}
