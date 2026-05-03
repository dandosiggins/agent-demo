# Agentic AI Demo — Full Breakdown

> A polished interactive web app that teaches audiences how agentic AI works by letting them watch it happen in real time, and compare it directly against plain generative AI.

---

## What It Is

This demo runs three distinct modes side by side so viewers can understand — not just hear about — the difference between an AI agent and a simple prompt-and-response model. No login or setup required. Works for any audience from technical to non-technical.

---

## Three Modes

| Mode | What it does | Speed |
|---|---|---|
| **Scripted Demo** | Pre-written scenarios with realistic step-by-step animations. Fully deterministic — same run every time. Great for live presentations. | Instant; adjustable 0.5×–4× |
| **Real Agent** | A live GPT-5.1 model actually reasons, plans, and calls tools. Output varies each run. | 15–30 seconds |
| **Generative AI** | GPT-5.1 answers with a single prompt — no planning, no tools. Used for comparison. | 3–8 seconds |

---

## How to Use It

1. **Home page** — choose a mode using the 3-way toggle at the top (Scripted Demo / Real Agent / Generative AI)
2. **Pick a scenario** from the four pre-built cards, or type any custom goal into the search bar at the bottom
3. **Watch the Demo page** — the agent's live thought stream appears on the left; a Reasoning Log or Execution Trace builds up on the right sidebar in real time
4. **Results page** — read the final output with a summary of every step the agent took. If you ran Generative mode, a comparison callout shows exactly what an agent would have done differently, with a one-click "Run with Real Agent →" button

---

## The 4 Built-In Scenarios

Each scenario has hand-crafted, realistic thought text and simulated tool calls:

### Plan a trip to Tokyo
**Goal:** Plan a 5-day itinerary for a first-time visit to Tokyo, Japan  
**Tools used:** web_search (×2), calculator  
**What the agent does:** Researches neighborhoods, looks up transport options (Suica vs JR Pass), calculates a 5-day mid-range budget (~¥115,000), then compiles a geographically clustered day-by-day itinerary.

### Research fusion energy
**Goal:** Summarise the latest breakthroughs in nuclear fusion and assess commercial viability  
**Tools used:** web_search (×2), memory  
**What the agent does:** Identifies NIF's 2022 ignition milestone and China's EAST plasma record, researches private-sector timelines (Commonwealth Fusion, Helion), recalls key engineering challenges, and produces a nuanced commercial assessment.

### Debug a 500 API error
**Goal:** Diagnose why the /orders endpoint is returning HTTP 500 errors in production  
**Tools used:** file_read (×2), code_interpreter  
**What the agent does:** Reads production logs to find the exact TypeError, inspects the source code to find the missing null guard, runs a SQL query confirming 23 orphaned records, then delivers an immediate code fix plus a preventative database constraint.

### Write a startup pitch
**Goal:** Write a compelling one-page pitch for an AI-powered meal planning app  
**Tools used:** web_search, calculator  
**What the agent does:** Researches the $19.2B meal planning market, finds the key emotional hook (58% of US adults stressed about what to eat daily), calculates a $56M ARR opportunity at 2% SAM penetration, then writes a complete investor pitch.

---

## The 6 Agent Phases

Every run — scripted or real — follows the same ReAct cycle. Each phase is colour-coded on screen:

| Phase | Colour | What it means |
|---|---|---|
| **Plan** | Violet | Breaking the goal into a sequence of sub-tasks |
| **Think** | Violet | Reasoning about what to do next |
| **Act** | Blue | Calling a tool to gather information or take action |
| **Observe** | Teal | Processing what the tool returned |
| **Reflect** | Violet | Evaluating progress, deciding if the goal is met |
| **Done** | Emerald | Goal achieved — composing the final answer |

---

## The 5 Simulated Tools

| Tool | What it represents |
|---|---|
| **web_search** | Looking up current facts, data, news, research |
| **calculator** | Numerical computation, budget estimates, percentages |
| **code_interpreter** | Running Python code, SQL queries, data analysis |
| **memory** | Storing and retrieving information mid-run |
| **file_read** | Reading logs, source files, structured documents |

> In **Real Agent mode**, these are real OpenAI function calls — GPT-5.1 decides which tool to call and with what arguments. The tool "execution" is handled by asking GPT-5-mini to generate realistic-looking output (web search results, code output, file contents, etc.).

---

## Technology Stack

### Frontend
| Technology | Role |
|---|---|
| React + Vite + TypeScript | UI framework and build system |
| Wouter | Client-side routing (`/`, `/demo`, `/results`) |
| Framer Motion | All animations — phase transitions, card entrances, thought streaming |
| Tailwind CSS v4 | Styling |
| shadcn/ui | UI component library (buttons, cards, inputs) |
| React Context + useReducer | All simulation state — no external state library needed |

### Backend
| Technology | Role |
|---|---|
| Express.js + TypeScript | API server |
| Server-Sent Events (SSE) | Real-time streaming from server to browser |
| `POST /api/agent/run` | Real Agent ReAct loop endpoint |
| `POST /api/generate/run` | Generative single-shot completion endpoint |
| Replit OpenAI Integration | Managed API proxy — no key management needed |

### AI Models
| Model | Used for |
|---|---|
| **gpt-5.1** | Main reasoning (Real Agent thinking + Generative completions) |
| **gpt-5-mini** | Tool output simulation — faster and cheaper for generating realistic fake search results, code output, file contents |

---

## How the Real Agent Works (ReAct Loop)

```
User submits a goal
  ↓
Loop (up to 6 iterations):
  1. Signal phase: "plan" (first) / "think" / "reflect" (after tools)
  2. Stream GPT-5.1 response live → thought text appears character by character
  3. If the model decides to call a tool:
       a. Signal phase "act" → tool call card appears
       b. Ask GPT-5-mini to simulate realistic tool output
       c. Signal phase "observe" → tool output streams in
       d. Append tool result to the conversation history
  4. If no tool call → this IS the final answer
       Send "done" event → navigate to Results page
```

### SSE Events (what the browser receives)

| Event | What it triggers |
|---|---|
| `phase` | Updates the active phase, colour theme, and header status pill |
| `thought_chunk` | Appends text to the live thought stream |
| `tool_call` | Shows the tool name and input in a call card |
| `tool_chunk` | Streams tool output into the observe area |
| `step_done` | Commits the completed step to the Reasoning Log sidebar |
| `done` | Sets final answer and navigates to Results |
| `error` | Shows an error banner with a Go Back option |

---

## What You See on the Demo Page

### Left panel — Live Thought Stream
- **Phase indicator** — the current phase name and description, updates as each phase activates
- **Thought box** — the agent's internal reasoning, streaming live in real time
  - Violet glow + Brain icon + "Internal Reasoning" header for Plan / Think / Reflect phases
  - Blue treatment for Act phases (tool call card appears below)
  - Teal treatment for Observe phases (tool output streams in below)
- **Tool call card** — shows which tool was called and the exact input sent to it
- **Tool output** — streams in below the tool card as it's "received"

### Right sidebar
| Mode | Sidebar name | Contents |
|---|---|---|
| Scripted | Execution Trace | Vertical timeline of completed steps with phase icons and thought previews |
| Real Agent | Reasoning Log | Colour-coded cards (violet / blue / teal) showing actual thought text, auto-scrolling as new steps arrive |
| Generative | What an Agent would do | Ghosted, dimmed steps showing what was intentionally skipped |

---

## State Management

A single `SimulationState` object (React `useReducer`) holds all state for the entire session:

| State field | What it tracks |
|---|---|
| `status` | idle / running / paused / done / error |
| `isRealAgent` / `isGenerative` | Which mode is active |
| `currentPhase` | Drives all colour theming and UI layout |
| `currentThought` + `visibleThoughtChars` | Typewriter animation for thought text |
| `completedSteps[]` | The steps shown in the Reasoning Log / Execution Trace |
| `liveToolCall` + `streamingToolOutput` | The currently executing tool |
| `realFinalAnswer` / `generativeFinalAnswer` | Final output for each mode |
| `elapsedMs` | The live elapsed timer shown in the header |

The reducer handles **20 distinct action types** split across three groups: Scripted, Real Agent, and Generative.

---

## Scripted Demo Engine

Runs a client-side animation loop at 50ms intervals. On each tick:
1. Advances the typewriter effect (streaming thought text at ~80 characters/second)
2. Once the thought is fully visible, streams tool output (~120 characters/second)
3. Once tool output is complete, fires `COMPLETE_STEP` and moves to the next step after a brief pause
4. The speed multiplier (0.5×, 1×, 2×, 4×) scales the tick delta — Pause and Resume are also supported

---

## Results Page

After every run, the Results page shows:
- A **"Mission Accomplished"** or **"Response Generated"** banner with the elapsed time
- The **full final answer** — supports bold, inline code, and paragraph formatting
- A **"What the agent did"** sidebar listing each completed step as a bullet point
- For Generative mode only: a **comparison callout** with:
  - A side-by-side breakdown of what happened (1 LLM call, 0 tools, 0 steps) vs what an agent would do
  - A **"Run the same goal with Real Agent →"** button to immediately rerun the same goal in agent mode

---

*Built with React, Vite, Framer Motion, Express, and OpenAI — running on Replit.*
