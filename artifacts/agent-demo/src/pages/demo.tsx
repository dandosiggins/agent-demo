import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useSimulation } from "@/context/simulation";
import { PHASE_LABELS, PHASE_DESCRIPTIONS, ToolType, Phase } from "@/data/scenarios";
import {
  THOUGHT_CHARS_PER_SEC,
  TOOL_OUTPUT_CHARS_PER_SEC,
  INTER_STEP_PAUSE_MS,
  SPEED_OPTIONS,
  SpeedOption,
} from "@/engine/simulation";
import {
  Loader2,
  Globe,
  Database,
  Terminal,
  Calculator,
  FileText,
  CheckCircle,
  RotateCcw,
  Activity,
  ListTodo,
  Pause,
  Play,
  Bot,
  AlertCircle,
  MessageSquare,
  XCircle,
  Brain,
  Eye,
  Zap,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const toolConfig: Record<ToolType, { icon: React.ElementType; color: string; bg: string }> = {
  web_search:       { icon: Globe,      color: "text-blue-400",   bg: "bg-blue-400/10"   },
  memory:           { icon: Database,   color: "text-violet-400", bg: "bg-violet-400/10" },
  code_interpreter: { icon: Terminal,   color: "text-green-400",  bg: "bg-green-400/10"  },
  calculator:       { icon: Calculator, color: "text-amber-400",  bg: "bg-amber-400/10"  },
  file_read:        { icon: FileText,   color: "text-teal-400",   bg: "bg-teal-400/10"   },
};

const VALID_TOOLS = new Set<ToolType>(["web_search", "memory", "code_interpreter", "calculator", "file_read"]);
function toToolType(raw: string): ToolType {
  return VALID_TOOLS.has(raw as ToolType) ? (raw as ToolType) : "web_search";
}

// Phase categorisation for visual treatment
const REASONING_PHASES = new Set<Phase>(["plan", "think", "reflect"]);
const ACTION_PHASES    = new Set<Phase>(["act"]);
const OBSERVE_PHASES   = new Set<Phase>(["observe"]);

function phaseStyle(phase: Phase | null) {
  if (!phase) return { border: "border-primary/30", glow: "from-primary/5", pulse: "border-primary/50 animate-pulse", labelBg: "bg-primary/20 text-primary border-primary/30", icon: Brain, iconColor: "text-primary" };
  if (REASONING_PHASES.has(phase)) return { border: "border-violet-500/40", glow: "from-violet-500/8", pulse: "border-violet-500/60 animate-pulse", labelBg: "bg-violet-500/20 text-violet-300 border-violet-500/30", icon: Brain, iconColor: "text-violet-400" };
  if (ACTION_PHASES.has(phase))    return { border: "border-blue-500/40",   glow: "from-blue-500/8",   pulse: "border-blue-500/60 animate-pulse",   labelBg: "bg-blue-500/20 text-blue-300 border-blue-500/30",   icon: Zap,   iconColor: "text-blue-400"   };
  if (OBSERVE_PHASES.has(phase))   return { border: "border-teal-500/40",   glow: "from-teal-500/8",   pulse: "border-teal-500/60 animate-pulse",   labelBg: "bg-teal-500/20 text-teal-300 border-teal-500/30",   icon: Eye,   iconColor: "text-teal-400"   };
  return { border: "border-emerald-500/40", glow: "from-emerald-500/8", pulse: "border-emerald-500/60 animate-pulse", labelBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: Sparkles, iconColor: "text-emerald-400" };
}

function phaseTimelineDot(phase: Phase, isCurrent: boolean, isCompleted: boolean) {
  if (REASONING_PHASES.has(phase)) return isCurrent ? "border-violet-400 bg-violet-400/10 text-violet-400" : isCompleted ? "border-violet-500 text-violet-400" : "border-muted text-muted-foreground";
  if (ACTION_PHASES.has(phase))    return isCurrent ? "border-blue-400 bg-blue-400/10 text-blue-400"       : isCompleted ? "border-blue-500 text-blue-400"     : "border-muted text-muted-foreground";
  if (OBSERVE_PHASES.has(phase))   return isCurrent ? "border-teal-400 bg-teal-400/10 text-teal-400"       : isCompleted ? "border-teal-500 text-teal-400"     : "border-muted text-muted-foreground";
  return isCurrent ? "border-emerald-400 bg-emerald-400/10 text-emerald-400" : isCompleted ? "border-primary text-primary" : "border-muted text-muted-foreground";
}

function phaseLabel(phase: Phase): string {
  if (REASONING_PHASES.has(phase)) return "Reasoning";
  if (ACTION_PHASES.has(phase))    return "Tool Call";
  if (OBSERVE_PHASES.has(phase))   return "Observing";
  return PHASE_LABELS[phase];
}

function PhaseIcon({ phase, className }: { phase: Phase; className?: string }) {
  const style = phaseStyle(phase);
  const Icon = style.icon;
  return <Icon className={className ?? `w-4 h-4 ${style.iconColor}`} />;
}

export default function Demo() {
  const [, setLocation] = useLocation();
  const { state, dispatch } = useSimulation();
  const [speed, setSpeed] = useState<SpeedOption>(1);
  const speedRef = useRef<SpeedOption>(1);
  const abortRef = useRef<AbortController | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { speedRef.current = speed; }, [speed]);

  // Auto-scroll reasoning log
  useEffect(() => {
    if (state.isRealAgent) logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.completedSteps.length, state.isRealAgent]);

  // Redirect if no active simulation
  useEffect(() => {
    if (!state.scenario || state.status === "idle") setLocation("/");
  }, [state.scenario, state.status, setLocation]);

  // ─── Generative SSE loop ─────────────────────────────────────────────────
  useEffect(() => {
    if (!state.isGenerative || state.status !== "running" || !state.customGoal) return;
    const controller = new AbortController();
    abortRef.current = controller;
    let buffer = "";
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/generate/run`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal: state.customGoal }), signal: controller.signal,
        });
        if (!response.ok) { dispatch({ type: "GENERATIVE_ERROR", message: `Server error ${response.status}` }); return; }
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            let event: Record<string, unknown>;
            try { event = JSON.parse(line.slice(6)); } catch { continue; }
            switch (event.type) {
              case "chunk": dispatch({ type: "APPEND_THOUGHT", chunk: event.content as string }); dispatch({ type: "TICK", ms: 50 }); break;
              case "done":  dispatch({ type: "GENERATIVE_DONE", answer: event.answer as string }); setLocation("/results"); break;
              case "error": dispatch({ type: "GENERATIVE_ERROR", message: event.message as string }); break;
            }
          }
        }
      } catch (err) { if ((err as Error).name !== "AbortError") dispatch({ type: "GENERATIVE_ERROR", message: String(err) }); }
    })();
    return () => controller.abort();
  }, [state.isGenerative, state.customGoal]);

  // ─── Real agent SSE loop ─────────────────────────────────────────────────
  useEffect(() => {
    if (!state.isRealAgent || state.status !== "running" || !state.customGoal) return;
    const controller = new AbortController();
    abortRef.current = controller;
    let buffer = "";
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/agent/run`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal: state.customGoal }), signal: controller.signal,
        });
        if (!response.ok) { dispatch({ type: "REAL_ERROR", message: `Server error ${response.status}` }); return; }
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            let event: Record<string, unknown>;
            try { event = JSON.parse(line.slice(6)); } catch { continue; }
            switch (event.type) {
              case "phase":       dispatch({ type: "REAL_PHASE", phase: event.phase as Phase, stepIndex: event.stepIndex as number }); break;
              case "thought_chunk": dispatch({ type: "APPEND_THOUGHT", chunk: event.content as string }); dispatch({ type: "TICK", ms: 50 }); break;
              case "tool_call":   dispatch({ type: "REAL_TOOL_START", tool: toToolType(event.tool as string), input: event.input as string }); break;
              case "tool_chunk":  dispatch({ type: "APPEND_TOOL_OUTPUT", chunk: event.content as string }); break;
              case "step_done":   dispatch({ type: "REAL_STEP_DONE" }); break;
              case "done":        dispatch({ type: "REAL_DONE", answer: event.answer as string, summary: (event.summary as string[]) ?? [] }); setLocation("/results"); break;
              case "error":       dispatch({ type: "REAL_ERROR", message: event.message as string }); break;
            }
          }
        }
      } catch (err) { if ((err as Error).name !== "AbortError") dispatch({ type: "REAL_ERROR", message: String(err) }); }
    })();
    return () => controller.abort();
  }, [state.isRealAgent, state.customGoal]);

  // ─── Scripted tick loop ──────────────────────────────────────────────────
  useEffect(() => {
    if (state.status !== "running" || !state.scenario || state.isRealAgent || state.isGenerative) return;
    let intervalId: number;
    let lastTick = performance.now();
    const tick = () => {
      const now = performance.now();
      const rawDt = now - lastTick; lastTick = now;
      const scaledDt = rawDt * speedRef.current;
      dispatch({ type: "TICK", ms: scaledDt });
      const currentStep = state.scenario?.steps[state.currentStepIndex];
      if (!currentStep) {
        if (state.currentStepIndex >= (state.scenario?.steps.length ?? 0)) { dispatch({ type: "FINISH" }); setLocation("/results"); }
        return;
      }
      const thoughtLength = state.currentThought.length;
      if (state.visibleThoughtChars < thoughtLength) {
        const thoughtDurationMs = currentStep.durationMs > 0 ? currentStep.durationMs : (thoughtLength / THOUGHT_CHARS_PER_SEC) * 1000;
        const dynamicCps = thoughtLength / (thoughtDurationMs / 1000);
        const charsToAdd = Math.max(1, Math.floor((dynamicCps * scaledDt) / 1000));
        dispatch({ type: "STREAM_THOUGHT", chars: state.visibleThoughtChars + charsToAdd });
      } else if (currentStep.toolCall && state.streamingToolOutputChars < currentStep.toolCall.output.length) {
        const toolOutput = currentStep.toolCall.output;
        const toolDurationMs = currentStep.toolCall.durationMs > 0 ? currentStep.toolCall.durationMs : (toolOutput.length / TOOL_OUTPUT_CHARS_PER_SEC) * 1000;
        const dynamicCps = toolOutput.length / (toolDurationMs / 1000);
        const charsToAdd = Math.max(1, Math.floor((dynamicCps * scaledDt) / 1000));
        dispatch({ type: "STREAM_TOOL_OUTPUT", chars: state.streamingToolOutputChars + charsToAdd });
      } else {
        clearInterval(intervalId);
        dispatch({ type: "COMPLETE_STEP", step: currentStep });
        const isLastStep = state.currentStepIndex >= (state.scenario?.steps.length ?? 0) - 1;
        const pauseMs = INTER_STEP_PAUSE_MS / speedRef.current;
        if (isLastStep) { setTimeout(() => { dispatch({ type: "FINISH" }); setLocation("/results"); }, pauseMs); }
        else { setTimeout(() => { dispatch({ type: "ADVANCE_STEP", stepIndex: state.currentStepIndex + 1 }); }, pauseMs); }
      }
    };
    intervalId = window.setInterval(tick, 50);
    return () => clearInterval(intervalId);
  }, [state.status, state.scenario, state.isRealAgent, state.isGenerative, state.currentStepIndex, state.visibleThoughtChars, state.streamingToolOutputChars, state.currentThought, dispatch, setLocation]);

  if (!state.scenario) return null;

  const scriptedStep = (state.isRealAgent || state.isGenerative) ? null : state.scenario.steps[state.currentStepIndex];
  const activeToolCall = state.isRealAgent
    ? state.liveToolCall ? { ...state.liveToolCall, output: state.streamingToolOutput } : null
    : scriptedStep?.toolCall ?? null;

  const formatTime = (ms: number) => (ms / 1000).toFixed(1) + "s";
  const isPaused  = state.status === "paused";
  const isRunning = state.status === "running";
  const isError   = state.status === "error";
  const isScripted = !state.isRealAgent && !state.isGenerative;

  const ps = phaseStyle(state.currentPhase);
  const isReasoningPhase = state.currentPhase ? REASONING_PHASES.has(state.currentPhase) : false;

  // ─── Generative simplified view ──────────────────────────────────────────
  if (state.isGenerative) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex items-center gap-2 font-mono text-sm border px-3 py-1 rounded-md shrink-0 ${isError ? "text-red-400 border-red-400/30 bg-red-400/5" : "text-amber-400 border-amber-400/30 bg-amber-400/5"}`}>
              {isError ? <AlertCircle className="w-4 h-4" /> : <MessageSquare className="w-4 h-4 animate-pulse" />}
              <span className="hidden sm:inline">{isError ? "Error" : "Generating"}</span>
            </div>
            <h1 className="font-medium truncate hidden md:block text-sm">{state.customGoal}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="font-mono text-sm text-muted-foreground tabular-nums" data-testid="text-timer">{formatTime(state.elapsedMs)}</div>
            <Button variant="ghost" size="sm" onClick={() => { abortRef.current?.abort(); dispatch({ type: "RESET" }); setLocation("/"); }} className="px-3 text-muted-foreground">← Home</Button>
          </div>
        </header>
        {isError && (
          <div className="bg-red-950/50 border-b border-red-500/30 px-6 py-3 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />{state.errorMessage ?? "An error occurred"}
            <Button size="sm" variant="outline" className="ml-auto text-red-400 border-red-400/30" onClick={() => { dispatch({ type: "RESET" }); setLocation("/"); }}>Go back</Button>
          </div>
        )}
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 p-6 lg:p-12 overflow-y-auto flex flex-col">
            <div className="max-w-3xl mx-auto w-full flex-1">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="inline-flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Mode</span>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-md bg-amber-500/20 text-amber-400 font-mono font-bold border border-amber-500/30 flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" />Generating
                    </div>
                    <span className="text-muted-foreground text-sm">Single prompt → direct response, no planning or tools</span>
                  </div>
                </div>
              </motion.div>
              <motion.div layout className="relative p-6 rounded-xl border border-amber-500/30 bg-card shadow-[0_0_30px_-10px_rgba(245,158,11,0.15)] mb-6">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none rounded-xl" />
                <div className="absolute -inset-[1px] rounded-xl border border-amber-500/40 pointer-events-none animate-pulse" />
                <div className="font-mono text-lg md:text-xl leading-relaxed whitespace-pre-wrap text-foreground/90">
                  {state.currentThought.substring(0, state.visibleThoughtChars)}
                  {state.currentThought.length > 0 && <span className="inline-block w-2 h-5 ml-1 bg-amber-400 animate-pulse align-middle" />}
                  {state.currentThought.length === 0 && isRunning && <span className="text-muted-foreground animate-pulse">Generating response…</span>}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="rounded-xl border border-dashed border-border bg-muted/10 p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-sm mb-1 text-muted-foreground">No planning steps</div>
                  <div className="text-xs text-muted-foreground/70 leading-relaxed">Generative AI jumps straight to an answer. No planning, no tool calls, no reflection. Switch to <span className="text-primary font-medium">Real Agent</span> mode to see the difference.</div>
                </div>
              </motion.div>
            </div>
          </main>
          <aside className="w-72 border-l border-border bg-card/50 overflow-y-auto hidden lg:block shrink-0">
            <div className="p-6 sticky top-0 bg-card/95 backdrop-blur z-10 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2 text-sm"><Bot className="w-4 h-4 text-primary" />What an Agent would do</h3>
            </div>
            <div className="p-6 space-y-4 relative">
              <div className="absolute left-[39px] top-6 bottom-6 w-px bg-border/50" />
              {[{ phase: "Plan", desc: "Break goal into sub-tasks" }, { phase: "Think", desc: "Reason about what's needed" }, { phase: "Act", desc: "Call tools for real data" }, { phase: "Observe", desc: "Process tool results" }, { phase: "Reflect", desc: "Decide what to do next" }, { phase: "Done", desc: "Synthesise final answer" }].map((s, i) => (
                <motion.div key={s.phase} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 0.4, x: 0 }} transition={{ delay: i * 0.1 }} className="relative flex gap-4 z-10">
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-primary/30 text-primary/30 flex items-center justify-center shrink-0 bg-card"><span className="text-xs font-mono">{i + 1}</span></div>
                  <div className="flex-1 min-w-0 pt-1"><div className="text-xs font-mono uppercase tracking-wider font-semibold mb-0.5 text-primary/40">{s.phase}</div><div className="text-xs text-muted-foreground/50">{s.desc}</div></div>
                </motion.div>
              ))}
              <p className="text-xs text-muted-foreground/50 mt-4 text-center italic">skipped in generative mode</p>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // ─── Agentic view (scripted + real agent) ────────────────────────────────
  const timelineSteps = state.isRealAgent ? state.completedSteps : state.scenario.steps;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
      {/* Debug: expose simulation mode for testing */}
      <span
        data-testid="debug-sim-mode"
        data-is-real-agent={String(state.isRealAgent)}
        data-is-generative={String(state.isGenerative)}
        className="hidden"
      />

      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex items-center gap-2 font-mono text-sm border px-3 py-1 rounded-md transition-colors shrink-0 ${
            isError    ? "text-red-400 border-red-400/30 bg-red-400/5"
            : isPaused ? "text-amber-400 border-amber-400/30 bg-amber-400/5"
            : state.isRealAgent && isReasoningPhase ? "text-violet-400 border-violet-400/30 bg-violet-400/5"
            : state.isRealAgent ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/5"
            : "text-primary border-primary/20 bg-primary/5"
          }`}>
            {isError ? <AlertCircle className="w-4 h-4" />
              : state.isRealAgent && isReasoningPhase ? <Brain className="w-4 h-4 animate-pulse" />
              : state.isRealAgent ? <Bot className="w-4 h-4 animate-pulse" />
              : isPaused ? <Pause className="w-4 h-4" />
              : <Activity className="w-4 h-4 animate-pulse" />}
            <span className="hidden sm:inline">
              {isError ? "Error"
                : state.isRealAgent && isReasoningPhase ? "Reasoning"
                : state.isRealAgent ? "Agent Running"
                : isPaused ? "Paused" : "Agent Running"}
            </span>
          </div>
          <h1 className="font-medium truncate hidden md:block text-sm">{state.customGoal ?? state.scenario.goal}</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="font-mono text-sm text-muted-foreground tabular-nums" data-testid="text-timer">{formatTime(state.elapsedMs)}</div>
          {isScripted && (
            <div className="flex items-center gap-0.5 bg-muted/40 border border-border rounded-md p-0.5" data-testid="speed-controls">
              {SPEED_OPTIONS.map((s) => (
                <button key={s} onClick={() => setSpeed(s)} data-testid={`button-speed-${s}`}
                  className={`px-2 py-1 rounded text-xs font-mono font-semibold transition-colors ${speed === s ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {s}×
                </button>
              ))}
            </div>
          )}
          {isScripted && (isRunning || isPaused) && (
            <Button variant="outline" size="sm" onClick={() => dispatch({ type: isPaused ? "RESUME" : "PAUSE" })} data-testid="button-pause-resume" className="gap-1.5 px-3">
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? "Resume" : "Pause"}
            </Button>
          )}
          {isScripted && (
            <Button variant="outline" size="sm" onClick={() => { setSpeed(1); dispatch({ type: "START", scenario: state.scenario!, customGoal: state.customGoal ?? undefined }); }} data-testid="button-restart" className="px-3">
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => { abortRef.current?.abort(); dispatch({ type: "RESET" }); setLocation("/"); }} className="px-3 text-muted-foreground">← Home</Button>
        </div>
      </header>

      {isError && (
        <div className="bg-red-950/50 border-b border-red-500/30 px-6 py-3 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />{state.errorMessage ?? "An error occurred"}
          <Button size="sm" variant="outline" className="ml-auto text-red-400 border-red-400/30" onClick={() => { dispatch({ type: "RESET" }); setLocation("/"); }}>Go back</Button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Thought Stream */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto relative flex flex-col">
          <div className="max-w-3xl mx-auto w-full flex-1">

            {/* Phase indicator */}
            <AnimatePresence mode="popLayout">
              <motion.div
                key={`phase-${state.currentPhase}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                className="mb-6"
              >
                {state.currentPhase && (
                  <div className="inline-flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Current Phase</span>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1.5 rounded-md font-mono font-bold border flex items-center gap-2 ${ps.labelBg}`}>
                        <ps.icon className="w-3.5 h-3.5" />
                        {state.isRealAgent ? phaseLabel(state.currentPhase) : PHASE_LABELS[state.currentPhase]}
                      </div>
                      <span className="text-muted-foreground text-sm">{PHASE_DESCRIPTIONS[state.currentPhase]}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Thought / Reasoning box */}
            <AnimatePresence mode="wait">
              {/* Only show thought box when there's thought content or waiting (not during tool observation) */}
              {(!activeToolCall || state.currentThought.length > 0) && (
                <motion.div
                  key={`thought-box-${state.currentPhase}`}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`relative p-6 rounded-xl border bg-card mb-6 ${ps.border}`}
                  style={{ boxShadow: isReasoningPhase && state.isRealAgent ? "0 0 40px -12px rgba(139,92,246,0.2)" : "0 0 30px -10px rgba(var(--primary),0.1)" }}
                >
                  <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-b ${ps.glow} to-transparent pointer-events-none rounded-xl`} />
                  <div className={`absolute -inset-[1px] rounded-xl border pointer-events-none transition-colors ${isPaused ? "border-amber-400/30" : ps.pulse}`} />

                  {/* "Reasoning" watermark label for real agent thinking phases */}
                  {state.isRealAgent && isReasoningPhase && (
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-violet-500/20">
                      <Brain className="w-4 h-4 text-violet-400" />
                      <span className="text-xs font-mono font-semibold uppercase tracking-wider text-violet-400">Internal Reasoning</span>
                      <span className="ml-auto flex items-center gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.span key={i} className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }} />
                        ))}
                      </span>
                    </div>
                  )}

                  <div className={`font-mono text-lg md:text-xl leading-relaxed whitespace-pre-wrap ${isReasoningPhase && state.isRealAgent ? "text-foreground/80 italic" : "text-foreground/90"}`}>
                    {state.currentThought.substring(0, state.visibleThoughtChars)}
                    {!isPaused && state.currentThought.length > 0 && (
                      <span className={`inline-block w-2 h-5 ml-1 animate-pulse align-middle ${isReasoningPhase && state.isRealAgent ? "bg-violet-400" : "bg-primary"}`} />
                    )}
                    {isPaused && <span className="inline-block w-2 h-5 ml-1 bg-amber-400/60 align-middle" />}
                    {state.currentThought.length === 0 && isRunning && (
                      <span className="text-muted-foreground animate-pulse">
                        {state.isRealAgent
                          ? isReasoningPhase ? "Thinking through the problem…" : "Processing…"
                          : "Thinking…"}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tool Call Card */}
            <AnimatePresence>
              {activeToolCall && (
                <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: "auto", y: 0 }} className="rounded-xl border border-border bg-black/40 overflow-hidden mb-6">
                  <div className={`px-4 py-2 border-b border-border flex items-center gap-2 ${toolConfig[activeToolCall.tool].bg}`}>
                    {(() => { const TI = toolConfig[activeToolCall.tool].icon; return <TI className={`w-4 h-4 ${toolConfig[activeToolCall.tool].color}`} />; })()}
                    <span className="font-mono text-sm font-semibold tracking-tight">TOOL: {activeToolCall.tool}</span>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-mono">Input</div>
                      <div className="font-mono text-sm bg-card p-3 rounded-md border border-border text-foreground/80 break-all">{activeToolCall.input}</div>
                    </div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-mono flex items-center gap-2">
                        Output
                        {!isPaused && state.streamingToolOutputChars < state.streamingToolOutput.length && <Loader2 className="w-3 h-3 animate-spin" />}
                        {state.isRealAgent && state.streamingToolOutput.length === 0 && <Loader2 className="w-3 h-3 animate-spin" />}
                      </div>
                      <div className="font-mono text-sm text-muted-foreground break-words border-l-2 border-border pl-4 whitespace-pre-wrap">
                        {state.streamingToolOutput.substring(0, state.streamingToolOutputChars)}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Right Panel: Reasoning Log (real agent) / Execution Trace (scripted) */}
        <aside className="w-84 border-l border-border bg-card/50 overflow-y-auto hidden lg:flex lg:flex-col shrink-0" style={{ width: "22rem" }}>
          <div className="p-5 sticky top-0 bg-card/95 backdrop-blur z-10 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              {state.isRealAgent
                ? <><Brain className="w-4 h-4 text-violet-400" />Reasoning Log</>
                : <><ListTodo className="w-4 h-4 text-primary" />Execution Trace</>}
            </h3>
            {state.isRealAgent && (
              <p className="text-xs text-muted-foreground mt-1">Full chain of thought as it builds</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {state.isRealAgent ? (
              /* ── Real agent reasoning log ── */
              <div className="space-y-3">
                {state.completedSteps.map((step, idx) => {
                  const isThinkStep = REASONING_PHASES.has(step.phase);
                  const isActStep   = ACTION_PHASES.has(step.phase);
                  const isObsStep   = OBSERVE_PHASES.has(step.phase);
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`rounded-lg border p-3 text-xs ${
                        isThinkStep ? "border-violet-500/20 bg-violet-500/5"
                        : isActStep   ? "border-blue-500/20 bg-blue-500/5"
                        : isObsStep   ? "border-teal-500/20 bg-teal-500/5"
                        : "border-border bg-card/30"
                      }`}
                    >
                      {/* Step header */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`flex items-center gap-1.5 font-mono font-semibold uppercase tracking-wider text-[10px] ${
                          isThinkStep ? "text-violet-400"
                          : isActStep ? "text-blue-400"
                          : isObsStep ? "text-teal-400"
                          : "text-emerald-400"
                        }`}>
                          <PhaseIcon phase={step.phase} className={`w-3 h-3 ${isThinkStep ? "text-violet-400" : isActStep ? "text-blue-400" : isObsStep ? "text-teal-400" : "text-emerald-400"}`} />
                          {phaseLabel(step.phase)}
                        </div>
                        {step.toolCall && (
                          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono">
                            {step.toolCall.tool}
                          </span>
                        )}
                      </div>

                      {/* Thought text — reasoning steps get full preview */}
                      {isThinkStep && step.thought && (
                        <p className="text-foreground/70 leading-relaxed italic font-mono text-[11px] line-clamp-5">
                          {step.thought}
                        </p>
                      )}

                      {/* Tool steps: show tool name + input */}
                      {step.toolCall && (
                        <div className="mt-1.5 font-mono text-[11px] text-muted-foreground truncate">
                          <span className="text-muted-foreground/60">→ </span>{step.toolCall.input}
                        </div>
                      )}

                      {/* Observe steps: brief output preview */}
                      {isObsStep && !step.toolCall && step.thought && (
                        <p className="text-foreground/60 leading-relaxed font-mono text-[11px] line-clamp-3">
                          {step.thought}
                        </p>
                      )}
                    </motion.div>
                  );
                })}

                {/* Current live step */}
                {state.currentPhase && isRunning && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-lg border border-dashed p-3 text-xs ${
                      isReasoningPhase ? "border-violet-400/40 bg-violet-400/5"
                      : state.currentPhase && ACTION_PHASES.has(state.currentPhase) ? "border-blue-400/40 bg-blue-400/5"
                      : "border-teal-400/40 bg-teal-400/5"
                    }`}
                  >
                    <div className={`flex items-center gap-2 font-mono font-semibold uppercase tracking-wider text-[10px] mb-2 ${isReasoningPhase ? "text-violet-400" : "text-teal-400"}`}>
                      {isReasoningPhase ? <Brain className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      {phaseLabel(state.currentPhase)}
                      <span className="ml-auto flex gap-0.5">
                        {[0, 1, 2].map((i) => (
                          <motion.span key={i} className={`inline-block w-1 h-1 rounded-full ${isReasoningPhase ? "bg-violet-400" : "bg-teal-400"}`}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.25 }} />
                        ))}
                      </span>
                    </div>
                    {state.currentThought && (
                      <p className={`leading-relaxed font-mono text-[11px] line-clamp-4 ${isReasoningPhase ? "text-foreground/70 italic" : "text-foreground/60"}`}>
                        {state.currentThought}
                      </p>
                    )}
                  </motion.div>
                )}

                {state.completedSteps.length === 0 && !isRunning && (
                  <div className="text-muted-foreground text-sm">No steps yet</div>
                )}

                <div ref={logEndRef} />
              </div>
            ) : (
              /* ── Scripted execution trace ── */
              <div className="relative space-y-6">
                <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
                {timelineSteps.map((step, idx) => {
                  const isCompleted = state.currentStepIndex > idx;
                  const isCurrent  = state.currentStepIndex === idx;
                  const isUpcoming = state.currentStepIndex < idx;
                  return (
                    <motion.div key={idx} initial={false} animate={{ opacity: isUpcoming ? 0.3 : 1, scale: isCurrent ? 1.02 : 1 }} className="relative flex gap-4 z-10">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 bg-card ${phaseTimelineDot(step.phase, isCurrent, isCompleted)}`}>
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-mono">{idx + 1}</span>}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="text-xs font-mono uppercase tracking-wider font-semibold mb-1 flex items-center gap-2">
                          <span className={isCurrent ? "text-primary" : "text-muted-foreground"}>{PHASE_LABELS[step.phase]}</span>
                          {step.toolCall && <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">{step.toolCall.tool}</span>}
                        </div>
                        <div className={`text-sm truncate ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>{step.thought}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
