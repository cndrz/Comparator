export const MODELS = [
  { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B" },
  { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B" },
  { id: "qwen/qwen3.8-27b", name: "Qwen3.8 27B" },
];

export const TEMPERATURES = [
  { value: 0, name: "Precise" },
  { value: 0.5, name: "Balanced" },
  { value: 1, name: "Creative" },
];

export const DEFAULT_MODEL_A = "openai/gpt-oss-120b";
export const DEFAULT_MODEL_B = "openai/gpt-oss-20b";
export const DEFAULT_JUDGE_MODEL = "openai/gpt-oss-120b";
export const DEFAULT_TEMPERATURE = 0.5;
export const DEFAULT_JUDGE_TEMPERATURE = 0;

export const isModelId = (id) => MODELS.some((model) => model.id === id);

export const isTemperature = (value) =>
  TEMPERATURES.some((option) => option.value === Number(value));

export const modelName = (id) =>
  MODELS.find((model) => model.id === id)?.name ?? id;
