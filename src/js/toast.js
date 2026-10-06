/**
 * Toast notifications with optional Undo action.
 */

let toastTimer = null;
let onUndoCallback = null;

const toastEl = document.getElementById("toast");
const toastMsgEl = document.getElementById("toastMsg");
const toastUndoBtn = document.getElementById("toastUndo");

if (toastUndoBtn) {
  toastUndoBtn.addEventListener("click", () => {
    if (typeof onUndoCallback === "function") {
      onUndoCallback();
    }
    hideToast();
  });
}

/**
 * Shows a toast message at the bottom of the viewport.
 * @param {string} msg - Message to display
 * @param {boolean} [withUndo=false] - Whether to show the Undo button
 * @param {Function} [onUndo=null] - Function to invoke when Undo is clicked
 */
export function showToast(msg, withUndo = false, onUndo = null) {
  if (!toastEl || !toastMsgEl) return;
  toastMsgEl.textContent = msg;
  if (toastUndoBtn) {
    toastUndoBtn.hidden = !withUndo;
  }
  onUndoCallback = onUndo;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, withUndo ? 7000 : 2600);
}

export function hideToast() {
  if (toastEl) {
    toastEl.classList.remove("show");
  }
}
