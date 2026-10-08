import { useEffect } from "react";
import { useClipStore } from "./store/useClipStore";
import { useVideoController } from "./hooks/useVideoController";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useFileDrop } from "./hooks/useFileDrop";

import { Header } from "./components/Header/Header";
import { Timeline } from "./components/Timeline/Timeline";
import { VideoPanel } from "./components/Video/VideoPanel";
import { SubToolbar } from "./components/Clips/SubToolbar";
import { ClipList } from "./components/Clips/ClipList";
import { PreviewPanel } from "./components/Preview/PreviewPanel";

import { Toast } from "./components/ui/Toast";
import { PasteDialog } from "./components/ui/PasteDialog";
import { ConfirmDialog } from "./components/ui/ConfirmDialog";
import { DropOverlay } from "./components/ui/DropOverlay";

export default function App() {
  const { loadSavedSession } = useClipStore();

  useEffect(() => {
    loadSavedSession();
  }, [loadSavedSession]);

  const {
    videoRef,
    videoHandlers,
    togglePlayPause,
    seekTo,
    nudge,
    playClip,
  } = useVideoController();

  useKeyboardShortcuts({
    togglePlayPause,
    nudge,
    playClip,
    seekTo,
  });

  const { isDragging } = useFileDrop();

  return (
    <div className="min-h-screen bg-zinc-100/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans antialiased transition-colors duration-200 selection:bg-blue-500/20 selection:text-blue-900 dark:selection:bg-blue-500/30 dark:selection:text-blue-200">
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 flex-1">
        <Header />
        <Timeline seekTo={seekTo} />
        <VideoPanel
          videoRef={videoRef}
          videoHandlers={videoHandlers}
          togglePlayPause={togglePlayPause}
          seekTo={seekTo}
          nudge={nudge}
          playClip={playClip}
        />
        <SubToolbar />
        <ClipList playClip={playClip} seekTo={seekTo} />
        <PreviewPanel />
      </main>

      {/* Global Dialogs and Overlays */}
      <PasteDialog />
      <ConfirmDialog />
      <Toast />
      <DropOverlay isDragging={isDragging} />
    </div>
  );
}
