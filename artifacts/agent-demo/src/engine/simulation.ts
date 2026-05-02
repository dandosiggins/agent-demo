import { Scenario, AgentStep, Phase, ToolType } from "../data/scenarios";

export type SimulationStatus = "idle" | "running" | "paused" | "done" | "error";

export interface LiveToolCall {
  tool: ToolType;
  input: string;
}

export interface SimulationState {
  // Shared
  scenario: Scenario | null;
  customGoal: string | null;
  status: SimulationStatus;
  elapsedMs: number;
  completedSteps: AgentStep[];

  // Scripted demo mode
  currentStepIndex: number;
  currentPhase: Phase | null;
  currentThought: string;
  visibleThoughtChars: number;
  streamingToolOutput: string;
  streamingToolOutputChars: number;

  // Real agent mode
  isRealAgent: boolean;
  liveToolCall: LiveToolCall | null;
  realFinalAnswer: string;
  realStepSummary: string[];
  errorMessage: string | null;
}

export type SimulationAction =
  // Scripted demo
  | { type: "START"; scenario: Scenario; customGoal?: string }
  | { type: "ADVANCE_STEP"; stepIndex: number }
  | { type: "STREAM_THOUGHT"; chars: number }
  | { type: "STREAM_TOOL_OUTPUT"; chars: number }
  | { type: "COMPLETE_STEP"; step: AgentStep }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  // Real agent
  | { type: "REAL_START"; goal: string }
  | { type: "REAL_PHASE"; phase: Phase; stepIndex: number }
  | { type: "APPEND_THOUGHT"; chunk: string }
  | { type: "REAL_TOOL_START"; tool: ToolType; input: string }
  | { type: "APPEND_TOOL_OUTPUT"; chunk: string }
  | { type: "REAL_STEP_DONE" }
  | { type: "REAL_DONE"; answer: string; summary: string[] }
  | { type: "REAL_ERROR"; message: string }
  // Shared
  | { type: "FINISH" }
  | { type: "RESET" }
  | { type: "TICK"; ms: number };

const REAL_AGENT_SCENARIO: Scenario = {
  id: "real-agent",
  label: "Real AI Agent",
  goal: "",
  description: "Powered by live AI reasoning",
  steps: [],
  finalAnswer: "",
  stepSummary: [],
};

export const initialSimulationState: SimulationState = {
  scenario: null,
  customGoal: null,
  status: "idle",
  elapsedMs: 0,
  completedSteps: [],
  currentStepIndex: -1,
  currentPhase: null,
  currentThought: "",
  visibleThoughtChars: 0,
  streamingToolOutput: "",
  streamingToolOutputChars: 0,
  isRealAgent: false,
  liveToolCall: null,
  realFinalAnswer: "",
  realStepSummary: [],
  errorMessage: null,
};

export function simulationReducer(
  state: SimulationState,
  action: SimulationAction
): SimulationState {
  switch (action.type) {
    // ─── Scripted demo ─────────────────────────────────────────────────────
    case "START":
      return {
        ...initialSimulationState,
        scenario: action.scenario,
        customGoal: action.customGoal ?? null,
        status: "running",
        currentStepIndex: 0,
        currentPhase: action.scenario.steps[0]?.phase ?? null,
        currentThought: action.scenario.steps[0]?.thought ?? "",
        visibleThoughtChars: 0,
      };

    case "ADVANCE_STEP": {
      const nextStep = state.scenario?.steps[action.stepIndex];
      if (!nextStep) return state;
      return {
        ...state,
        currentStepIndex: action.stepIndex,
        currentPhase: nextStep.phase,
        currentThought: nextStep.thought,
        visibleThoughtChars: 0,
        streamingToolOutput: nextStep.toolCall?.output ?? "",
        streamingToolOutputChars: 0,
      };
    }

    case "STREAM_THOUGHT":
      return {
        ...state,
        visibleThoughtChars: Math.min(action.chars, state.currentThought.length),
      };

    case "STREAM_TOOL_OUTPUT":
      return {
        ...state,
        streamingToolOutputChars: Math.min(action.chars, state.streamingToolOutput.length),
      };

    case "COMPLETE_STEP": {
      const already = state.completedSteps.some((s) => s === action.step);
      if (already) return state;
      return { ...state, completedSteps: [...state.completedSteps, action.step] };
    }

    case "PAUSE":
      if (state.status !== "running") return state;
      return { ...state, status: "paused" };

    case "RESUME":
      if (state.status !== "paused") return state;
      return { ...state, status: "running" };

    // ─── Real agent ─────────────────────────────────────────────────────────
    case "REAL_START":
      return {
        ...initialSimulationState,
        isRealAgent: true,
        scenario: { ...REAL_AGENT_SCENARIO, goal: action.goal },
        customGoal: action.goal,
        status: "running",
      };

    case "REAL_PHASE":
      return {
        ...state,
        currentPhase: action.phase,
        currentStepIndex: action.stepIndex,
        currentThought: "",
        visibleThoughtChars: 0,
        liveToolCall: null,
        streamingToolOutput: "",
        streamingToolOutputChars: 0,
      };

    case "APPEND_THOUGHT": {
      const thought = state.currentThought + action.chunk;
      return {
        ...state,
        currentThought: thought,
        visibleThoughtChars: thought.length,
      };
    }

    case "REAL_TOOL_START":
      return {
        ...state,
        liveToolCall: { tool: action.tool, input: action.input },
        streamingToolOutput: "",
        streamingToolOutputChars: 0,
      };

    case "APPEND_TOOL_OUTPUT": {
      const output = state.streamingToolOutput + action.chunk;
      return {
        ...state,
        streamingToolOutput: output,
        streamingToolOutputChars: output.length,
      };
    }

    case "REAL_STEP_DONE": {
      if (state.currentPhase === null) return state;
      const step: AgentStep = {
        phase: state.currentPhase,
        thought: state.currentThought,
        durationMs: 0,
        toolCall: state.liveToolCall
          ? {
              tool: state.liveToolCall.tool,
              input: state.liveToolCall.input,
              output: state.streamingToolOutput,
              durationMs: 0,
            }
          : undefined,
      };
      return {
        ...state,
        completedSteps: [...state.completedSteps, step],
        liveToolCall: null,
      };
    }

    case "REAL_DONE":
      return {
        ...state,
        status: "done",
        realFinalAnswer: action.answer,
        realStepSummary: action.summary,
      };

    case "REAL_ERROR":
      return { ...state, status: "error", errorMessage: action.message };

    // ─── Shared ─────────────────────────────────────────────────────────────
    case "FINISH":
      return { ...state, status: "done" };

    case "RESET":
      return { ...initialSimulationState };

    case "TICK":
      return { ...state, elapsedMs: state.elapsedMs + action.ms };

    default:
      return state;
  }
}

// Scripted mode constants
export const THOUGHT_CHARS_PER_SEC = 80;
export const TOOL_OUTPUT_CHARS_PER_SEC = 120;
export const INTER_STEP_PAUSE_MS = 400;

export const SPEED_OPTIONS = [0.5, 1, 2, 4] as const;
export type SpeedOption = (typeof SPEED_OPTIONS)[number];
