import { useEffect, useState } from "react";
import { useClipStore } from "../store/useClipStore";

export function useFileDrop() {
  const [isDragging, setIsDragging] = useState(false);
  const { loadVideoFile, importText, showToast } = useClipStore();

  useEffect(() => {
    let dragCounter = 0;

    const isVideo = (f: File) =>
      /^video\//.test(f.type) || /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(f.name);

    const handleDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        dragCounter++;
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      dragCounter = Math.max(0, dragCounter - 1);
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);

      const file = e.dataTransfer?.files?.[0];
      if (!file) return;

      if (isVideo(file)) {
        loadVideoFile(file);
        showToast(`Loaded video: ${file.name}`);
        return;
      }

      // Check if it's JSON or text
      try {
        const text = await file.text();
        const err = await importText(text);
        if (err) {
          alert(err);
        }
      } catch (err: any) {
        alert("Failed to read dropped file: " + err.message);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [loadVideoFile, importText, showToast]);

  return { isDragging };
}
