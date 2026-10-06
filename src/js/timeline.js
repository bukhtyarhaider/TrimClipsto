/**
 * Visual timeline bar, playhead, and time axis rendering.
 */

import { getColor } from "./constants.js";
import { esc, short } from "./time.js";

/**
 * Renders the timeline segments, playhead, and time axis labels.
 * @param {HTMLElement} barEl - Timeline bar container
 * @param {HTMLElement} axisEl - Timeline axis container
 * @param {Array<object>} clips - List of clips
 * @param {Array<object>} validationResults - Results from validateClips
 * @param {number} videoDur - Duration of currently loaded video
 * @param {number} currentTime - Current video currentTime
 * @returns {number} The calculated maximum duration for the timeline
 */
export function renderTimeline(barEl, axisEl, clips, validationResults, videoDur, currentTime) {
  const valid = validationResults
    .map((r, i) => ({ r, i }))
    .filter(x => x.r.dur !== null);

  const tlMax = Math.max(videoDur || 0, ...valid.map(x => x.r.e), 0);
  barEl.classList.toggle("seekable", Boolean(videoDur && tlMax));

  if (!tlMax) {
    barEl.innerHTML = `<div class="tl-empty">Clips will appear here as you add valid times</div>`;
    axisEl.innerHTML = "";
    return 0;
  }

  const max = tlMax;
  const segmentsHtml = valid
    .map(({ r, i }) => {
      const flag = r.issues.some(x => x.l === "err");
      const doneClass = clips[i].ok ? " done" : "";
      const flagClass = flag ? " flag" : "";
      const titleAttr = `${i + 1}. ${esc(clips[i].title || "Untitled")} (${short(r.s)}–${short(r.e)})`;

      return `<button class="seg${flagClass}${doneClass}" data-jump="${clips[i].id}" style="--c:${getColor(
        i
      )};left:${(r.s / max) * 100}%;width:${((r.e - r.s) / max) * 100}%" title="${titleAttr}">${i + 1}</button>`;
    })
    .join("");

  const playheadHtml = videoDur
    ? `<i class="ph" id="playhead" style="left:${(currentTime / max) * 100}%"></i>`
    : "";

  barEl.innerHTML = segmentsHtml + playheadHtml;

  axisEl.innerHTML = [0, 0.25, 0.5, 0.75, 1]
    .map(p => `<span style="left:${p * 100}%">${short(max * p)}</span>`)
    .join("");

  return tlMax;
}
