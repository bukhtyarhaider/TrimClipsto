import { useState } from "react";
import { useClipStore, toExportJSON } from "../../store/useClipStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { slug } from "../../utils/validation";
import { Button } from "../ui/Button";
import { Code, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

export function PreviewPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { clips, showToast } = useClipStore();
  const { projectName, jsonIndent, timestampFormat } = useSettingsStore(
    state => state.settings
  );

  if (!clips.length) return null;

  const exportedData = toExportJSON(clips, timestampFormat);
  const indentSpace = jsonIndent === "minified" ? undefined : Number(jsonIndent);
  const jsonString = indentSpace
    ? JSON.stringify(exportedData, null, indentSpace)
    : JSON.stringify(exportedData);

  const displayFileName = projectName.trim()
    ? `${slug(projectName)}_clips.json`
    : "clips.json";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      showToast("JSON copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      showToast("Failed to copy automatically.");
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 shadow-xs dark:shadow-none overflow-hidden transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <Code className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">
            Preview the file you'll download
          </span>
        </div>

        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        )}
      </button>

      {isOpen && (
        <div className="p-4 pt-0 space-y-3 border-t border-zinc-200 dark:border-zinc-800/60">
          <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
            <span>
              This is exactly what gets saved to{" "}
              <code className="font-mono text-blue-600 dark:text-blue-400">
                {displayFileName}
              </code>
              .
            </span>
            <Button
              variant="secondary"
              size="xs"
              icon={copied ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
              onClick={handleCopy}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <pre className="p-4 rounded-xl bg-zinc-900 dark:bg-zinc-950 font-mono text-xs text-zinc-200 dark:text-zinc-300 overflow-x-auto max-h-80 border border-zinc-800/80">
            {jsonString}
          </pre>
        </div>
      )}
    </section>
  );
}
