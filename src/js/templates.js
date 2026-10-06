/**
 * HTML view templates for clip cards, approved list items, and empty state.
 */

import { ICON } from "./constants.js";
import { esc, toSec, human } from "./time.js";

/**
 * Generates an editable clip row HTML.
 * @param {object} c - Clip object
 * @param {number} i - Clip index
 * @returns {string} HTML string
 */
export function rowHTML(c, i) {
  return `
  <article class="clip" data-id="${c.id}">
    <div class="num">${i + 1}</div>
    <div class="body">
      <div class="top">
        <label class="f">
          <span>Clip title</span>
          <input type="text" data-f="title" value="${esc(c.title)}" placeholder="What happens in this clip?">
        </label>
        <button class="ok-btn" data-act="ok" title="Lock this clip and move it to Approved">
          ${ICON.check}<b>Approve</b>
        </button>
      </div>
      <div class="f">
        <span>Starts at</span>
        <div class="timewrap">
          <input type="text" class="time" data-f="start" aria-label="Start time" title="Type a time like 2:18, or press ↑ / ↓ to nudge by 1 second (Shift: 10)" value="${esc(c.start)}" placeholder="00:00:00.000" inputmode="decimal" autocomplete="off">
          <button class="icon pin" data-act="pin-start" title="Use the video's current time as the start" aria-label="Use current video time as start">${ICON.pin}</button>
        </div>
      </div>
      <div class="f">
        <span>Ends at</span>
        <div class="timewrap">
          <input type="text" class="time" data-f="end" aria-label="End time" title="Type a time like 2:46, or press ↑ / ↓ to nudge by 1 second (Shift: 10)" value="${esc(c.end)}" placeholder="00:00:00.000" inputmode="decimal" autocomplete="off">
          <button class="icon pin" data-act="pin-end" title="Use the video's current time as the end" aria-label="Use current video time as end">${ICON.pin}</button>
        </div>
      </div>
      <div class="f dur"><span>Length</span><b data-dur>–</b></div>
      <div class="f file">
        <span>Saved as</span>
        <div class="filewrap">
          <input type="text" data-f="output_name" value="${esc(c.output_name)}" placeholder="clip_01_name.mp4" autocomplete="off" spellcheck="false" aria-label="File name">
          <button class="icon" data-act="autoname" title="Suggest a file name from the title" aria-label="Suggest file name">${ICON.wand}</button>
        </div>
      </div>
      <div class="foot">
        <p class="msgs" data-msgs></p>
        <div class="tools">
          <button class="icon play" data-act="play" title="Preview this clip in the video" aria-label="Preview clip">
            <span class="i-play">${ICON.play}</span>
            <span class="i-stop">${ICON.stop}</span>
          </button>
          <button class="icon" data-act="up" title="Move up" aria-label="Move up">${ICON.up}</button>
          <button class="icon" data-act="down" title="Move down" aria-label="Move down">${ICON.down}</button>
          <button class="icon" data-act="dup" title="Duplicate" aria-label="Duplicate">${ICON.copy}</button>
          <button class="icon danger" data-act="del" title="Delete" aria-label="Delete">${ICON.trash}</button>
        </div>
      </div>
    </div>
  </article>`;
}

/**
 * Generates an approved/locked clip row HTML.
 * @param {object} c - Clip object
 * @param {number} i - Clip index
 * @returns {string} HTML string
 */
export function doneRowHTML(c, i) {
  const s = toSec(c.start);
  const e = toSec(c.end);
  const len = s !== null && e !== null && e > s ? human(e - s) : "";
  return `
  <article class="clip done" data-id="${c.id}">
    <div class="num">${i + 1}</div>
    <div class="dmain">
      <div class="dtitle">
        <span class="lock" title="Locked">${ICON.lock}</span>
        <span class="t">${esc(c.title || "Untitled")}</span>
      </div>
      <div class="dmeta">
        <span class="mono">${esc(c.start)} to ${esc(c.end)}</span>
        <span>${len}</span>
        <span class="mono">${esc(c.output_name)}</span>
      </div>
    </div>
    <div class="dact">
      <button class="icon play" data-act="play" title="Preview this clip in the video" aria-label="Preview clip">
        <span class="i-play">${ICON.play}</span>
        <span class="i-stop">${ICON.stop}</span>
      </button>
      <button class="btn sm" data-act="ok" title="Unlock this clip so you can edit it">Unapprove</button>
    </div>
  </article>`;
}

/**
 * Generates empty state splash HTML.
 * @param {Array<object>|null} savedSession
 * @returns {string} HTML string
 */
export function emptyHTML(savedSession = null) {
  const n = savedSession ? savedSession.length : 0;
  const k = savedSession ? savedSession.filter(o => o && o._ok === true).length : 0;
  return `
  <div class="empty">
    <h2>Open your clip file to begin</h2>
    <p>Drop a .json file anywhere on this page, or choose one from your computer.</p>
    <div class="btns">
      <button class="btn primary" data-go="open">Open file</button>
      <button class="btn" data-go="paste">Paste JSON</button>
      <button class="btn" data-go="scratch">Start from scratch</button>
    </div>
    <ol class="steps">
      <li>Load your video (optional)</li>
      <li>Open your clip file</li>
      <li>Preview each clip, fix its times, approve it</li>
      <li>Download the updated file</li>
    </ol>
    ${
      n
        ? `<div class="resume">
             <button class="btn" data-go="resume">Continue last session (${n} clip${n === 1 ? "" : "s"}, ${k} approved)</button>
           </div>`
        : ""
    }
  </div>`;
}
