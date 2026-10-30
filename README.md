# Comparator

Run two prompts on the same input and let an LLM judge pick the winner.

## Getting started

```bash
npm install
npm run dev
```

Open the URL Vite prints, type a message in the composer, and press the **↑**
button (or `Enter`).

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Build a production bundle into `dist/` |
| `npm run preview` | Serve the built bundle locally |

## Using it

- Pick a model and creativity level for Prompt A and Prompt B from the boxes
  under each prompt. They can differ, so you can compare prompts, models, or
  both.
- Write the two prompts, then type the shared input into the chat composer at the
  bottom. It is sent to both prompts as the same message.
- Choose the **judge model** and its creativity at the top of the verdict column.
  Both are remembered in this browser.
- Output A appears under Prompt A, Output B under Prompt B, and the verdict in
  the third column, so all three stay side by side. Finished outputs stay out of
  the way behind a **View output** button; the dialog shows one output at a time
  with a Copy button. The verdict column has **Copy winning answer** for the
  output that won.
- The **↑** button stays disabled until both prompts and the shared input have
  text. `Enter` sends from the composer (`Shift + Enter` adds a line), and
  `Ctrl/Cmd + Enter` runs the comparison from anywhere.
- **Help** covers the rest.

## How it works

1. Prompt A and Prompt B are each sent to Groq as the `system` message, with the
   shared input as the `user` message. Both calls run in parallel.
2. A second model, the judge, receives only the input and the two outputs, each
   labelled with the model that produced it. It replies with a winner or a tie
   plus a short reason that names those models.
3. Output order is randomly swapped before judging to cancel out position bias,
   then the verdict is mapped back to A/B.

## Project layout

```
index.html              Page markup, including the Help dialog
public/
  favicon.svg           Tab icon (two bars, winner dot)
  apple-touch-icon.png  180×180 icon for iOS home screens
src/
  main.js               Draft, run state, run, verdict, copy, dialog wiring
  config.js             Groq API key constant
  lib/
    groq.js             Groq chat-completions client
    judge.js            Judge prompt, order swap, verdict parsing
    clipboard.js        Clipboard with execCommand fallback
    models.js           Available models and temperature presets
    settings.js         Judge model/creativity storage (localStorage)
    draft.js            Prompt draft storage (sessionStorage)
  ui/
    dom.js              Small DOM helpers
    options.js          Model and creativity box renderers
    results.js          Status line and output cards
  styles/
    index.css           Imports the layers below, in order
    tokens.css          Color/spacing variables, light + dark
    base.css            Reset, typography, form controls, utilities
    layout.css          Header, dialog, responsive grid, how-to steps
    components.css      Boxes, buttons, verdict, FAQ
```

Help opens in a native `<dialog>` with a blurred backdrop. It covers the tool's
scope and limits, usage, and a short FAQ. Prompts, the shared input, and the
selected models are kept in `sessionStorage`, so a refresh does not lose your
work.

## Notes

- Each prompt has its own model selector (GPT-OSS 120B, GPT-OSS 20B, or Qwen3.8
  27B) and creativity level. The judge has its own model and creativity too;
  judge creativity defaults to Precise (0).
- **Creativity** maps to the sampling temperature: Precise (0), Balanced (0.5),
  Creative (1). It applies to that prompt's run, or to the judge call.
- Groq's free tier caps each model at about 8,000 tokens per minute. A 429 is
  retried once automatically when the wait is 10 seconds or less; otherwise the
  output card shows how long to wait before running again.
- The API key is a constant in `src/config.js` and is bundled into the build
  output.
