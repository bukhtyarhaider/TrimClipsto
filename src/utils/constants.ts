/**
 * Application constants and theme helpers.
 */

export const STORE_KEY = "clip-editor-v2";

export const DEFAULT_STATUS =
  "Press the blue play button on a clip to preview it. Use the target buttons next to the times to copy the video's current time.";

/**
 * Generates an HSL accent color for a clip index.
 */
export function getColor(i: number): string {
  return `hsl(${(i * 53 + 215) % 360} 70% 66%)`;
}

/**
 * Generates an HSL background color with low alpha for badges and tags.
 */
export function getColorBg(i: number, opacity = 0.15): string {
  return `hsla(${(i * 53 + 215) % 360}, 70%, 66%, ${opacity})`;
}
