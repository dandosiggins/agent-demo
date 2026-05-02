import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useSimulation } from "@/context/simulation";
import { PHASE_LABELS, PHASE_DESCRIPTIONS, ToolType } from "@/data/scenarios";
import { THOUGHT_CHARS_PER_SEC, TOOL_OUTPUT_CHARS_PER_SEC, INTER_STEP_PAUSE_MS } from "@/engine/simulation";
import { Loader2, Globe, Database, Terminal, Calculator, FileText, CheckCircle, RotateCcw, Activity, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";

const toolConfig: Record<ToolType, { icon: React.ElementType; color: string; bg: string }> = {
  web_search: { icon: Globe, color: "text-blue-400", bg: "bg-blue-400/10" },
  memory: { icon: Database, color: "text-violet-400", bg: "bg-violet-400/10" },
  code_interpreter: { icon: Terminal, color: "text-green-400", bg: "bg-green-400/10" },
  calculator: { icon: Calculator, color: "text-amber-400", bg: "bg-amber-400/10" },
  file_read: { icon: FileText, color: "text-teal-400", bg: "bg-teal-400/10" },
};

export default function Demo() {
  const [, setLocation] = useLocation();
  const { state, dispatch } = useSimulation();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!state.scenario || state.status === "idle") {
      setLocation("/");
    }
  }, [state.scenario, state.status, setLocation]);

  // Main simulation loop
  useEffect(() => {
    if (state.status !== "running" || !state.scenario) return;

    let intervalId: number;
    let lastTick = performance.now();

    const tick = () => {
      const now = performance.now();
      const dt = now - lastTick;
      lastTick = now;

      dispatch({ type: "TICK", ms: dt });

      const currentStep = state.scenario?.steps[state.currentStepIndex];
      if (!currentStep) {
        if (state.currentStepIndex >= (state.scenario?.steps.length ?? 0)) {
          dispatch({ type: "FINISH" });
          setLocation("/results");
        }
        return;
      }

      const thoughtLength = state.currentThought.length;
      
      if (state.visibleThoughtChars < thoughtLength) {
        // Stream thought
        const charsToAdd = Math.max(1, Math.floor((THOUGHT_CHARS_PER_SEC * dt) / 1000));
        dispatch({ type: "STREAM_THOUGHT", chars: state.visibleThoughtChars + charsToAdd });
      } else if (currentStep.toolCall && state.streamingToolOutputChars < currentStep.toolCall.output.length) {
        // Stream tool output
        const charsToAdd = Math.max(1, Math.floor((TOOL_OUTPUT_CHARS_PER_SEC * dt) / 1000));
        dispatch({ type: "STREAM_TOOL_OUTPUT", chars: state.streamingToolOutputChars + charsToAdd });
      } else {
        // Step complete — mark done then either advance or finish
        clearInterval(intervalId);
        dispatch({ type: "COMPLETE_STEP", step: currentStep });

        const isLastStep =
          state.currentStepIndex >= (state.scenario?.steps.length ?? 0) - 1;

        if (isLastStep) {
          setTimeout(() => {
            dispatch({ type: "FINISH" });
            setLocation("/results");
          }, INTER_STEP_PAUSE_MS);
        } else {
          setTimeout(() => {
            dispatch({ type: "ADVANCE_STEP", stepIndex: state.currentStepIndex + 1 });
          }, INTER_STEP_PAUSE_MS);
        }
      }
    };

    intervalId = window.setInterval(tick, 50); // 20fps for smooth text update
    return () => clearInterval(intervalId);
  }, [
    state.status,
    state.scenario,
    state.currentStepIndex,
    state.visibleThoughtChars,
    state.streamingToolOutputChars,
    state.currentThought,
    dispatch,
    setLocation
  ]);

  if (!state.scenario) return null;

  const currentStep = state.scenario.steps[state.currentStepIndex];
  const formatTime = (ms: number) => (ms / 1000).toFixed(1) + "s";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-primary font-mono text-sm border border-primary/20 bg-primary/5 px-3 py-1 rounded-md">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>Agent Running</span>
          </div>
          <h1 className="font-medium hidden md:block">{state.scenario.goal}</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="font-mono text-sm text-muted-foreground flex items-center gap-2">
            <span>Elapsed:</span>
            <span className="text-foreground min-w-[3rem] tabular-nums" data-testid="text-timer">
              {formatTime(state.elapsedMs)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              dispatch({ type: "START", scenario: state.scenario! });
            }}
            data-testid="button-restart"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Thought Stream */}
        <main className="flex-1 p-6 lg:p-12 overflow-y-auto relative flex flex-col">
          <div className="max-w-3xl mx-auto w-full flex-1">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={`phase-${state.currentPhase}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                className="mb-8"
              >
                {state.currentPhase && (
                  <div className="inline-flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Current Phase</span>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 rounded-md bg-primary/20 text-primary font-mono font-bold border border-primary/30">
                        {PHASE_LABELS[state.currentPhase]}
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {PHASE_DESCRIPTIONS[state.currentPhase]}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <motion.div 
              layout
              className="relative p-6 rounded-xl border border-primary/30 bg-card shadow-[0_0_30px_-10px_rgba(var(--primary),0.1)] mb-6"
            >
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none rounded-xl" />
              <div className="absolute -inset-[1px] rounded-xl border border-primary/50 animate-pulse pointer-events-none" />
              
              <div className="font-mono text-lg md:text-xl leading-relaxed whitespace-pre-wrap text-foreground/90">
                {state.currentThought.substring(0, state.visibleThoughtChars)}
                <span className="inline-block w-2 h-5 ml-1 bg-primary animate-pulse align-middle" />
              </div>
            </motion.div>

            {/* Tool Call Card */}
            <AnimatePresence>
              {currentStep?.toolCall && state.visibleThoughtChars >= state.currentThought.length && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  className="rounded-xl border border-border bg-black/40 overflow-hidden"
                >
                  <div className={`px-4 py-2 border-b border-border flex items-center gap-2 ${toolConfig[currentStep.toolCall.tool].bg}`}>
                    {(() => {
                      const ToolIcon = toolConfig[currentStep.toolCall.tool].icon;
                      return <ToolIcon className={`w-4 h-4 ${toolConfig[currentStep.toolCall.tool].color}`} />;
                    })()}
                    <span className="font-mono text-sm font-semibold tracking-tight">
                      TOOL: {currentStep.toolCall.tool}
                    </span>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-mono">Input</div>
                      <div className="font-mono text-sm bg-card p-3 rounded-md border border-border text-foreground/80 break-all">
                        {currentStep.toolCall.input}
                      </div>
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-mono flex items-center gap-2">
                        Output
                        {state.streamingToolOutputChars < currentStep.toolCall.output.length && (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        )}
                      </div>
                      <div className="font-mono text-sm text-muted-foreground break-words border-l-2 border-border pl-4 whitespace-pre-wrap">
                        {currentStep.toolCall.output.substring(0, state.streamingToolOutputChars)}
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Right Panel: Timeline */}
        <aside className="w-80 border-l border-border bg-card/50 overflow-y-auto hidden lg:block shrink-0">
          <div className="p-6 sticky top-0 bg-card/95 backdrop-blur z-10 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-primary" />
              Execution Trace
            </h3>
          </div>
          <div className="p-6 relative">
            <div className="absolute left-[39px] top-6 bottom-6 w-px bg-border" />
            <div className="space-y-6">
              {state.scenario.steps.map((step, idx) => {
                const isCompleted = state.currentStepIndex > idx;
                const isCurrent = state.currentStepIndex === idx;
                const isUpcoming = state.currentStepIndex < idx;

                return (
                  <motion.div
                    key={idx}
                    initial={false}
                    animate={{
                      opacity: isUpcoming ? 0.3 : 1,
                      scale: isCurrent ? 1.02 : 1,
                    }}
                    className="relative flex gap-4 z-10"
                  >
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 bg-card
                      ${isCompleted ? 'border-primary text-primary' : 
                        isCurrent ? 'border-primary border-dashed text-primary bg-primary/10' : 
                        'border-muted text-muted-foreground'}
                    `}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-mono">{idx + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="text-xs font-mono uppercase tracking-wider font-semibold mb-1 flex items-center gap-2">
                        <span className={isCurrent ? "text-primary" : "text-muted-foreground"}>
                          {PHASE_LABELS[step.phase]}
                        </span>
                        {step.toolCall && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">
                            {step.toolCall.tool}
                          </span>
                        )}
                      </div>
                      <div className={`text-sm truncate ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.thought}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
