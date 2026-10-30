import { MODELS, TEMPERATURES } from "../lib/models.js";

const checked = (isChecked) => (isChecked ? " checked" : "");

function renderBoxes(container, name, items, selected) {
  container.innerHTML = items
    .map(
      (item) => `
      <label class="option-chip">
        <input type="radio" name="${name}" value="${item.value}"${checked(item.value === selected)}>
        <span class="option-text"><strong>${item.label}</strong></span>
      </label>
    `,
    )
    .join("");
}

/** Model boxes, used under each prompt and for the judge. */
export function renderModelBoxes(container, name, selectedId) {
  renderBoxes(
    container,
    name,
    MODELS.map((model) => ({ value: model.id, label: model.name })),
    selectedId,
  );
}

/** Creativity boxes for the judge settings. */
export function renderTemperatureBoxes(container, name, selectedValue) {
  renderBoxes(
    container,
    name,
    TEMPERATURES.map((option) => ({ value: String(option.value), label: option.name })),
    String(selectedValue),
  );
}
