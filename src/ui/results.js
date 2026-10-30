import { $ } from "./dom.js";

export function setStatus(message, isError = false) {
  const el = $("status");
  el.textContent = message;
  el.className = "status" + (isError ? " err" : "");
}

export function resetResults() {
  $("verdict").className = "col verdict";
  $("badgeA").innerHTML = "";
  $("badgeB").innerHTML = "";
  $("outA").classList.remove("winner");
  $("outB").classList.remove("winner");
  $("copyWin").style.display = "none";
}

function viewButton(side) {
  return document.querySelector(`[data-view="${side}"]`);
}

export function showLoading(side) {
  const card = $("out" + side);
  const body = $("body" + side);
  card.classList.add("show");
  body.hidden = false;
  body.className = "out-body";
  body.innerHTML = '<span class="spinner"></span>Generating';
  viewButton(side).hidden = true;
}

/**
 * Render a settled promise result into one of the output cards.
 * A finished output is kept hidden behind its View output button; a failure
 * stays visible so the reason is not buried behind a click.
 */
export function showResult(side, result) {
  const body = $("body" + side);
  const button = viewButton(side);

  if (result.status === "fulfilled") {
    body.className = "out-body";
    body.textContent = result.value;
    body.hidden = true;
    button.hidden = false;
  } else {
    body.className = "out-body err";
    body.textContent = result.reason.message || String(result.reason);
    body.hidden = false;
    button.hidden = true;
  }
}
