/**
 * Main application bootstrap, studio trim mode, and event bindings.
 */

import "./css/style.css";
import { fmt, toSec } from "./js/time.js";
import { cleanFileName, suggestName } from "./js/validation.js";
import {
  getState,
  setActiveId,
  getActiveId,
  getClip,
  setClips,
  fromJSON,
  toJSON,
  addClip,
  removeClip,
  duplicateClip,
  moveClip,
  updateClip,
  toggleApproval,
  resetAllApprovals,
  sortClipsByStart,
  suggestAllNames,
  clearAll,
  resumeSavedSession,
  restoreSnapshot,
  loadSavedSession,
  takeSnapshot
} from "./js/state.js";
import {
  initVideoPlayer,
  hasVideo,
  getVideoDuration,
  getCurrentTime,
  loadVideo,
  removeVideo,
  seekTo,
  nudgeVideo,
  playClip,
  togglePlayPause,
  getTlMax,
  isStudioOpen,
  enterStudioMode,
  exitStudioMode,
  toggleStudioMode,
  dismissMediaFix
} from "./js/video.js";
import { showToast } from "./js/toast.js";
import {
  renderList,
  refresh,
  flash,
  goTo,
  nextToReview,
  prevClip,
  nextClip,
  updateActiveHint
} from "./js/ui.js";

const $ = s => document.querySelector(s);
const listEl = $("#list");

/* ---------- Custom Accessible Confirm Dialog ---------- */

/**
 * Prompts the user with a custom modal dialog instead of native window.confirm.
 * @param {object} options
 * @param {string} options.title - Dialog heading
 * @param {string} options.message - Confirmation text
 * @param {string} [options.okText="Confirm"] - Text for positive action
 * @param {boolean} [options.isDanger=false] - Whether this is a destructive action
 * @returns {Promise<boolean>}
 */
export function showConfirm({
  title = "Are you sure?",
  message = "",
  okText = "Confirm",
  isDanger = false
} = {}) {
  const dlg = $("#confirmDlg");
  if (!dlg) return Promise.resolve(window.confirm(message));

  return new Promise(resolve => {
    let settled = false;

    $("#confirmTitle").textContent = title;
    $("#confirmMsg").textContent = message;

    const okBtn = $("#confirmOk");
    okBtn.textContent = okText;
    okBtn.className = isDanger ? "btn primary danger" : "btn primary";

    const finish = result => {
      if (settled) return;
      settled = true;
      cleanup();
      if (dlg.open) dlg.close();
      resolve(result);
    };

    const onOk = e => {
      e.preventDefault();
      e.stopPropagation();
      finish(true);
    };

    const onCancel = e => {
      e.preventDefault();
      e.stopPropagation();
      finish(false);
    };

    const onBackdrop = e => {
      const rect = dlg.getBoundingClientRect();
      const inDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!inDialog) finish(false);
    };

    const onClose = () => finish(false);

    function cleanup() {
      $("#confirmOk").removeEventListener("click", onOk);
      $("#confirmCancel").removeEventListener("click", onCancel);
      dlg.removeEventListener("click", onBackdrop);
      dlg.removeEventListener("close", onClose);
    }

    $("#confirmOk").addEventListener("click", onOk);
    $("#confirmCancel").addEventListener("click", onCancel);
    dlg.addEventListener("click", onBackdrop);
    dlg.addEventListener("close", onClose);

    dlg.showModal();
    $("#confirmCancel").focus();
  });
}

/* ---------- Import Helpers ---------- */

async function importText(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    return "This doesn't look like a valid clip file. Check for a missing comma, quote or bracket.";
  }

  if (!Array.isArray(data)) data = [data];
  if (
    !data.length ||
    data.some(o => typeof o !== "object" || o === null || Array.isArray(o))
  ) {
    return "Expected a list of clips, each with a title, start, end and output_name.";
  }

  const { clips } = getState();
  if (clips.some(c => c.ok)) {
    const confirmed = await showConfirm({
      title: "Replace current clips?",
      message: "Loading this file replaces all current clips and clears your approvals. Continue?",
      okText: "Replace clips",
      isDanger: true
    });
    if (!confirmed) return "";
  }

  takeSnapshot();
  setClips(fromJSON(data));
  renderList();
  showToast(`Loaded ${data.length} clip${data.length === 1 ? "" : "s"}`, true, () => {
    restoreSnapshot();
    renderList();
  });
  return null;
}

function setFromVideo(field) {
  if (!hasVideo()) {
    showToast("Load a video first to set trim marks");
    return;
  }
  const activeId = getActiveId();
  const c = getClip(activeId);
  if (!c) {
    showToast(`Click a clip first, then press ${field === "start" ? "I" : "O"}`);
    return;
  }
  if (c.ok) {
    showToast("Unapprove this clip first to edit it");
    return;
  }

  const curTime = getCurrentTime();
  c[field] = fmt(curTime);
  const inp = listEl.querySelector(`[data-id="${c.id}"] [data-f="${field}"]`);
  if (inp) inp.value = c[field];
  refresh();
  const { clips } = getState();
  showToast(`Clip ${clips.indexOf(c) + 1} ${field} set to ${c[field]}`);
}

/* ---------- Setup Event Delegation on Main List ---------- */

function setupListEvents() {
  listEl.addEventListener("input", e => {
    const inp = e.target.closest("input[data-f]");
    if (!inp) return;
    const clipEl = inp.closest(".clip");
    if (!clipEl) return;
    const c = getClip(+clipEl.dataset.id);
    if (!c) return;
    c[inp.dataset.f] = inp.value;
    c.ok = false;
    refresh();
  });

  listEl.addEventListener("change", e => {
    const inp = e.target.closest("input[data-f]");
    if (!inp) return;
    const clipEl = inp.closest(".clip");
    if (!clipEl) return;
    const c = getClip(+clipEl.dataset.id);
    if (!c) return;
    const f = inp.dataset.f;

    if (f === "start" || f === "end") {
      const s = toSec(inp.value);
      if (s !== null) {
        c[f] = fmt(s);
        inp.value = c[f];
        seekTo(s);
      }
    }
    if (f === "output_name") {
      c[f] = cleanFileName(inp.value);
      inp.value = c[f];
    }
    if (f === "title") {
      c[f] = inp.value.trim();
    }
    refresh();
  });

  listEl.addEventListener("keydown", e => {
    const inp = e.target.closest("input.time");
    if (!inp || inp.readOnly) return;
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    const s = toSec(inp.value);
    if (s === null) return;

    e.preventDefault();
    const step = (e.shiftKey ? 10 : 1) * (e.key === "ArrowUp" ? 1 : -1);
    const clipEl = inp.closest(".clip");
    const c = getClip(+clipEl.dataset.id);
    if (!c) return;

    c[inp.dataset.f] = fmt(Math.max(0, s + step));
    inp.value = c[inp.dataset.f];
    c.ok = false;
    seekTo(toSec(c[inp.dataset.f]));
    refresh();
  });

  listEl.addEventListener("click", e => {
    const go = e.target.closest("[data-go]");
    if (go) {
      const g = go.dataset.go;
      if (g === "open") $("#fileInput").click();
      if (g === "paste") $("#pasteBtn").click();
      if (g === "scratch") $("#addBtn").click();
      if (g === "resume") {
        resumeSavedSession();
        renderList();
      }
      return;
    }

    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const row = btn.closest(".clip");
    const id = +row.dataset.id;
    const c = getClip(id);
    const act = btn.dataset.act;
    const videoDur = getVideoDuration();

    if (act === "ok") {
      const result = toggleApproval(id);
      if (!result) return;
      if (!result.approved) {
        renderList();
        flash(id);
      } else {
        renderList();
        if (result.nextId !== null) {
          goTo(result.nextId);
        }
        showToast(`Clip ${result.index + 1} approved and locked`, true, () => {
          restoreSnapshot();
          renderList();
        });
      }
      return;
    }

    if (act === "play") {
      playClip(id);
      return;
    }

    if (act === "pin-start" || act === "pin-end") {
      if (c.ok) {
        showToast("Unapprove this clip first to edit it");
        return;
      }
      if (!videoDur) {
        showToast("Load a video first");
        return;
      }
      const field = act === "pin-start" ? "start" : "end";
      c[field] = fmt(getCurrentTime());
      const targetInput = row.querySelector(`[data-f="${field}"]`);
      if (targetInput) targetInput.value = c[field];
      refresh();
      return;
    }

    if (c.ok && (act === "autoname" || act === "del")) {
      showToast("Unapprove this clip first to edit it");
      return;
    }

    if (act === "autoname") {
      const { clips } = getState();
      const i = clips.indexOf(c);
      c.ok = false;
      c.output_name = suggestName(c.title, i, clips.length);
      const nameInput = row.querySelector('[data-f="output_name"]');
      if (nameInput) nameInput.value = c.output_name;
      refresh();
      return;
    }

    if (act === "up" || act === "down") {
      const dir = act === "up" ? -1 : 1;
      moveClip(id, dir);
      renderList();
      return;
    }

    if (act === "dup") {
      const newClip = duplicateClip(id);
      renderList();
      if (newClip) flash(newClip.id);
      return;
    }

    if (act === "del") {
      removeClip(id);
      renderList();
      showToast("Clip deleted", true, () => {
        restoreSnapshot();
        renderList();
      });
      return;
    }
  });

  listEl.addEventListener("pointerdown", e => {
    const r = e.target.closest(".clip");
    if (r) setActiveId(+r.dataset.id);
  });

  listEl.addEventListener("focusin", e => {
    const r = e.target.closest(".clip");
    if (r && getActiveId() !== +r.dataset.id) {
      setActiveId(+r.dataset.id);
    }

    const inp = e.target.closest("input.time");
    const videoDur = getVideoDuration();
    if (!inp || !videoDur) return;
    const s = toSec(inp.value);
    if (s !== null) seekTo(s);
  });
}

/* ---------- Setup Studio Sidebar & Inspector Events ---------- */

function setupStudioSidebarEvents() {
  // Maximize studio button
  const vStudioBtn = $("#vStudioBtn");
  if (vStudioBtn) vStudioBtn.onclick = enterStudioMode;

  const topStudioBtn = $("#topStudioBtn");
  if (topStudioBtn) topStudioBtn.onclick = enterStudioMode;

  const dropZone = $("#studioDropZone");
  if (dropZone) {
    dropZone.onclick = () => $("#videoInput").click();
    dropZone.addEventListener("dragover", e => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });
    dropZone.addEventListener("dragleave", e => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
    });
    dropZone.addEventListener("drop", e => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      const f = e.dataTransfer?.files?.[0];
      if (f && (/^video\//.test(f.type) || /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(f.name))) {
        loadVideo(f);
      }
    });
  }

  // Title edit in studio
  const sTitle = $("#studioTitleInp");
  if (sTitle) {
    sTitle.addEventListener("input", e => {
      const activeId = getActiveId();
      const c = getClip(activeId);
      if (!c) return;
      c.title = e.target.value;
      c.ok = false;
      refresh();
    });
  }

  // In / Out manual editing in studio
  const sInVal = $("#studioInVal");
  if (sInVal) {
    sInVal.addEventListener("change", e => {
      const activeId = getActiveId();
      const c = getClip(activeId);
      if (!c) return;
      const s = toSec(e.target.value);
      if (s !== null) {
        c.start = fmt(s);
        e.target.value = c.start;
        c.ok = false;
        seekTo(s);
      }
      refresh();
    });
  }

  const sOutVal = $("#studioOutVal");
  if (sOutVal) {
    sOutVal.addEventListener("change", e => {
      const activeId = getActiveId();
      const c = getClip(activeId);
      if (!c) return;
      const s = toSec(e.target.value);
      if (s !== null) {
        c.end = fmt(s);
        e.target.value = c.end;
        c.ok = false;
        seekTo(s);
      }
      refresh();
    });
  }

  // Set In / Set Out buttons
  const sSetInBtn = $("#studioSetInBtn");
  if (sSetInBtn) {
    sSetInBtn.onclick = () => setFromVideo("start");
  }

  const sSetOutBtn = $("#studioSetOutBtn");
  if (sSetOutBtn) {
    sSetOutBtn.onclick = () => setFromVideo("end");
  }

  // Seek to In / Out buttons
  const sSeekIn = $("#studioSeekInBtn");
  if (sSeekIn) {
    sSeekIn.onclick = () => {
      const c = getClip(getActiveId());
      if (c && toSec(c.start) !== null) seekTo(toSec(c.start));
    };
  }

  const sSeekOut = $("#studioSeekOutBtn");
  if (sSeekOut) {
    sSeekOut.onclick = () => {
      const c = getClip(getActiveId());
      if (c && toSec(c.end) !== null) seekTo(toSec(c.end));
    };
  }

  // Filename input & suggest in studio
  const sNameInp = $("#studioNameInp");
  if (sNameInp) {
    sNameInp.addEventListener("change", e => {
      const c = getClip(getActiveId());
      if (!c) return;
      c.output_name = cleanFileName(e.target.value);
      e.target.value = c.output_name;
      c.ok = false;
      refresh();
    });
  }

  const sSuggestBtn = $("#studioSuggestBtn");
  if (sSuggestBtn) {
    sSuggestBtn.onclick = () => {
      const { clips } = getState();
      const c = getClip(getActiveId());
      if (!c) return;
      const i = clips.indexOf(c);
      c.ok = false;
      c.output_name = suggestName(c.title, i, clips.length);
      const nameInput = $("#studioNameInp");
      if (nameInput) nameInput.value = c.output_name;
      refresh();
      showToast(`Suggested filename: ${c.output_name}`);
    };
  }

  // Approve button in studio
  const sApproveBtn = $("#studioApproveBtn");
  if (sApproveBtn) {
    sApproveBtn.onclick = () => {
      const activeId = getActiveId();
      if (!activeId) return;
      const result = toggleApproval(activeId);
      if (!result) return;
      renderList();
      if (result.approved) {
        if (result.nextId !== null) {
          goTo(result.nextId);
        } else {
          nextClip();
        }
        showToast(`Clip ${result.index + 1} approved`, true, () => {
          restoreSnapshot();
          renderList();
        });
      }
    };
  }

  // Preview active clip button in studio
  const sPrevClipBtn = $("#studioPreviewClipBtn");
  if (sPrevClipBtn) {
    sPrevClipBtn.onclick = () => {
      const activeId = getActiveId();
      if (activeId) playClip(activeId);
    };
  }

  // Add new clip at current playhead button
  const sAddHereBtn = $("#studioAddHereBtn");
  if (sAddHereBtn) {
    sAddHereBtn.onclick = () => {
      const cur = getCurrentTime();
      const newClip = addClip();
      newClip.start = fmt(cur);
      newClip.end = fmt(cur + 30);
      renderList();
      goTo(newClip.id);
      showToast(`Created new clip at ${newClip.start}`);
    };
  }

  // Duplicate button in studio
  const sDupBtn = $("#studioDupBtn");
  if (sDupBtn) {
    sDupBtn.onclick = () => {
      const activeId = getActiveId();
      if (!activeId) return;
      const newClip = duplicateClip(activeId);
      renderList();
      if (newClip) goTo(newClip.id);
    };
  }

  // Delete button in studio
  const sDelBtn = $("#studioDelBtn");
  if (sDelBtn) {
    sDelBtn.onclick = () => {
      const activeId = getActiveId();
      if (!activeId) return;
      removeClip(activeId);
      renderList();
      showToast("Clip deleted", true, () => {
        restoreSnapshot();
        renderList();
      });
    };
  }

  // Prev / Next clip navigation buttons in studio
  const prevBtn = $("#studioPrevClipBtn");
  if (prevBtn) prevBtn.onclick = prevClip;

  const nextBtn = $("#studioNextClipBtn");
  if (nextBtn) nextBtn.onclick = nextClip;

  // Clicking an item in the mini navigator list in studio
  const navList = $("#studioNavList");
  if (navList) {
    navList.addEventListener("click", e => {
      const item = e.target.closest("[data-nav-id]");
      if (item) {
        goTo(+item.dataset.navId);
      }
    });
  }
}

/* ---------- Setup Toolbar & Global UI Handlers ---------- */

function setupToolbarEvents() {
  $("#addBtn").onclick = () => {
    const newClip = addClip();
    renderList();
    flash(newClip.id);
    setTimeout(() => {
      const titleInput = listEl.querySelector(`[data-id="${newClip.id}"] [data-f="title"]`);
      if (titleInput) titleInput.focus({ preventScroll: true });
    }, 300);
  };

  $("#sortBtn").onclick = () => {
    sortClipsByStart();
    renderList();
    showToast("Sorted by start time", true, () => {
      restoreSnapshot();
      renderList();
    });
  };

  $("#renameAllBtn").onclick = () => {
    const count = suggestAllNames();
    if (!count) {
      showToast("All clips are approved. Unapprove one to rename it.");
      return;
    }
    renderList();
    showToast(`File names updated for ${count} unapproved clip${count === 1 ? "" : "s"}`, true, () => {
      restoreSnapshot();
      renderList();
    });
  };

  $("#resetApprBtn").onclick = () => {
    if (!resetAllApprovals()) return;
    renderList();
    showToast("All approvals cleared", true, () => {
      restoreSnapshot();
      renderList();
    });
  };

  $("#startOverBtn").onclick = async () => {
    const { clips } = getState();
    if (!clips.length) return;
    const confirmed = await showConfirm({
      title: "Start over?",
      message: "Clear all clips and go back to the empty screen? You can undo this right after.",
      okText: "Clear everything",
      isDanger: true
    });
    if (!confirmed) return;
    clearAll();
    renderList();
    showToast("Cleared", true, () => {
      restoreSnapshot();
      renderList();
    });
  };

  $("#nextBtn").onclick = nextToReview;

  $("#copyBtn").onclick = async () => {
    const text = $("#preview").textContent;
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied");
    } catch (_) {
      const r = document.createRange();
      r.selectNodeContents($("#preview"));
      getSelection().removeAllRanges();
      getSelection().addRange(r);
      showToast("Press Ctrl/Cmd + C to copy");
    }
  };

  $("#downloadBtn").onclick = () => {
    refresh();
    const { clips } = getState();
    if (!clips.length) return;
    const left = clips.filter(c => !c.ok).length;
    if (left) {
      showToast(`${left} clip${left === 1 ? " still needs" : "s still need"} approval before you can download`);
      nextToReview();
      return;
    }
    const blob = new Blob([JSON.stringify(toJSON(clips), null, 2) + "\n"], {
      type: "application/json"
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "clips.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    showToast("Downloaded clips.json");
  };

  // Timeline click seeking
  $("#tlBar").addEventListener("click", e => {
    const b = e.target.closest("[data-jump]");
    if (b) {
      flash(b.dataset.jump);
      const c = getClip(+b.dataset.jump);
      if (c) seekTo(toSec(c.start));
      return;
    }
    const videoDur = getVideoDuration();
    const tlMax = getTlMax();
    if (!videoDur || !tlMax) return;
    const rect = $("#tlBar").getBoundingClientRect();
    seekTo(((e.clientX - rect.left) / rect.width) * tlMax);
  });
}

/* ---------- Setup Import & Drag-Drop Events ---------- */

function setupImportEvents() {
  $("#openBtn").onclick = () => $("#fileInput").click();

  $("#fileInput").onchange = async e => {
    const f = e.target.files[0];
    if (!f) return;
    const err = await importText(await f.text());
    if (err) alert(err);
    e.target.value = "";
  };

  const dlg = $("#pasteDlg");
  $("#pasteBtn").onclick = () => {
    $("#pasteErr").textContent = "";
    $("#pasteArea").value = "";
    dlg.showModal();
    $("#pasteArea").focus();
  };

  $("#pasteCancel").onclick = () => dlg.close();

  $("#pasteLoad").onclick = async () => {
    const err = await importText($("#pasteArea").value);
    if (err) {
      $("#pasteErr").textContent = err;
    } else {
      dlg.close();
    }
  };

  let depth = 0;
  const drop = $("#drop");
  const isVideo = f => /^video\//.test(f.type) || /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(f.name);

  window.addEventListener("dragenter", e => {
    if (e.dataTransfer?.types?.includes("Files")) {
      depth++;
      drop.classList.add("on");
    }
  });

  window.addEventListener("dragleave", () => {
    depth = Math.max(0, depth - 1);
    if (!depth) drop.classList.remove("on");
  });

  window.addEventListener("dragover", e => e.preventDefault());

  window.addEventListener("drop", async e => {
    e.preventDefault();
    depth = 0;
    drop.classList.remove("on");
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (isVideo(f)) {
      loadVideo(f);
      return;
    }
    const err = await importText(await f.text());
    if (err) alert(err);
  });
}

/* ---------- Setup Video Panel Events ---------- */

function setupVideoEvents() {
  $("#loadVideoBtn").onclick = $("#vChange").onclick = () => $("#videoInput").click();

  $("#videoInput").onchange = e => {
    const f = e.target.files[0];
    if (f) loadVideo(f);
    e.target.value = "";
  };

  $("#vClose").onclick = removeVideo;

  const copyBtn = $("#vCopyCmd");
  if (copyBtn) {
    copyBtn.onclick = async () => {
      try {
        const cmd = $("#vcmd").textContent;
        await navigator.clipboard.writeText(cmd);
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="20 6 9 17 4 12"/></svg> <span>Copied!</span>`;
        showToast("Command copied to clipboard");
        setTimeout(() => {
          copyBtn.innerHTML = originalHtml;
        }, 2200);
      } catch (_) {
        showToast("Select the command and copy it with Ctrl/Cmd + C");
      }
    };
  }

  const vDismissFix = $("#vDismissFix");
  if (vDismissFix) vDismissFix.onclick = dismissMediaFix;

  const vDismissFixX = $("#vDismissFixX");
  if (vDismissFixX) vDismissFixX.onclick = dismissMediaFix;

  const vid = $("#vid");
  $("#rateSel").onchange = e => {
    if (vid) vid.defaultPlaybackRate = vid.playbackRate = +e.target.value;
    e.target.blur();
  };

  $("#loopChk").onchange = e => e.target.blur();
}

/* ---------- Keyboard Shortcuts ---------- */

function setupKeyboardShortcuts() {
  window.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
    const tag = e.target.tagName;
    const isEditingText = ["INPUT", "TEXTAREA"].includes(tag);

    // Escape closes Studio Mode even if focusing an input
    if (e.key === "Escape" && isStudioOpen()) {
      e.preventDefault();
      exitStudioMode();
      return;
    }

    if (isEditingText || e.target.closest("dialog")) {
      // Enter in studio title/inputs can approve & next if not multiline
      if (e.key === "Enter" && isStudioOpen() && tag === "INPUT") {
        e.preventDefault();
        const activeId = getActiveId();
        if (activeId) {
          const res = toggleApproval(activeId);
          renderList();
          if (res?.approved) {
            if (res.nextId !== null) goTo(res.nextId);
            else nextClip();
          }
        }
      }
      return;
    }

    if (tag === "BUTTON" && (e.key === " " || e.key === "Enter")) return;

    const k = e.key.toLowerCase();

    // Studio Mode toggle with 'm'
    if (k === "m") {
      e.preventDefault();
      if (hasVideo()) toggleStudioMode();
      return;
    }

    // Toggle fullscreen with 'f' when in studio
    if (k === "f" && isStudioOpen()) {
      e.preventDefault();
      const fsBtn = $("#studioFsBtn");
      if (fsBtn) fsBtn.click();
      return;
    }

    // Next / Prev clip
    if (k === "n") {
      e.preventDefault();
      nextToReview();
      return;
    }
    if (e.key === "PageUp") {
      e.preventDefault();
      prevClip();
      return;
    }
    if (e.key === "PageDown") {
      e.preventDefault();
      nextClip();
      return;
    }

    // Add new clip with '+'
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      const cur = getCurrentTime();
      const newClip = addClip();
      newClip.start = fmt(cur);
      newClip.end = fmt(cur + 30);
      renderList();
      goTo(newClip.id);
      showToast(`Created clip at ${newClip.start}`);
      return;
    }

    // Preview clip with 'p'
    if (k === "p") {
      e.preventDefault();
      const activeId = getActiveId();
      if (activeId) playClip(activeId);
      return;
    }

    if (!hasVideo() || !getVideoDuration()) return;

    if (e.key === " ") {
      e.preventDefault();
      togglePlayPause();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      nudgeVideo((e.shiftKey ? 5 : 1) * (e.key === "ArrowLeft" ? -1 : 1));
    } else if (e.key === "," || e.key === ".") {
      e.preventDefault();
      const vid = $("#vid");
      if (vid && !vid.paused) vid.pause();
      nudgeVideo((e.key === "," ? -1 : 1) / 30);
    } else if (k === "i") {
      e.preventDefault();
      setFromVideo("start");
    } else if (k === "o") {
      e.preventDefault();
      setFromVideo("end");
    }
  });
}

/* ---------- Application Bootstrap ---------- */

export function initApp() {
  loadSavedSession();

  initVideoPlayer(
    { video: $("#vid") },
    {
      onRefresh: refresh,
      onSetActive: setActiveId,
      getClipById: getClip,
      onStudioChange: () => refresh()
    }
  );

  setupListEvents();
  setupStudioSidebarEvents();
  setupToolbarEvents();
  setupImportEvents();
  setupVideoEvents();
  setupKeyboardShortcuts();

  renderList();
}

// Automatically bootstrap when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
