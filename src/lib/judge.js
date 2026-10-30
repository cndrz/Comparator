import { callGroq } from "./groq.js";
import { modelName } from "./models.js";

const DEFAULT_CRITERIA =
  "overall quality, accuracy, and how well the response does what the input asks";

const JUDGE_SYSTEM = `You are a strict, impartial evaluator. Compare two responses to the same input against the given criteria. Each response is labelled with the model that produced it. Use "1" for the first response below, "2" for the second, or "tie". Reply with JSON only, in this shape: {"winner": "1" | "2" | "tie", "reason": "one or two sentences that name the models"}.`;

function parseVerdict(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("The judge returned an unreadable answer.");
    return JSON.parse(match[0]);
  }
}

/**
 * Ask the judge model which output is better.
 * The outputs are randomly reordered to cancel out position bias, then the
 * verdict is mapped back to the original A/B labels. Responses are labelled
 * with their model names so the reason reads in those terms.
 */
export async function judge({
  input,
  outputA,
  outputB,
  modelA,
  modelB,
  apiKey,
  model,
  temperature = 0,
}) {
  const swap = Math.random() < 0.5;
  const first = swap ? outputB : outputA;
  const second = swap ? outputA : outputB;
  const firstModel = swap ? modelB : modelA;
  const secondModel = swap ? modelA : modelB;

  // Same model on both sides needs a tiebreaker label, or the judge cannot tell them apart.
  const sameModel = firstModel === secondModel;
  const label = (position, id) =>
    sameModel ? `Response ${position} (${modelName(id)})` : modelName(id);

  const raw = await callGroq({
    messages: [
      { role: "system", content: JUDGE_SYSTEM },
      {
        role: "user",
        content:
          "Input:\n" + input +
          "\n\nCriteria: " + DEFAULT_CRITERIA +
          "\n\n" + label(1, firstModel) + ":\n" + first +
          "\n\n" + label(2, secondModel) + ":\n" + second,
      },
    ],
    model,
    temperature,
    apiKey,
    json: true,
  });

  const parsed = parseVerdict(raw);
  const choice = String(parsed.winner).toLowerCase();
  let winner = "tie";
  if (choice === "1") winner = swap ? "B" : "A";
  else if (choice === "2") winner = swap ? "A" : "B";

  return { winner, reason: parsed.reason || "" };
}
