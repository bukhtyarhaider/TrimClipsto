/**
 * Video preview player management, timeline scrubbing, and keyboard controls.
 */

import { DEFAULT_STATUS } from "./constants.js";
import { fmt, toSec } from "./time.js";
import { showToast } from "./toast.js";

let vid = null;
let videoDur = 0;
let videoURL = null;
let playing = null;
let rafId = 0;
let tlMax = 0;

let onTimeUpdateCb = null;
let onStatusChangeCb = null;
let onRefreshCb = null;
let onSetActiveCb = null;
let getClipByIdCb = null;

export function initVideoPlayer(elements, hooks) {
  vid = elements.video;
  onTimeUpdateCb = hooks.onTimeUpdate;
  onStatusChangeCb = hooks.onStatusChange;
  onRefreshCb = hooks.onRefresh;
  onSetActiveCb = hooks.onSetActive;
  getClipByIdCb = hooks.getClipById;

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

  vid.addEventListener("play", startTick);
  vid.addEventListener("pause", () => {
    if (playing) {
      playing = null;
      setStatus(DEFAULT_STATUS);
      if (onRefreshCb) onRefreshCb();
    }
  });

  vid.addEventListener("timeupdate", updateNow);
  vid.addEventListener("seeked", updateNow);
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

  const vpanelEl = document.getElementById("vpanel");
  if (vpanelEl) vpanelEl.hidden = false;

  document.body.classList.add("has-video");

  const fixEl = document.getElementById("vfix");
  if (fixEl) fixEl.hidden = true;

  const rateSel = document.getElementById("rateSel");
  if (rateSel) vid.defaultPlaybackRate = +rateSel.value;

  setStatus("Loading video…");
  if (onRefreshCb) onRefreshCb();
}

export function removeVideo() {
  stopPreview(true);
  if (videoURL) URL.revokeObjectURL(videoURL);
  videoURL = null;
  videoDur = 0;
  if (vid) {
    vid.removeAttribute("src");
    vid.load();
  }

  const vpanelEl = document.getElementById("vpanel");
  if (vpanelEl) vpanelEl.hidden = true;

  const fixEl = document.getElementById("vfix");
  if (fixEl) fixEl.hidden = true;

  document.body.classList.remove("has-video");
  if (onRefreshCb) onRefreshCb();
}

export function updateNow() {
  if (!vid) return;
  const nowEl = document.getElementById("vnow");
  if (nowEl) nowEl.textContent = fmt(vid.currentTime || 0);

  const ph = document.getElementById("playhead");
  if (ph && tlMax) {
    ph.style.left = (vid.currentTime / tlMax * 100) + "%";
  }

  if (onTimeUpdateCb) onTimeUpdateCb(vid.currentTime || 0);
}

export function seekTo(sec) {
  if (!hasVideo() || !videoDur || sec === null || sec === undefined || !vid) return;
  playing = null;
  vid.pause();
  vid.currentTime = Math.min(Math.max(0, sec), videoDur);
  setStatus(DEFAULT_STATUS);
  if (onRefreshCb) onRefreshCb();
}

export function nudgeVideo(d) {
  if (!vid || !videoDur) return;
  vid.currentTime = Math.min(Math.max(0, vid.currentTime + d), videoDur);
}

export function stopPreview(silent = false) {
  const was = playing;
  playing = null;
  if (vid && !vid.paused) vid.pause();
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
    if (loopChk && loopChk.checked) {
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
