import { Scenario, AgentStep, Phase } from "../data/scenarios";

export type SimulationStatus = "idle" | "running" | "paused" | "done";

export interface SimulationState {
  scenario: Scenario | null;
  customGoal: string | null;
  currentStepIndex: number;
  currentPhase: Phase | null;
  currentThought: string;
  visibleThoughtChars: number;
  status: SimulationStatus;
  completedSteps: AgentStep[];
  streamingToolOutput: string;
  streamingToolOutputChars: number;
  elapsedMs: number;
}

export type SimulationAction =
  | { type: "START"; scenario: Scenario; customGoal?: string }
  | { type: "ADVANCE_STEP"; stepIndex: number }
  | { type: "STREAM_THOUGHT"; chars: number }
  | { type: "STREAM_TOOL_OUTPUT"; chars: number }
  | { type: "COMPLETE_STEP"; step: AgentStep }
  | { type: "FINISH" }
  | { type: "RESET" }
  | { type: "TICK"; ms: number };

export const initialSimulationState: SimulationState = {
  scenario: null,
  customGoal: null,
  currentStepIndex: -1,
  currentPhase: null,
  currentThought: "",
  visibleThoughtChars: 0,
  status: "idle",
  completedSteps: [],
  streamingToolOutput: "",
  streamingToolOutputChars: 0,
  elapsedMs: 0,
};

export function simulationReducer(
  state: SimulationState,
  action: SimulationAction
): SimulationState {
  switch (action.type) {
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
        visibleThoughtChars: Math.min(
          action.chars,
          state.currentThought.length
        ),
      };
    case "STREAM_TOOL_OUTPUT":
      return {
        ...state,
        streamingToolOutputChars: Math.min(
          action.chars,
          state.streamingToolOutput.length
        ),
      };
    case "COMPLETE_STEP": {
      const alreadyCompleted = state.completedSteps.some(
        (s) => s === action.step
      );
      if (alreadyCompleted) return state;
      return {
        ...state,
        completedSteps: [...state.completedSteps, action.step],
      };
    }
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

// Characters per second for thought streaming
export const THOUGHT_CHARS_PER_SEC = 80;
// Characters per second for tool output streaming
export const TOOL_OUTPUT_CHARS_PER_SEC = 120;
// Pause between steps (ms)
export const INTER_STEP_PAUSE_MS = 400;
