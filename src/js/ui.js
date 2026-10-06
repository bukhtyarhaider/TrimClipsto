/**
 * UI orchestration: DOM views, row updates, summary stats, studio sidebar sync, and animations.
 */

import { getColor, ICON } from "./constants.js";
import { esc, human, toSec } from "./time.js";
import { validateClips } from "./validation.js";
import { rowHTML, doneRowHTML, emptyHTML } from "./templates.js";
import { renderTimeline } from "./timeline.js";
import {
  getState,
  setActiveId,
  getActiveId,
  toJSON
} from "./state.js";
import {
  getVideoDuration,
  getCurrentTime,
  getPlayingClip,
  setTlMax,
  seekTo,
  isStudioOpen,
  updateStudioScrubRange
} from "./video.js";
import { showToast } from "./toast.js";

const $ = s => document.querySelector(s);

export function flash(id) {
  const listEl = $("#list");
  if (!listEl) return;
  const el = listEl.querySelector(`[data-id="${id}"]`);
  if (!el) return;
  const det = el.closest("details");
  if (det) det.open = true;
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  el.classList.remove("flash");
  void el.offsetWidth;
  el.classList.add("flash");
}

export function updateActiveHint() {
  const { clips, activeId } = getState();
  const i = clips.findIndex(c => c.id === activeId);
  const activeEl = $("#vactive");
  if (!activeEl) return;
  activeEl.textContent =
    i < 0
      ? "No clip selected. Click a clip to select it."
      : `Selected clip ${i + 1}${clips[i].title ? ": " + clips[i].title : ""}`;
}

export function goTo(id) {
  setActiveId(id);
  flash(id);
  const { clips } = getState();
  const c = clips.find(x => x.id === id);
  if (!c) return;
  const s = toSec(c.start);
  const videoDur = getVideoDuration();
  if (videoDur && s !== null) {
    seekTo(s);
  }
}

export function nextToReview() {
  const { clips, activeId } = getState();
  if (!clips.length) return;
  const from = clips.findIndex(c => c.id === activeId);
  for (let k = 1; k <= clips.length; k++) {
    const i = (from + k + clips.length) % clips.length;
    if (!clips[i].ok) {
      goTo(clips[i].id);
      return;
    }
  }
  showToast("Every clip is approved");
}

export function prevClip() {
  const { clips, activeId } = getState();
  if (!clips.length) return;
  const curIdx = clips.findIndex(c => c.id === activeId);
  const prevIdx = curIdx <= 0 ? clips.length - 1 : curIdx - 1;
  goTo(clips[prevIdx].id);
}

export function nextClip() {
  const { clips, activeId } = getState();
  if (!clips.length) return;
  const curIdx = clips.findIndex(c => c.id === activeId);
  const nxtIdx = curIdx >= clips.length - 1 ? 0 : curIdx + 1;
  goTo(clips[nxtIdx].id);
}

export function renderList() {
  const { clips, savedSession } = getState();
  const empty = !clips.length;

  $("#emptyBox").hidden = !empty;
  $("#revSec").hidden = empty;
  $("#doneSec").hidden = empty;

  if (empty) {
    $("#emptyBox").innerHTML = emptyHTML(savedSession);
  } else {
    $("#revList").innerHTML = clips
      .map((c, i) => (c.ok ? "" : rowHTML(c, i)))
      .join("");

    $("#doneList").innerHTML = clips.some(c => c.ok)
      ? clips.map((c, i) => (c.ok ? doneRowHTML(c, i) : "")).join("")
      : `<p class="dnone">Approved clips are locked and move here.</p>`;
  }

  refresh();
}

/**
 * Synchronizes the right sidebar in Studio Mode with active clip state.
 */
export function syncStudioSidebar(clips, activeId, validationResults) {
  const sidebar = $("#studioSidebar");
  if (!sidebar) return;

  if (!clips.length) {
    $("#studioStats").textContent = "0 clips";
    $("#studioNavCount").textContent = "0";
    $("#studioNavList").innerHTML = `<p class="dnone" style="margin:10px 0;padding:12px">No clips yet. Click "+ New Clip" above.</p>`;
    return;
  }

  let curIdx = clips.findIndex(c => c.id === activeId);
  if (curIdx < 0) {
    curIdx = 0;
    setActiveId(clips[0].id);
  }
  const curClip = clips[curIdx];
  const curVal = validationResults[curIdx] || { issues: [], dur: null, s: null, e: null };

  const approvedCount = clips.filter(c => c.ok).length;
  $("#studioStats").textContent = `${approvedCount} of ${clips.length} approved`;
  $("#studioNavCount").textContent = String(clips.length);

  // Active clip editor fields
  $("#studioActiveBadge").textContent = `#${curIdx + 1}`;
  $("#studioActiveBadge").style.background = getColor(curIdx);

  const titleInp = $("#studioTitleInp");
  if (titleInp && document.activeElement !== titleInp) {
    titleInp.value = curClip.title || "";
  }

  const inVal = $("#studioInVal");
  if (inVal && document.activeElement !== inVal) {
    inVal.value = curClip.start || "";
  }

  const outVal = $("#studioOutVal");
  if (outVal && document.activeElement !== outVal) {
    outVal.value = curClip.end || "";
  }

  const nameInp = $("#studioNameInp");
  if (nameInp && document.activeElement !== nameInp) {
    nameInp.value = curClip.output_name || "";
  }

  // Duration pill & scrub range
  const durPill = $("#studioDurPill");
  if (durPill) {
    durPill.textContent = curVal.dur !== null ? human(curVal.dur) : "–";
    const hasErr = curVal.issues.some(x => x.f === "end" || x.f === "start");
    durPill.classList.toggle("err", hasErr);
  }

  updateStudioScrubRange(curVal.s, curVal.e);

  // Approve button status
  const approveBtn = $("#studioApproveBtn");
  const approveTxt = $("#studioApproveTxt");
  const hasErr = curVal.issues.some(x => x.l === "err");

  if (curClip.ok) {
    approveBtn.classList.add("approved");
    approveBtn.disabled = false;
    approveTxt.textContent = "Approved (Click to Unlock)";
  } else {
    approveBtn.classList.remove("approved");
    approveBtn.disabled = hasErr;
    approveTxt.textContent = hasErr ? "Fix Errors to Approve" : "Approve & Next";
  }

  // Navigation arrows disabled state
  const prevBtn = $("#studioPrevClipBtn");
  const nextBtn = $("#studioNextClipBtn");
  if (prevBtn) prevBtn.disabled = clips.length <= 1;
  if (nextBtn) nextBtn.disabled = clips.length <= 1;

  // Mini Clip Navigator List
  const navList = $("#studioNavList");
  if (navList) {
    navList.innerHTML = clips
      .map((c, i) => {
        const v = validationResults[i] || {};
        const len = v.dur !== null ? human(v.dur) : "";
        const isActive = c.id === curClip.id;
        const isApproved = c.ok;

        return `
        <div class="studio-nav-item${isActive ? " active" : ""}" data-nav-id="${c.id}" style="--c:${getColor(i)}">
          <span class="studio-nav-idx">${i + 1}</span>
          <div class="studio-nav-main">
            <span class="studio-nav-name">${esc(c.title || "Untitled")}</span>
            <span class="studio-nav-meta">${esc(c.start || "–")} → ${esc(c.end || "–")}${len ? " (" + len + ")" : ""}</span>
          </div>
          <span class="studio-nav-status">
            ${isApproved ? ICON.check : ""}
          </span>
        </div>`;
      })
      .join("");
  }
}

export function refresh() {
  const { clips, activeId } = getState();
  const videoDur = getVideoDuration();
  const playing = getPlayingClip();
  const listEl = $("#list");

  document.body.classList.toggle("is-empty", !clips.length);
  $("#resetApprBtn").disabled = !clips.some(c => c.ok);

  const v = validateClips(clips, videoDur);
  const todo = clips.map((c, i) => (c.ok ? -1 : i)).filter(i => i >= 0);

  listEl.querySelectorAll(".clip").forEach(row => {
    const i = clips.findIndex(x => x.id == row.dataset.id);
    if (i < 0) return;
    const c = clips[i];
    const r = v[i];

    row.style.setProperty("--c", getColor(i));
    row.querySelector(".num").textContent = i + 1;
    row.classList.toggle("previewing", Boolean(playing && playing.id === c.id));
    row.classList.toggle("active", activeId === c.id);

    const playBtn = row.querySelector('[data-act="play"]');
    if (playBtn) playBtn.disabled = r.dur === null;

    if (c.ok) return;

    const hasErr = r.issues.some(x => x.l === "err");
    const ob = row.querySelector('[data-act="ok"]');
    if (ob) {
      ob.disabled = hasErr;
      ob.title = hasErr
        ? "Fix the problems below before approving"
        : "Lock this clip and move it to Approved";
    }

    const durEl = row.querySelector("[data-dur]");
    if (durEl) durEl.textContent = r.dur !== null ? human(r.dur) : "–";

    row.querySelectorAll("input[data-f]").forEach(inp => {
      const hit = r.issues.filter(x => x.f === inp.dataset.f);
      inp.classList.toggle("bad", hit.some(x => x.l === "err"));
      inp.classList.toggle(
        "warn",
        !hit.some(x => x.l === "err") && hit.some(x => x.l === "warn")
      );
    });

    const msgsEl = row.querySelector("[data-msgs]");
    if (msgsEl) {
      msgsEl.innerHTML = r.issues
        .map(
          x =>
            `<span class="${x.l}">${x.l === "err" ? "Fix: " : "Heads up: "}${esc(
              x.t
            )}</span>`
        )
        .join("");
    }

    const upBtn = row.querySelector('[data-act="up"]');
    const downBtn = row.querySelector('[data-act="down"]');
    if (upBtn) upBtn.disabled = todo[0] === i;
    if (downBtn) downBtn.disabled = todo[todo.length - 1] === i;
  });

  // Summary counts
  const total = v.reduce((a, r) => a + (r.dur || 0), 0);
  const errs = v.filter(r => r.issues.some(x => x.l === "err")).length;
  const approved = clips.filter(c => c.ok).length;
  const all = clips.length > 0 && approved === clips.length;

  $("#sumMain").textContent = `${clips.length} clip${
    clips.length === 1 ? "" : "s"
  }${total ? " · " + human(total) + " in total" : ""}`;

  $("#sumSub").textContent = clips.length
    ? `${approved} of ${clips.length} approved` +
      (errs ? ` · ${errs} need${errs === 1 ? "s" : ""} fixing` : "")
    : "";

  $("#revCount").textContent = clips.length - approved;
  $("#doneCount").textContent = approved;
  $("#allGood").hidden = !all;
  $("#progFill").style.width = clips.length
    ? (approved / clips.length) * 100 + "%"
    : "0";

  // Download button
  const dl = $("#downloadBtn");
  const wasReady = dl.classList.contains("is-ready");
  dl.classList.toggle("is-off", !all);
  dl.setAttribute("aria-disabled", String(!all));
  dl.classList.toggle("is-ready", all);
  if (all && !wasReady) {
    dl.classList.remove("ready");
    void dl.offsetWidth;
    dl.classList.add("ready");
  }

  $("#nextBtn").disabled = !clips.length || all;
  updateActiveHint();

  $("#dlLabel").textContent =
    all || !clips.length ? "Download" : `Download (${approved}/${clips.length})`;
  dl.title = all
    ? "Download clips.json"
    : "Approve every clip to unlock the download. Click to jump to the next one.";

  // Timeline
  const bar = $("#tlBar");
  const axis = $("#tlAxis");
  const max = renderTimeline(bar, axis, clips, v, videoDur, getCurrentTime());
  setTlMax(max);

  // Preview JSON
  const json = JSON.stringify(toJSON(clips), null, 2);
  const prevEl = $("#preview");
  if (prevEl) prevEl.textContent = json;

  // Sync Studio Sidebar
  syncStudioSidebar(clips, activeId, v);

  return { errs };
}
