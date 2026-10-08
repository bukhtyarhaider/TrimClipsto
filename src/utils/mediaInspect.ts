import { MediaInspectInfo } from "../types";

/**
 * Inspects video container and audio headers to detect unsupported formats like AC-3 / DTS in MKV.
 */
export async function inspectFileMedia(file: File | null): Promise<MediaInspectInfo> {
  const result: MediaInspectInfo = {
    isMkv: false,
    audioCodec: null,
    audioName: null,
    isUnsupportedAudio: false,
    noPicture: false,
  };

  if (!file) return result;
  const name = file.name || "";
  const ext = name.split(".").pop()?.toLowerCase() || "";
  result.isMkv = ext === "mkv" || file.type === "video/x-matroska";

  if (result.isMkv || ext === "webm" || ext === "mp4" || ext === "mov") {
    try {
      const slice = file.slice(0, Math.min(file.size, 512 * 1024));
      const buffer = await slice.arrayBuffer();
      const text = new TextDecoder("latin1").decode(new Uint8Array(buffer));

      const match = text.match(
        /A_(AC3|EAC3|DTS[A-Z0-9_/]*|TRUEHD|AAC|OPUS|VORBIS|PCM[A-Z0-9_/]*|MPEG\/[A-Z0-9]+|FLAC)/i
      );
      if (match) {
        const raw = match[1].toUpperCase();
        result.audioCodec = raw;
        if (raw === "AC3") {
          result.audioName = "Dolby Digital (AC-3)";
          result.isUnsupportedAudio = true;
        } else if (raw === "EAC3") {
          result.audioName = "Dolby Digital Plus (E-AC-3)";
          result.isUnsupportedAudio = true;
        } else if (raw.startsWith("DTS")) {
          result.audioName = "DTS Audio";
          result.isUnsupportedAudio = true;
        } else if (raw === "TRUEHD") {
          result.audioName = "Dolby TrueHD";
          result.isUnsupportedAudio = true;
        } else if (raw === "AAC") {
          result.audioName = "AAC";
        } else if (raw === "OPUS") {
          result.audioName = "Opus";
        } else if (raw === "VORBIS") {
          result.audioName = "Vorbis";
        } else if (raw === "FLAC") {
          result.audioName = "FLAC";
        } else {
          result.audioName = raw;
        }
      } else if (result.isMkv) {
        // MKV container with unparsed audio usually contains AC3 / DTS
        result.isUnsupportedAudio = true;
        result.audioName = "AC-3 / DTS";
      }
    } catch (_) {
      if (result.isMkv) {
        result.isUnsupportedAudio = true;
        result.audioName = "AC-3 / DTS";
      }
    }
  }

  return result;
}
