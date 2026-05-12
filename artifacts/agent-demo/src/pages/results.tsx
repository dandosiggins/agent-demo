import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useSimulation } from "@/context/simulation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, RotateCcw, Clock, Target, Rocket, MessageSquare, Bot, ArrowRight } from "lucide-react";

type TextSegment =
  | { kind: "text"; value: string }
  | { kind: "bold"; value: string }
  | { kind: "code"; value: string };

function parseInline(line: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const re = /\*\*(.*?)\*\*|`(.*?)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) segments.push({ kind: "text", value: line.slice(last, m.index) });
    if (m[1] !== undefined) segments.push({ kind: "bold", value: m[1] });
    else segments.push({ kind: "code", value: m[2] });
    last = m.index + m[0].length;
  }
  if (last < line.length) segments.push({ kind: "text", value: line.slice(last) });
  return segments;
}

function MarkdownText({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/);
  return (
    <>
      {paragraphs.map((para, pi) => (
        <p key={pi} className="mb-4">
          {para.split(/\n/).map((line, li, arr) => (
            <span key={li}>
              {parseInline(line).map((seg, si) =>
                seg.kind === "bold" ? (
                  <strong key={si} className="text-foreground">{seg.value}</strong>
                ) : seg.kind === "code" ? (
                  <code key={si} className="bg-muted/50 px-1 py-0.5 rounded font-mono text-sm">{seg.value}</code>
                ) : (
                  <span key={si}>{seg.value}</span>
                )
              )}
              {li < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

export default function Results() {
  const [, setLocation] = useLocation();
  const { state, dispatch } = useSimulation();

  useEffect(() => {
    if (!state.scenario || state.status !== "done") {
      setLocation("/");
    }
  }, [state.scenario, state.status, setLocation]);

  const finalAnswer = state.isGenerative
    ? state.generativeFinalAnswer
    : state.isRealAgent
    ? state.realFinalAnswer
    : state.scenario?.finalAnswer ?? "";

  const stepSummary = state.isRealAgent ? state.realStepSummary : state.scenario?.stepSummary ?? [];

  if (!state.scenario || state.status !== "done") return null;

  const accentCls = state.isGenerative
    ? "from-amber-500/50 to-orange-500/50"
    : "from-primary/50 to-secondary/50";

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${state.isGenerative ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"}`}>
            {state.isGenerative ? <MessageSquare className="w-8 h-8" /> : <Rocket className="w-8 h-8" />}
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            {state.isGenerative ? "Response Generated" : "Mission Accomplished"}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground font-mono">
            {state.isGenerative && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-md border border-amber-500/20 text-amber-400">
                <MessageSquare className="w-4 h-4" />
                Generative AI
              </div>
            )}
            {state.isRealAgent && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-md border border-primary/20 text-primary">
                <Bot className="w-4 h-4" />
                Real Agent
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-card rounded-md border border-border">
              <Target className="w-4 h-4" />
              {state.customGoal ?? state.scenario?.label ?? "Agent Task"}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-card rounded-md border border-border" data-testid="text-total-time">
              <Clock className="w-4 h-4" />
              {(state.elapsedMs / 1000).toFixed(1)}s elapsed
            </div>
          </div>
        </motion.div>

        {/* Generative comparison callout */}
        {state.isGenerative && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5"
          >
            <div className="flex items-start gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-400 mb-1">Generative AI — no steps taken</div>
                <div className="text-sm text-muted-foreground">
                  This response came from a single prompt → completion call. The model had no ability to plan, search the web, run calculations, or verify its own output.
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-background/60 rounded-lg p-3 border border-border">
                <div className="text-amber-400 font-semibold mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> What just happened
                </div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>✓ 1 LLM call made</li>
                  <li>✓ 0 tools used</li>
                  <li>✓ 0 reasoning steps</li>
                  <li>✓ Finished in ~{(state.elapsedMs / 1000).toFixed(0)}s</li>
                </ul>
              </div>
              <div className="bg-background/60 rounded-lg p-3 border border-primary/20">
                <div className="text-primary font-semibold mb-2 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" /> What an Agent would do
                </div>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-1"><ArrowRight className="w-3 h-3 text-primary/50" /> Plan the approach</li>
                  <li className="flex items-center gap-1"><ArrowRight className="w-3 h-3 text-primary/50" /> Search for current data</li>
                  <li className="flex items-center gap-1"><ArrowRight className="w-3 h-3 text-primary/50" /> Verify and reflect</li>
                  <li className="flex items-center gap-1"><ArrowRight className="w-3 h-3 text-primary/50" /> Synthesise richer output</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                onClick={() => {
                  if (state.customGoal) {
                    dispatch({ type: "REAL_START", goal: state.customGoal });
                    setLocation("/demo");
                  } else {
                    dispatch({ type: "RESET" });
                    setLocation("/");
                  }
                }}
              >
                <Bot className="w-4 h-4" />
                Run the same goal with Real Agent →
              </Button>
            </div>
          </motion.div>
        )}

        <div className="grid md:grid-cols-3 gap-8 items-start">

          {/* Main Content: Final Answer */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-2 space-y-6">
            <Card className={`overflow-hidden relative ${state.isGenerative ? "border-amber-500/20" : "border-primary/20"} bg-card/50`}>
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${accentCls}`} />
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  {state.isGenerative ? "Generated Response" : "Final Output"}
                </h2>
                <div className="prose prose-invert prose-p:leading-relaxed max-w-none text-muted-foreground">
                  <MarkdownText text={finalAnswer} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="md:col-span-1 space-y-6">

            {/* Step summary — agentic modes only */}
            {!state.isGenerative && stepSummary.length > 0 && (
              <Card className="bg-card">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 border-b border-border pb-4">What the agent did</h3>
                  <ul className="space-y-4">
                    {stepSummary.map((summary, idx) => (
                      <motion.li key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + idx * 0.1 }} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-muted-foreground">{summary}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Step summary fallback — scripted and real agent */}
            {!state.isGenerative && state.completedSteps.length > 0 && stepSummary.length === 0 && (
              <Card className="bg-card">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 border-b border-border pb-4">Steps completed</h3>
                  <ul className="space-y-4">
                    {state.completedSteps.map((step, idx) => (
                      <motion.li key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + idx * 0.1 }} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-muted-foreground capitalize">{step.phase}: {step.thought.slice(0, 60)}…</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="space-y-3">
              <Button
                onClick={() => { dispatch({ type: "RESET" }); setLocation("/"); }}
                className="w-full h-12 text-lg font-medium"
                size="lg"
                data-testid="button-try-another"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Try Another
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
