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
