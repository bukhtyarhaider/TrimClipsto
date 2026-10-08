/**
 * Video preview player management, timeline scrubbing, and studio mode controls.
 */

import { DEFAULT_STATUS, ICON } from "./constants.js";
import { fmt, toSec } from "./time.js";
import { showToast } from "./toast.js";

let vid = null;
let videoDur = 0;
let videoURL = null;
let playing = null;
let rafId = 0;
let tlMax = 0;
let isStudio = false;

let onTimeUpdateCb = null;
let onStatusChangeCb = null;
let onRefreshCb = null;
let onSetActiveCb = null;
let getClipByIdCb = null;
let onStudioChangeCb = null;

export function initVideoPlayer(elements, hooks) {
  vid = elements.video;
  if (vid) vid.hidden = true;
  const dropZone = document.getElementById("studioDropZone");
  if (dropZone) dropZone.hidden = false;
  onTimeUpdateCb = hooks.onTimeUpdate;
  onStatusChangeCb = hooks.onStatusChange;
  onRefreshCb = hooks.onRefresh;
  onSetActiveCb = hooks.onSetActive;
  getClipByIdCb = hooks.getClipById;
  onStudioChangeCb = hooks.onStudioChange;

  vid.addEventListener("loadedmetadata", () => {
    videoDur = vid.duration || 0;
    setStatus(DEFAULT_STATUS);
    checkPicture();
    if (onRefreshCb) onRefreshCb();
    updateNow();
  });

  vid.addEventListener("loadeddata", checkPicture);

  vid.addEventListener("error", () => {
    if (!vid.getAttribute("src")) return;
    videoDur = 0;
    setStatus("Your browser can't play this file.", true);
    const fixEl = document.getElementById("vfix");
    if (fixEl) fixEl.hidden = false;
    if (onRefreshCb) onRefreshCb();
  });

  vid.addEventListener("play", () => {
    updatePlayPauseIcons(true);
    startTick();
  });

  vid.addEventListener("pause", () => {
    updatePlayPauseIcons(false);
    if (playing) {
      playing = null;
      setStatus(DEFAULT_STATUS);
      if (onRefreshCb) onRefreshCb();
    }
  });

  vid.addEventListener("timeupdate", updateNow);
  vid.addEventListener("seeked", updateNow);

  setupStudioTransportEvents();
}

function updatePlayPauseIcons(isPlaying) {
  const mainBtn = document.getElementById("studioPlayPause");
  if (mainBtn) {
    mainBtn.innerHTML = isPlaying ? ICON.pause : ICON.play;
    mainBtn.title = isPlaying ? "Pause (Space)" : "Play (Space)";
  }
}

export function isStudioOpen() {
  return isStudio;
}

export function enterStudioMode() {
  isStudio = true;
  const vpanel = document.getElementById("vpanel");
  if (vpanel) {
    vpanel.hidden = false;
    vpanel.classList.add("studio-mode");
  }
  document.body.classList.add("studio-open");

  const has = hasVideo();
  const dropZone = document.getElementById("studioDropZone");
  if (dropZone) dropZone.hidden = has;
  if (vid) vid.hidden = !has;

  const sVname = document.getElementById("studioVname");
  if (sVname && !has) sVname.textContent = "No video loaded";

  // Sync controls
  const loopChk = document.getElementById("loopChk");
  const sLoopChk = document.getElementById("studioLoopChk");
  if (loopChk && sLoopChk) sLoopChk.checked = loopChk.checked;

  const rateSel = document.getElementById("rateSel");
  const sRateSel = document.getElementById("studioRateSel");
  if (rateSel && sRateSel) sRateSel.value = rateSel.value;

  if (onStudioChangeCb) onStudioChangeCb(true);
  if (onRefreshCb) onRefreshCb();
  updateNow();
}

export function exitStudioMode() {
  isStudio = false;
  const vpanel = document.getElementById("vpanel");
  if (vpanel) vpanel.classList.remove("studio-mode");
  document.body.classList.remove("studio-open");

  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }

  // Sync back
  const loopChk = document.getElementById("loopChk");
  const sLoopChk = document.getElementById("studioLoopChk");
  if (loopChk && sLoopChk) loopChk.checked = sLoopChk.checked;

  const rateSel = document.getElementById("rateSel");
  const sRateSel = document.getElementById("studioRateSel");
  if (rateSel && sRateSel) rateSel.value = sRateSel.value;

  if (onStudioChangeCb) onStudioChangeCb(false);
  if (onRefreshCb) onRefreshCb();
}

export function toggleStudioMode() {
  if (isStudio) {
    exitStudioMode();
  } else {
    enterStudioMode();
  }
}

export function toggleFullscreen() {
  const vpanel = document.getElementById("vpanel");
  if (!document.fullscreenElement) {
    if (vpanel) {
      vpanel.requestFullscreen().catch(() => {
        // Fallback to studio mode without native fullscreen
        enterStudioMode();
      });
    }
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

function setupStudioTransportEvents() {
  const jumpBack = document.getElementById("studioJumpBack");
  if (jumpBack) jumpBack.onclick = () => nudgeVideo(-5);

  const stepBack = document.getElementById("studioStepBack");
  if (stepBack) {
    stepBack.onclick = () => {
      if (vid && !vid.paused) vid.pause();
      nudgeVideo(-1 / 30);
    };
  }

  const playPause = document.getElementById("studioPlayPause");
  if (playPause) playPause.onclick = togglePlayPause;

  const stepFwd = document.getElementById("studioStepFwd");
  if (stepFwd) {
    stepFwd.onclick = () => {
      if (vid && !vid.paused) vid.pause();
      nudgeVideo(1 / 30);
    };
  }

  const jumpFwd = document.getElementById("studioJumpFwd");
  if (jumpFwd) jumpFwd.onclick = () => nudgeVideo(5);

  const scrubBar = document.getElementById("studioScrubBar");
  if (scrubBar) {
    scrubBar.addEventListener("click", e => {
      if (!videoDur) return;
      const rect = scrubBar.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seekTo(p * videoDur);
    });
  }

  const sRateSel = document.getElementById("studioRateSel");
  if (sRateSel) {
    sRateSel.onchange = e => {
      if (vid) vid.defaultPlaybackRate = vid.playbackRate = +e.target.value;
      const rateSel = document.getElementById("rateSel");
      if (rateSel) rateSel.value = e.target.value;
      e.target.blur();
    };
  }

  const sLoopChk = document.getElementById("studioLoopChk");
  if (sLoopChk) {
    sLoopChk.onchange = e => {
      const loopChk = document.getElementById("loopChk");
      if (loopChk) loopChk.checked = e.target.checked;
      e.target.blur();
    };
  }

  const fsBtn = document.getElementById("studioFsBtn");
  if (fsBtn) fsBtn.onclick = toggleFullscreen;

  const exitBtn = document.getElementById("studioExitBtn");
  if (exitBtn) exitBtn.onclick = exitStudioMode;
}

export function hasVideo() {
  return document.body.classList.contains("has-video");
}

export function getVideoDuration() {
  return videoDur;
}

export function getCurrentTime() {
  return vid ? vid.currentTime : 0;
}

export function getPlayingClip() {
  return playing;
}

export function setTlMax(max) {
  tlMax = max;
}

export function getTlMax() {
  return tlMax;
}

export function setStatus(text, isBad = false) {
  const el = document.getElementById("vstatus");
  if (el) {
    el.textContent = text;
    el.classList.toggle("err", Boolean(isBad));
  }
  if (onStatusChangeCb) onStatusChangeCb(text, isBad);
}

export function checkPicture() {
  if (!videoDur || !vid) return;
  const noPicture = !vid.videoWidth;
  const fixEl = document.getElementById("vfix");
  if (fixEl) fixEl.hidden = !noPicture;
  if (noPicture) {
    setStatus("Only the sound can play. This browser can't decode the picture of this video.", true);
  }
}

export function loadVideo(file) {
  if (videoURL) URL.revokeObjectURL(videoURL);
  videoURL = URL.createObjectURL(file);
  playing = null;
  videoDur = 0;
  vid.src = videoURL;

  const vnameEl = document.getElementById("vname");
  if (vnameEl) vnameEl.textContent = file.name;

  const sVname = document.getElementById("studioVname");
  if (sVname) sVname.textContent = file.name;

  const vpanelEl = document.getElementById("vpanel");
  if (vpanelEl) vpanelEl.hidden = false;

  document.body.classList.add("has-video");

  const fixEl = document.getElementById("vfix");
  if (fixEl) fixEl.hidden = true;

  const dropZone = document.getElementById("studioDropZone");
  if (dropZone) dropZone.hidden = true;
  if (vid) vid.hidden = false;

  const rateSel = document.getElementById("rateSel");
  if (rateSel) vid.defaultPlaybackRate = +rateSel.value;

  setStatus("Loading video…");
  if (onRefreshCb) onRefreshCb();
}

export function removeVideo() {
  stopPreview(true);
  if (isStudio) exitStudioMode();

  if (videoURL) URL.revokeObjectURL(videoURL);
  videoURL = null;
  videoDur = 0;
  if (vid) {
    vid.removeAttribute("src");
    vid.load();
    vid.hidden = true;
  }

  const vpanelEl = document.getElementById("vpanel");
  if (vpanelEl) vpanelEl.hidden = true;

  const fixEl = document.getElementById("vfix");
  if (fixEl) fixEl.hidden = true;

  const dropZone = document.getElementById("studioDropZone");
  if (dropZone) dropZone.hidden = false;

  const sVname = document.getElementById("studioVname");
  if (sVname) sVname.textContent = "No video loaded";

  const vnameEl = document.getElementById("vname");
  if (vnameEl) vnameEl.textContent = "";

  document.body.classList.remove("has-video");
  if (onRefreshCb) onRefreshCb();
}

export function updateNow() {
  if (!vid) return;
  const cur = vid.currentTime || 0;
  const timeStr = fmt(cur);

  const nowEl = document.getElementById("vnow");
  if (nowEl) nowEl.textContent = timeStr;

  const sNowEl = document.getElementById("studioTimeNow");
  if (sNowEl) sNowEl.textContent = timeStr;

  const ph = document.getElementById("playhead");
  if (ph && tlMax) {
    ph.style.left = (cur / tlMax * 100) + "%";
  }

  const sHead = document.getElementById("studioScrubHead");
  if (sHead && videoDur) {
    sHead.style.left = (cur / videoDur * 100) + "%";
  }

  if (onTimeUpdateCb) onTimeUpdateCb(cur);
}

export function updateStudioScrubRange(startSec, endSec) {
  const sRange = document.getElementById("studioScrubRange");
  if (!sRange || !videoDur) return;
  if (startSec !== null && endSec !== null && endSec > startSec) {
    const left = Math.max(0, Math.min(100, (startSec / videoDur) * 100));
    const width = Math.max(0, Math.min(100 - left, ((endSec - startSec) / videoDur) * 100));
    sRange.style.left = left + "%";
    sRange.style.width = width + "%";
    sRange.hidden = false;
  } else {
    sRange.hidden = true;
  }
}

export function seekTo(sec) {
  if (!hasVideo() || !videoDur || sec === null || sec === undefined || !vid) return;
  playing = null;
  vid.pause();
  vid.currentTime = Math.min(Math.max(0, sec), videoDur);
  setStatus(DEFAULT_STATUS);
  updateNow();
  if (onRefreshCb) onRefreshCb();
}

export function nudgeVideo(d) {
  if (!vid || !videoDur) return;
  vid.currentTime = Math.min(Math.max(0, vid.currentTime + d), videoDur);
  updateNow();
}

export function stopPreview(silent = false) {
  const was = playing;
  playing = null;
  if (vid && !vid.paused) vid.pause();
  updatePlayPauseIcons(false);
  if (!silent) {
    setStatus(DEFAULT_STATUS);
    if (was && onRefreshCb) onRefreshCb();
  }
}

export function playClip(id) {
  if (!videoDur) {
    showToast("Load a video first, then preview clips");
    return;
  }
  if (playing && playing.id === id) {
    stopPreview();
    return;
  }
  const clip = getClipByIdCb ? getClipByIdCb(id) : null;
  if (!clip) return;

  const s = toSec(clip.start);
  const e = toSec(clip.end);
  if (s === null || e === null || e <= s) {
    showToast("Fix this clip's times first");
    return;
  }

  if (onSetActiveCb) onSetActiveCb(id);

  playing = { id, s, e };
  vid.currentTime = Math.min(s, videoDur);
  vid.play().catch(() => {
    playing = null;
    if (onRefreshCb) onRefreshCb();
  });

  setStatus(`Previewing clip: ${clip.title || "Untitled"}`);
  updatePlayPauseIcons(true);
  if (onRefreshCb) onRefreshCb();
  startTick();
}

function startTick() {
  if (!rafId) rafId = requestAnimationFrame(tick);
}

function tick() {
  rafId = 0;
  updateNow();
  if (playing && vid && !vid.paused && !vid.seeking && vid.currentTime >= playing.e) {
    const loopChk = document.getElementById("loopChk");
    const sLoopChk = document.getElementById("studioLoopChk");
    const isLooping = (loopChk && loopChk.checked) || (sLoopChk && sLoopChk.checked);

    if (isLooping) {
      vid.currentTime = playing.s;
    } else {
      const e = playing.e;
      stopPreview();
      vid.currentTime = Math.min(e, videoDur);
    }
  }
  if (vid && !vid.paused) {
    startTick();
  }
}

export function togglePlayPause() {
  if (!vid || !videoDur) return;
  if (vid.paused) {
    vid.play().catch(() => {});
  } else {
    vid.pause();
  }
}
