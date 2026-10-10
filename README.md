# Trim Clipsto

> **Fast, privacy-first, professional video clip trimmer and JSON metadata editor.**  
> Built for content creators, video editors, and automated clipping pipelines (e.g., FFmpeg, YouTube shorts/reels automation).

---

## Overview

**Trim Clipsto** is a client-side workstation for authoring, reviewing, and fine-tuning video clip segments. Load any local video alongside your clip metadata JSON, scrub with frame accuracy, adjust timestamps using professional NLE shortcuts, lock approved cuts, and export clean JSON metadata ready for batch rendering or rendering pipelines.

All processing occurs **100% locally in your browser**—no server uploads, no privacy compromises, and instant playback.

---

## Key Features

- **Dual-Mode Workstation**
  - **Split Workstation Layout**: Sticky synchronized video player + timeline on the left, responsive review queue on the right.
  - **Studio Mode**: Distraction-free, theater/fullscreen review mode with quick approval controls and dedicated timeline scrubbing.
- **Two-Tier Clip Lifecycle**
  - **Working Queue**: Active clips under review with inline title, timestamp, and filename editing.
  - **Approved & Locked Clips**: Finalized cuts move to the approved tray and are automatically locked to prevent accidental modifications, nudges, renames, or deletions.
- **Frame-Accurate Video Controller**
  - Frame stepping (`1/30s`), quick nudging (`±1s`, `±5s`), variable playback rates (`0.5x` to `2.0x`), loop playback, and Picture-in-Picture.
  - Set **In (`I`)** and **Out (`O`)** points directly from the current playhead.
- **Interactive Visual Timeline**
  - Zoomable timeline (`1x` to `10x`) with color-coded segment indicators, playhead tracking, and click-to-seek.
- **Audio & Media Diagnostic Notice**
  - In-browser container & codec inspection (`mediaInspect`) alerting users to proprietary audio streams (AC-3, EAC-3, DTS) with copy-paste FFmpeg conversion helpers.
- **Full Offline Persistence & Undo**
  - LocalStorage session auto-saving with session restore banner.
  - Single-action snapshot Undo (`Ctrl+Z` / Toast Undo button) across removals, bulk edits, and approval resets.
- **Clean JSON Import & Export**
  - Direct `.json` file upload or paste via modal.
  - One-click copy, download as formatted JSON, and smart filename generator (`suggestName`).
- **Dark & Light Themes**
  - Seamless toggle with persistent theme tokens built on Tailwind CSS v4.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Tooling & Bundler** | [Vite 6](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with native CSS variables |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) (Persistence & Snapshots) |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## Keyboard Shortcuts

Designed for speed editing without touching the mouse:

| Key | Action | Context |
|---|---|---|
| `Space` | Play / Pause video | Global (when not editing text) |
| `←` / `→` | Nudge playhead `±1s` (`Shift`: `±5s`) | Video loaded |
| `,` / `.` | Frame step backward / forward (`1/30s`) | Video loaded |
| `I` | Set clip **In** point to current time | Active clip |
| `O` | Set clip **Out** point to current time | Active clip |
| `P` | Preview current clip segment | Active clip |
| `+` or `=` | Add new clip at current playhead | Video loaded |
| `N` | Jump to next unapproved clip | Global |
| `PageUp` / `PageDown` | Navigate through clips | Global |
| `M` | Toggle **Studio Mode** (Theater) | Global |
| `F` | Toggle browser Fullscreen | Studio Mode |
| `Enter` | Approve active clip and advance to next | Studio Mode |
| `Esc` | Exit Studio Mode / Close active modal | Global |

---

## JSON Format

Trim Clipsto consumes and produces clean JSON arrays conforming to this schema:

```json
[
  {
    "title": "Intro Hook & Teaser",
    "start": "00:01:15.000",
    "end": "00:01:45.500",
    "output_name": "01_intro_hook.mp4"
  },
  {
    "title": "Main Breakdown",
    "start": "00:04:20.000",
    "end": "00:05:10.000",
    "output_name": "02_main_breakdown.mp4"
  }
]
```

### Supported Time Formats
- Seconds float: `75.5`
- Minutes and seconds: `01:15` or `01:15.500`
- Hours, minutes, and seconds: `00:01:15` or `00:01:15.500`

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or later recommended)
- `npm` (or `pnpm` / `yarn`)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/TrimClipsto.git
   cd TrimClipsto
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

### Production Build

To compile a production bundle:
```bash
npm run build
```

To preview the production build locally:
```bash
npm run preview
```

---

## Project Structure

```text
TrimClipsto/
├── public/                 # Static branding assets, favicons, site.webmanifest
├── src/
│   ├── components/
│   │   ├── Clips/          # Working queue, approved cards, empty state, subtoolbar
│   │   ├── Header/         # Navigation, project actions, theme switcher
│   │   ├── Preview/        # Live JSON syntax preview & export
│   │   ├── Timeline/       # Interactive visual timeline scrubber
│   │   ├── Video/          # Video player panel, Studio modal, media diagnostic notice
│   │   └── ui/             # Reusable UI primitives (Button, Modal, Toast, Logo)
│   ├── hooks/
│   │   ├── useFileDrop.ts          # Window-level drag & drop for JSON/video files
│   │   ├── useKeyboardShortcuts.ts # Pro NLE key bindings
│   │   └── useVideoController.ts   # HTML5 video playback and playback bounding
│   ├── store/
│   │   ├── useClipStore.ts         # Zustand core store (clips, video, undo, persistence)
│   │   └── useThemeStore.ts        # Light/Dark mode state management
│   ├── types/                      # TypeScript interfaces & types
│   ├── utils/
│   │   ├── constants.ts            # App defaults and storage keys
│   │   ├── mediaInspect.ts         # Client-side video/audio stream parser
│   │   ├── time.ts                 # Time parsing & formatting utilities
│   │   └── validation.ts           # Clip validation & filename sanitization
│   ├── App.tsx             # Root workspace layout
│   ├── index.css           # Tailwind v4 directives & theme tokens
│   └── main.tsx            # React application entry point
├── index.html              # HTML shell with meta tags & icons
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Privacy & Security

Trim Clipsto operates strictly on the client side. Your video files and JSON data never leave your computer, making it completely safe for proprietary, unreleased, or sensitive footage.

---

## License

MIT
