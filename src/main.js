import "./styles/index.css";

import { GROQ_API_KEY } from "./config.js";
import { callGroq } from "./lib/groq.js";
import { judge } from "./lib/judge.js";
import { copyText } from "./lib/clipboard.js";
import { loadDraft, saveDraft } from "./lib/draft.js";
import {
  DEFAULT_MODEL_A,
  DEFAULT_MODEL_B,
  DEFAULT_TEMPERATURE,
  isModelId,
  isTemperature,
  modelName,
} from "./lib/models.js";
import { loadSettings, saveSettings } from "./lib/settings.js";
import { $, selectedValue } from "./ui/dom.js";
import { renderModelBoxes, renderTemperatureBoxes } from "./ui/options.js";
import { resetResults, setStatus, showLoading, showResult } from "./ui/results.js";

const promptA = $("pa");
const promptB = $("pb");
const inputField = $("userInput");
const runButton = $("run");
const runHint = $("runHint");
let winningOutput = "";
let running = false;

/* ---------- Restore the draft for this tab ---------- */
const draft = loadDraft();
const settings = loadSettings();

const draftTemperature = (value) =>
  isTemperature(value) ? Number(value) : DEFAULT_TEMPERATURE;

renderModelBoxes($("modelA"), "modelA", isModelId(draft.modelA) ? draft.modelA : DEFAULT_MODEL_A);
renderModelBoxes($("modelB"), "modelB", isModelId(draft.modelB) ? draft.modelB : DEFAULT_MODEL_B);
renderTemperatureBoxes($("tempA"), "tempA", draftTemperature(draft.tempA));
renderTemperatureBoxes($("tempB"), "tempB", draftTemperature(draft.tempB));
renderModelBoxes($("judgeModels"), "judgeModel", settings.judgeModel);
renderTemperatureBoxes($("judgeTemps"), "judgeTemps", settings.judgeTemperature);

if (typeof draft.promptA === "string") promptA.value = draft.promptA;
if (typeof draft.promptB === "string") promptB.value = draft.promptB;
if (typeof draft.input === "string") inputField.value = draft.input;

function persistDraft() {
  saveDraft({
    promptA: promptA.value,
    promptB: promptB.value,
    input: inputField.value,
    modelA: selectedValue("modelA"),
    modelB: selectedValue("modelB"),
    tempA: Number(selectedValue("tempA")),
    tempB: Number(selectedValue("tempB")),
  });
}

/* ---------- Run readiness ---------- */
function updateRunState() {
  const missing =
    !promptA.value.trim() || !promptB.value.trim() || !inputField.value.trim();

  runButton.disabled = running || missing;
  runHint.hidden = !missing;
}

for (const field of [promptA, promptB, inputField]) {
  field.addEventListener("input", () => {
    persistDraft();
    updateRunState();
  });
}

/* ---------- Chat composer ---------- */
const COMPOSER_MAX = 192;

function autoGrow() {
  inputField.style.height = "auto";
  inputField.style.height = Math.min(inputField.scrollHeight, COMPOSER_MAX) + "px";
}

inputField.addEventListener("input", autoGrow);

// Enter sends, Shift+Enter adds a line.
inputField.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
  event.preventDefault();
  if (!runButton.disabled) runButton.click();
});

function setBusy(label) {
  runButton.classList.toggle("busy", Boolean(label));
  runButton.setAttribute("aria-label", label || "Run comparison");
  runButton.title = label || "Run comparison";
}

for (const id of ["modelA", "modelB", "tempA", "tempB"]) {
  $(id).addEventListener("change", persistDraft);
}

/* ---------- Judge settings ---------- */
for (const id of ["judgeModels", "judgeTemps"]) {
  $(id).addEventListener("change", () => {
    saveSettings({
      judgeModel: selectedValue("judgeModel"),
      judgeTemperature: Number(selectedValue("judgeTemps")),
    });
  });
}

/* ---------- Help dialog ---------- */
document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => $(button.dataset.open).showModal());
});

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.querySelector("[data-close]").addEventListener("click", () => dialog.close());

  // Clicking the backdrop (the dialog's own padding box) closes it.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});

/* ---------- Single output dialog ---------- */
const lastModels = { A: "", B: "" };

function openOutput(side) {
  const key = side.toLowerCase();
  $("outputTitle").textContent = "Output " + side;
  $("outputTitle").className = key;
  $("viewPane").className = "view-pane " + key;
  $("viewBody").textContent = $("body" + side).textContent;
  $("viewMeta").textContent = lastModels[side] ? modelName(lastModels[side]) : "";
  $("outputDialog").showModal();
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => openOutput(button.dataset.view));
});

/* ---------- Run ---------- */
function generate(prompt, input, model, temperature) {
  return callGroq({
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: input },
    ],
    model,
    temperature,
    apiKey: GROQ_API_KEY,
  });
}

function renderVerdict({ winner, reason }, judgeModel) {
  const verdict = $("verdict");

  if (winner === "tie") {
    verdict.className = "col verdict show tie";
    $("vTitle").textContent = "It’s a tie";
    winningOutput = "";
  } else {
    verdict.className = "col verdict show " + winner.toLowerCase();
    $("vTitle").textContent = "Prompt " + winner + " wins";
    $("out" + winner).classList.add("winner");
    $("badge" + winner).innerHTML = '<span class="badge">Winner</span>';
    winningOutput = $("body" + winner).textContent;
    $("copyWin").style.display = "inline-block";
  }

  $("vReason").textContent = reason;
  $("vMeta").textContent = "Judged by " + modelName(judgeModel);
}

$("run").addEventListener("click", async () => {
  const pa = promptA.value.trim();
  const pb = promptB.value.trim();
  const input = inputField.value.trim();
  const modelA = selectedValue("modelA");
  const modelB = selectedValue("modelB");
  const tempA = Number(selectedValue("tempA"));
  const tempB = Number(selectedValue("tempB"));
  const judgeModel = selectedValue("judgeModel");
  const judgeTemperature = Number(selectedValue("judgeTemps"));

  lastModels.A = modelA;
  lastModels.B = modelB;

  if (!GROQ_API_KEY) {
    setStatus("Set VITE_GROQ_API_KEY in .env first.", true);
    return;
  }
  if (!pa || !pb) {
    setStatus("Fill in both prompts.", true);
    return;
  }
  if (!input) {
    setStatus("Add a shared input.", true);
    inputField.focus();
    return;
  }

  resetResults();
  if ($("outputDialog").open) $("outputDialog").close();
  setStatus("");
  running = true;
  updateRunState();
  setBusy("Running comparison");
  showLoading("A");
  showLoading("B");

  try {
    const results = await Promise.allSettled([
      generate(pa, input, modelA, tempA),
      generate(pb, input, modelB, tempB),
    ]);

    showResult("A", results[0]);
    showResult("B", results[1]);

    if (results[0].status !== "fulfilled" || results[1].status !== "fulfilled") {
      setStatus("One of the runs failed, so there is nothing to judge.", true);
      return;
    }

    setBusy("Judging outputs");

    try {
      const verdict = await judge({
        input,
        outputA: results[0].value,
        outputB: results[1].value,
        modelA,
        modelB,
        apiKey: GROQ_API_KEY,
        model: judgeModel,
        temperature: judgeTemperature,
      });
      renderVerdict(verdict, judgeModel);
    } catch (error) {
      setStatus("Judge failed: " + error.message, true);
    }
  } finally {
    running = false;
    setBusy("");
    updateRunState();
  }
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    if (!runButton.disabled) runButton.click();
  }
});

/* ---------- Copy ---------- */
document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", () => {
    copyText($(button.getAttribute("data-copy")).textContent, button);
  });
});

$("copyWin").addEventListener("click", () => {
  if (winningOutput) copyText(winningOutput, $("copyWin"));
});

/* ---------- Init ---------- */
autoGrow();
updateRunState();
promptA.focus();
