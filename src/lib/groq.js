const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Seconds Groq wants us to wait, from the header or the error text. */
function retryDelay(res, message) {
  const header = Number(res.headers.get("retry-after"));
  if (Number.isFinite(header) && header > 0) return Math.ceil(header);

  const match = String(message).match(/try again in ([\d.]+)\s*s/i);
  return match ? Math.ceil(Number(match[1])) : 0;
}

/**
 * Send a chat completion request to Groq.
 * Returns the assistant message content as a trimmed string.
 * Per-minute rate limits clear quickly, so a 429 is retried once when the
 * wait is short enough to sit through.
 */
export async function callGroq({ messages, model, temperature, apiKey, json = false }) {
  const body = { model, messages, temperature, max_tokens: 800 };
  if (json) body.response_format = { type: "json_object" };

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      const content = data.choices?.[0]?.message?.content?.trim() || "";
      if (!content) throw new Error("The model returned an empty answer. Try again.");
      return content;
    }

    const message = data?.error?.message || "Request failed with status " + res.status;

    if (res.status === 429) {
      const seconds = retryDelay(res, message);
      if (attempt === 0 && seconds > 0 && seconds <= 10) {
        await sleep(seconds * 1000 + 250);
        continue;
      }
      throw new Error(
        seconds
          ? "Rate limited by Groq. Try again in " + seconds + "s."
          : "Rate limited by Groq. Try again in a moment.",
      );
    }

    throw new Error(message);
  }
}
