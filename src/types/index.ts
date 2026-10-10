export interface Clip {
  id: number;
  title: string;
  start: string;
  end: string;
  output_name: string;
  ok: boolean;
  extra?: Record<string, any>;
}

export interface ValidationIssue {
  f: "title" | "start" | "end" | "output_name";
  l: "warn" | "err";
  t: string;
}

export interface ClipValidation {
  issues: ValidationIssue[];
  s: number | null;
  e: number | null;
  dur: number | null;
}

export interface MediaInspectInfo {
  isMkv: boolean;
  audioCodec: string | null;
  audioName: string | null;
  isUnsupportedAudio: boolean;
  noPicture?: boolean;
}

export interface PlayingClipState {
  id: number;
  s: number;
  e: number;
}

export type TimeFormatOption = "timecode" | "short" | "seconds";
export type FileExtensionOption = ".mp4" | ".mkv" | ".mov" | ".webm";
export type SlugSeparatorOption = "_" | "-";
export type JsonIndentOption = "2" | "4" | "minified";

export interface AppSettings {
  // Project Name
  projectName: string;

  // Naming & Files
  namingPattern: string;
  fileExtension: FileExtensionOption;
  slugSeparator: SlugSeparatorOption;
  maxSlugWords: number;

  // Video & Playback
  fps: number;
  defaultClipDuration: number;
  nudgeSmall: number;
  nudgeLarge: number;
  loopClipPlayback: boolean;

  // Export & JSON
  timestampFormat: TimeFormatOption;
  strictApprovalGuard: boolean;
  jsonIndent: JsonIndentOption;

  // Workflow
  autoAdvanceOnApprove: boolean;
  autoSeekOnSelect: boolean;
}
