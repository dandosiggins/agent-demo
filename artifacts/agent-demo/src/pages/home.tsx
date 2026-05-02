import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { SCENARIOS, Scenario, PHASE_LABELS, Phase } from "@/data/scenarios";
import { useSimulation } from "@/context/simulation";
import { Search, Sparkles, Activity, CheckCircle, Eye, Lightbulb, ListTodo, Zap, Bot } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const phaseIcons: Record<Phase, React.ElementType> = {
  plan: ListTodo,
  think: Lightbulb,
  act: Activity,
  observe: Eye,
  reflect: Sparkles,
  done: CheckCircle,
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { dispatch } = useSimulation();
  const [customGoal, setCustomGoal] = useState("");
  const [realAI, setRealAI] = useState(false);

  const runScriptedDemo = (scenario: Scenario, goalOverride?: string) => {
    dispatch({ type: "START", scenario, customGoal: goalOverride });
    setLocation("/demo");
  };

  const runRealAgent = (goal: string) => {
    dispatch({ type: "REAL_START", goal });
    setLocation("/demo");
  };

  const handleSelectScenario = (scenario: Scenario) => {
    if (realAI) {
      runRealAgent(scenario.goal);
    } else {
      runScriptedDemo(scenario);
    }
  };

  const handleCustomGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoal.trim()) return;

    if (realAI) {
      runRealAgent(customGoal.trim());
      return;
    }

    const lower = customGoal.toLowerCase();
    let selected: Scenario;
    if (lower.includes("trip") || lower.includes("travel") || lower.includes("tokyo")) {
      selected = SCENARIOS.find((s) => s.id === "tokyo-trip") || SCENARIOS[0];
    } else if (lower.includes("energy") || lower.includes("science") || lower.includes("fusion") || lower.includes("nuclear")) {
      selected = SCENARIOS.find((s) => s.id === "fusion-research") || SCENARIOS[1];
    } else if (lower.includes("debug") || lower.includes("api") || lower.includes("error") || lower.includes("bug")) {
      selected = SCENARIOS.find((s) => s.id === "debug-api") || SCENARIOS[2];
    } else {
      selected = SCENARIOS.find((s) => s.id === "pitch-app") || SCENARIOS[3];
    }
    runScriptedDemo(selected, customGoal.trim());
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      {/* Hero */}
      <section className="w-full max-w-5xl px-6 pt-24 pb-16 flex flex-col items-center text-center space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Interactive Demo</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
            Watch AI Think,<br />Plan, and Act
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            See how AI agents break down goals, reason through problems, and use tools to get things done — step by step.
          </p>
        </motion.div>
      </section>

      {/* Mode toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-1 p-1 bg-muted/40 border border-border rounded-lg mb-8"
        data-testid="mode-toggle"
      >
        <button
          onClick={() => setRealAI(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            !realAI ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid="button-mode-scripted"
        >
          <Zap className="w-4 h-4" />
          Scripted Demo
        </button>
        <button
          onClick={() => setRealAI(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            realAI ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid="button-mode-real-ai"
        >
          <Bot className="w-4 h-4" />
          Real AI ✨
        </button>
      </motion.div>

      {realAI && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-2"
        >
          <Bot className="w-4 h-4 shrink-0" />
          Real AI mode — a live GPT-5 agent will reason through your goal using actual tool calls. Responses may take 15–30 seconds.
        </motion.div>
      )}

      {/* Scenarios Grid */}
      <section className="w-full max-w-5xl px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SCENARIOS.map((scenario, i) => (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="cursor-pointer group"
              onClick={() => handleSelectScenario(scenario)}
              data-testid={`card-scenario-${scenario.id}`}
            >
              <Card className={`h-full bg-card border-card-border hover:border-primary/50 transition-colors relative overflow-hidden ${realAI ? "hover:border-primary" : ""}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/10 transition-colors duration-500" />
                {realAI && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    <Bot className="w-3 h-3" />
                    Real AI
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{scenario.label}</CardTitle>
                  <CardDescription className="text-card-foreground/70">{scenario.goal}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md">
                    {scenario.description}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Custom Goal Input */}
      <section className="w-full max-w-2xl px-6 pb-24">
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onSubmit={handleCustomGoalSubmit}
          className="relative flex items-center"
        >
          <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
          <Input
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            placeholder={realAI ? "Type any goal and the real AI will work on it…" : "Or type your own goal… (e.g. 'Plan a trip' or 'Debug an API')"}
            className="w-full pl-12 pr-36 h-14 text-lg bg-card/50 border-border focus-visible:ring-primary/50 rounded-xl"
            data-testid="input-custom-goal"
          />
          <Button
            type="submit"
            className={`absolute right-2 h-10 rounded-lg text-primary-foreground gap-1.5 ${realAI ? "bg-primary hover:bg-primary/90" : "bg-primary hover:bg-primary/90"}`}
            data-testid="button-submit-goal"
          >
            {realAI ? <Bot className="w-4 h-4" /> : null}
            {realAI ? "Run Real AI" : "Run Agent"}
          </Button>
        </motion.form>
      </section>

      {/* How it works */}
      <section className="w-full max-w-5xl px-6 pb-24 text-center border-t border-border pt-16">
        <h2 className="text-2xl font-semibold mb-10">The 6 Phases of Agentic Action</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {(Object.entries(PHASE_LABELS) as [Phase, string][]).map(([phase, label], i) => {
            const Icon = phaseIcons[phase];
            return (
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="flex flex-col items-center p-4 rounded-xl bg-card/30 border border-border/50"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-medium mb-1">{label}</div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
