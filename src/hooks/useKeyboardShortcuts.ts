import { useEffect } from "react";
import { useClipStore } from "../store/useClipStore";
import { fmt, toSec } from "../utils/time";

interface KeyboardShortcutsProps {
  togglePlayPause: () => void;
  nudge: (delta: number) => void;
  playClip: (id: number) => void;
  seekTo: (sec: number) => void;
}

export function useKeyboardShortcuts({
  togglePlayPause,
  nudge,
  playClip,
  seekTo,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;

      const target = e.target as HTMLElement;
      const tag = target.tagName;
      const isEditingText = tag === "INPUT" || tag === "TEXTAREA";

      const store = useClipStore.getState();
      const {
        isStudioOpen,
        setIsStudioOpen,
        activeId,
        clips,
        currentTime,
        videoDuration,
        toggleApproval,
        setActiveId,
        updateClip,
        addClip,
        showToast,
      } = store;

      // Escape closes Studio Mode or modals even when focusing input
      if (e.key === "Escape") {
        if (isStudioOpen) {
          e.preventDefault();
          setIsStudioOpen(false);
          return;
        }
        if (store.isPasteOpen) {
          e.preventDefault();
          store.closePasteModal();
          return;
        }
        if (store.confirmModal) {
          e.preventDefault();
          store.closeConfirmModal();
          return;
        }
      }

      // Enter in studio mode approves & goes to next clip (unless on a button)
      if (e.key === "Enter" && isStudioOpen && tag !== "BUTTON") {
        e.preventDefault();
        if (activeId) {
          const res = toggleApproval(activeId);
          if (res?.approved) {
            if (res.nextId !== null) {
              setActiveId(res.nextId);
              const nextClip = clips.find(c => c.id === res.nextId);
              const s = nextClip ? toSec(nextClip.start) : null;
              if (s !== null) seekTo(s);
            } else {
              const curIdx = clips.findIndex(c => c.id === activeId);
              const nextIdx = curIdx >= clips.length - 1 ? 0 : curIdx + 1;
              if (clips[nextIdx]) {
                setActiveId(clips[nextIdx].id);
                const s = toSec(clips[nextIdx].start);
                if (s !== null) seekTo(s);
              }
            }
          }
        }
        return;
      }

      // If typing in input/textarea, ignore all single-key hotkeys
      if (isEditingText || target.closest("dialog")) return;

      // Button enter/space should trigger the button itself
      if (tag === "BUTTON" && (e.key === " " || e.key === "Enter")) return;

      const k = e.key.toLowerCase();

      // Studio Mode toggle
      if (k === "m") {
        e.preventDefault();
        setIsStudioOpen(!isStudioOpen);
        return;
      }

      // Fullscreen toggle in studio mode
      if (k === "f" && isStudioOpen) {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        } else {
          document.exitFullscreen?.().catch(() => {});
        }
        return;
      }

      // Next clip to review
      if (k === "n") {
        e.preventDefault();
        if (!clips.length) return;
        const curIdx = clips.findIndex(c => c.id === activeId);
        for (let step = 1; step <= clips.length; step++) {
          const idx = (curIdx + step + clips.length) % clips.length;
          if (!clips[idx].ok) {
            setActiveId(clips[idx].id);
            const s = toSec(clips[idx].start);
            if (s !== null) seekTo(s);
            return;
          }
        }
        showToast("All clips are approved!");
        return;
      }

      // Navigation: PageUp / PageDown
      if (e.key === "PageUp") {
        e.preventDefault();
        if (!clips.length) return;
        const curIdx = clips.findIndex(c => c.id === activeId);
        const prevIdx = curIdx <= 0 ? clips.length - 1 : curIdx - 1;
        setActiveId(clips[prevIdx].id);
        const s = toSec(clips[prevIdx].start);
        if (s !== null) seekTo(s);
        return;
      }

      if (e.key === "PageDown") {
        e.preventDefault();
        if (!clips.length) return;
        const curIdx = clips.findIndex(c => c.id === activeId);
        const nextIdx = curIdx >= clips.length - 1 ? 0 : curIdx + 1;
        setActiveId(clips[nextIdx].id);
        const s = toSec(clips[nextIdx].start);
        if (s !== null) seekTo(s);
        return;
      }

      // New clip at current playhead: + or =
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        const newClip = addClip(currentTime);
        showToast(`Created new clip at ${newClip.start}`);
        return;
      }

      // Preview active clip: P
      if (k === "p") {
        e.preventDefault();
        if (activeId) {
          playClip(activeId);
        }
        return;
      }

      // Video playback hotkeys (require loaded video)
      if (videoDuration > 0) {
        if (e.key === " ") {
          e.preventDefault();
          togglePlayPause();
          return;
        }

        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          const step = (e.shiftKey ? 5 : 1) * (e.key === "ArrowLeft" ? -1 : 1);
          nudge(step);
          return;
        }

        if (e.key === "," || e.key === ".") {
          e.preventDefault();
          const frameStep = (e.key === "," ? -1 : 1) / 30;
          nudge(frameStep);
          return;
        }

        if (k === "i" && activeId) {
          e.preventDefault();
          const targetClip = clips.find(c => c.id === activeId);
          if (targetClip?.ok) {
            showToast("Clip is approved and locked. Unapprove it to edit.");
            return;
          }
          updateClip(activeId, { start: fmt(currentTime) });
          showToast(`Set In point: ${fmt(currentTime)}`);
          return;
        }

        if (k === "o" && activeId) {
          e.preventDefault();
          const targetClip = clips.find(c => c.id === activeId);
          if (targetClip?.ok) {
            showToast("Clip is approved and locked. Unapprove it to edit.");
            return;
          }
          updateClip(activeId, { end: fmt(currentTime) });
          showToast(`Set Out point: ${fmt(currentTime)}`);
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlayPause, nudge, playClip, seekTo]);
}
