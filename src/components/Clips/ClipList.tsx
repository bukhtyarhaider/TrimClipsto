import { useMemo, useState } from "react";
import { useClipStore } from "../../store/useClipStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { validateClips } from "../../utils/validation";
import { ClipCard } from "./ClipCard";
import { ApprovedCard } from "./ApprovedCard";
import { EmptyState } from "./EmptyState";
import { Button } from "../ui/Button";
import { Plus, CheckCircle2, ChevronDown, ChevronUp, Lock } from "lucide-react";

interface ClipListProps {
  playClip: (id: number) => void;
  seekTo: (sec: number) => void;
}

export function ClipList({ playClip, seekTo }: ClipListProps) {
  const [isApprovedOpen, setIsApprovedOpen] = useState(true);

  const {
    clips,
    videoDuration,
    addClip,
  } = useClipStore();

  const fileExtension = useSettingsStore(state => state.settings.fileExtension);

  const validationResults = useMemo(() => {
    return validateClips(clips, videoDuration, fileExtension);
  }, [clips, videoDuration, fileExtension]);

  if (!clips.length) {
    return <EmptyState />;
  }

  const unapprovedClips = clips
    .map((c, i) => ({ c, i, val: validationResults[i] }))
    .filter(x => !x.c.ok);

  const approvedClips = clips
    .map((c, i) => ({ c, i, val: validationResults[i] }))
    .filter(x => x.c.ok);

  return (
    <div className="space-y-6">
      {/* "To Review" Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">To review</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              {unapprovedClips.length}
            </span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => addClip(useClipStore.getState().currentTime || 0)}
          >
            Add a clip
          </Button>
        </div>

        {unapprovedClips.length > 0 ? (
          <div className="space-y-3">
            {unapprovedClips.map(({ c, i, val }) => (
              <ClipCard
                key={c.id}
                clip={c}
                index={i}
                validation={val}
                playClip={playClip}
                seekTo={seekTo}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>Every clip is approved. Download your file when you're ready!</span>
          </div>
        )}
      </section>

      {/* "Approved and Locked" Section */}
      <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 shadow-xs dark:shadow-none overflow-hidden transition-colors">
        <button
          onClick={() => setIsApprovedOpen(!isApprovedOpen)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
              Approved and locked
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              {approvedClips.length}
            </span>
          </div>

          {isApprovedOpen ? (
            <ChevronUp className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          )}
        </button>

        {isApprovedOpen && (
          <div className="p-4 pt-0 space-y-2 border-t border-zinc-200 dark:border-zinc-800/60">
            {approvedClips.length > 0 ? (
              approvedClips.map(({ c, i }) => (
                <ApprovedCard
                  key={c.id}
                  clip={c}
                  index={i}
                  playClip={playClip}
                  seekTo={seekTo}
                />
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-3 text-center">
                Approved clips are locked and move here automatically.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
