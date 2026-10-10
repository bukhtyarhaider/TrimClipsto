import { useEffect } from "react";
import { useClipStore } from "./store/useClipStore";
import { useVideoController } from "./hooks/useVideoController";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useFileDrop } from "./hooks/useFileDrop";

import { Header } from "./components/Header/Header";
import { VideoPanel } from "./components/Video/VideoPanel";
import { SubToolbar } from "./components/Clips/SubToolbar";
import { ClipList } from "./components/Clips/ClipList";
import { PreviewPanel } from "./components/Preview/PreviewPanel";

import { Toast } from "./components/ui/Toast";
import { PasteDialog } from "./components/ui/PasteDialog";
import { ConfirmDialog } from "./components/ui/ConfirmDialog";
import { DropOverlay } from "./components/ui/DropOverlay";
import { SettingsModal } from "./components/Settings/SettingsModal";

export default function App() {
  const { loadSavedSession, videoUrl } = useClipStore();

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
      <main
        className={`w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 flex-1 transition-all ${
          videoUrl ? "max-w-7xl" : "max-w-5xl"
        }`}
      >
        <Header />

        {videoUrl ? (
          /* Split Workstation Layout when video is loaded */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Sticky Unified Video + Timeline Workstation */}
            <div className="lg:col-span-5 xl:col-span-6 lg:sticky lg:top-4 z-20 space-y-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto pr-0.5">
              <VideoPanel
                videoRef={videoRef}
                videoHandlers={videoHandlers}
                togglePlayPause={togglePlayPause}
                seekTo={seekTo}
                nudge={nudge}
                playClip={playClip}
              />
            </div>

            {/* Right Column: Clips and Review (scrollable long list) */}
            <div className="lg:col-span-7 xl:col-span-6 space-y-6 min-w-0">
              <SubToolbar />
              <ClipList playClip={playClip} seekTo={seekTo} />
              <PreviewPanel />
            </div>
          </div>
        ) : (
          /* Clean Single Column Layout when NO video is loaded (Timeline Only) */
          <div className="space-y-6">
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
          </div>
        )}
      </main>

      {/* Minimalist Studio Footer */}
      <footer className="w-full border-t border-zinc-200/80 dark:border-zinc-800/80 py-4 px-4 sm:px-6 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Trim Clipsto</span>
            <span>•</span>
            <span>
              Developed by{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Bukhtyar Haider
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
      
            <span>•</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </footer>

      {/* Global Dialogs and Overlays */}
      <PasteDialog />
      <SettingsModal />
      <ConfirmDialog />
      <Toast />
      <DropOverlay isDragging={isDragging} />
    </div>
  );
}
