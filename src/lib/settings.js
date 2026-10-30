import {
  DEFAULT_JUDGE_MODEL,
  DEFAULT_JUDGE_TEMPERATURE,
  isModelId,
  isTemperature,
} from "./models.js";

const SETTINGS_KEY = "comparator:settings";

const fallback = () => ({
  judgeModel: DEFAULT_JUDGE_MODEL,
  judgeTemperature: DEFAULT_JUDGE_TEMPERATURE,
});

export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (!saved) return fallback();

    return {
      judgeModel: isModelId(saved.judgeModel) ? saved.judgeModel : DEFAULT_JUDGE_MODEL,
      judgeTemperature: isTemperature(saved.judgeTemperature)
        ? Number(saved.judgeTemperature)
        : DEFAULT_JUDGE_TEMPERATURE,
    };
  } catch {
    return fallback();
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable */
  }
}
