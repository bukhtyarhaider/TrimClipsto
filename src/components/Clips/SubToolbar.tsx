import { useClipStore } from "../../store/useClipStore";
import { Button } from "../ui/Button";
import {
  ArrowRight,
  ArrowUpDown,
  Wand2,
  RotateCcw,
  Trash2,
} from "lucide-react";

export function SubToolbar() {
  const {
    clips,
    activeId,
    setActiveId,
    sortClipsByStart,
    suggestAllNames,
    resetAllApprovals,
    clearAll,
    openConfirmModal,
    showToast,
  } = useClipStore();

  if (!clips.length) return null;

  const handleNextToReview = () => {
    const curIdx = clips.findIndex(c => c.id === activeId);
    for (let step = 1; step <= clips.length; step++) {
      const idx = (curIdx + step + clips.length) % clips.length;
      if (!clips[idx].ok) {
        setActiveId(clips[idx].id);
        return;
      }
    }
    showToast("Every clip is approved");
  };

  const handleStartOver = () => {
    openConfirmModal(
      "Start over?",
      "Clear everything and go back to the empty screen? You can undo this right after.",
      () => clearAll()
    );
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 py-1">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="accent"
          size="sm"
          icon={<ArrowRight className="w-3.5 h-3.5" />}
          kbd="N"
          onClick={handleNextToReview}
        >
          Next to review
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<ArrowUpDown className="w-3.5 h-3.5" />}
          onClick={sortClipsByStart}
        >
          Sort by start time
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<Wand2 className="w-3.5 h-3.5" />}
          onClick={suggestAllNames}
        >
          Suggest all file names
        </Button>

        <Button
          variant="secondary"
          size="sm"
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={resetAllApprovals}
        >
          Reset approvals
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
        icon={<Trash2 className="w-3.5 h-3.5" />}
        onClick={handleStartOver}
      >
        Start over
      </Button>
    </div>
  );
}
