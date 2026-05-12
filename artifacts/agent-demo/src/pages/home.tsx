import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { SCENARIOS, Scenario, PHASE_LABELS, Phase } from "@/data/scenarios";
import { useSimulation } from "@/context/simulation";
import {
  Search, Sparkles, Activity, CheckCircle, Eye, Lightbulb, ListTodo,
  Zap, Bot, MessageSquare, ArrowRight, ArrowDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AppMode = "scripted" | "real-agent" | "generative";

const phaseIcons: Record<Phase, React.ElementType> = {
  plan: ListTodo,
  think: Lightbulb,
  act: Activity,
  observe: Eye,
  reflect: Sparkles,
  done: CheckCircle,
};

const MODE_CONFIG: Record<AppMode, { label: string; icon: React.ElementType; color: string; activeCls: string; badge?: string }> = {
  scripted: {
    label: "Scripted Demo",
    icon: Zap,
    color: "text-foreground",
    activeCls: "bg-card text-foreground shadow-sm border border-border",
  },
  "real-agent": {
    label: "Real Agent",
    icon: Bot,
    color: "text-primary",
    activeCls: "bg-primary text-primary-foreground shadow-sm",
    badge: "✨",
  },
  generative: {
    label: "Generative AI",
    icon: MessageSquare,
    color: "text-amber-400",
    activeCls: "bg-amber-500 text-white shadow-sm",
  },
};

const MODE_BANNERS: Record<AppMode, { text: string; cls: string } | null> = {
  scripted: null,
  "real-agent": {
    text: "Real Agent mode — a live GPT-5 model will reason, plan, and call tools. Takes 15–30 seconds.",
    cls: "bg-primary/10 border-primary/20 text-primary",
  },
  generative: {
    text: "Generative AI mode — GPT-5 answers directly with no planning, no tools, and no reasoning steps. Compare with Real Agent to see the difference.",
    cls: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  },
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { dispatch } = useSimulation();
  const [customGoal, setCustomGoal] = useState("");
  const [mode, setMode] = useState<AppMode>("scripted");
  // Mirror mode in a ref so click handlers always see the latest value,
  // even if React hasn't committed the re-render yet (avoids stale closure).
  const modeRef = useRef<AppMode>("scripted");

  const changeMode = (newMode: AppMode) => {
    modeRef.current = newMode;
    setMode(newMode);
  };

  const handleSelectScenario = (scenario: Scenario) => {
    const m = modeRef.current;
    if (m === "real-agent") {
      dispatch({ type: "REAL_START", goal: scenario.goal });
    } else if (m === "generative") {
      dispatch({ type: "GENERATIVE_START", goal: scenario.goal });
    } else {
      dispatch({ type: "START", scenario });
    }
    setLocation("/demo");
  };

  const handleCustomGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoal.trim()) return;
    const goal = customGoal.trim();
    const m = modeRef.current;

    if (m === "real-agent") {
      dispatch({ type: "REAL_START", goal });
      setLocation("/demo");
      return;
    }
    if (m === "generative") {
      dispatch({ type: "GENERATIVE_START", goal });
      setLocation("/demo");
      return;
    }

    const lower = goal.toLowerCase();
    let selected: Scenario;
    if (lower.includes("trip") || lower.includes("travel") || lower.includes("tokyo")) {
      selected = SCENARIOS.find((s) => s.id === "tokyo-trip") || SCENARIOS[0];
    } else if (lower.includes("energy") || lower.includes("science") || lower.includes("fusion") || lower.includes("nuclear")) {
      selected = SCENARIOS.find((s) => s.id === "fusion-research") || SCENARIOS[1];
    } else if (lower.includes("debug") || lower.includes("api") || lower.includes("error") || lower.includes("bug")) {
      selected = SCENARIOS.find((s) => s.id === "debug-api") || SCENARIOS[2];
    } else if (lower.includes("canada") || lower.includes("canadian") || lower.includes("alberta") || lower.includes("health tech") || lower.includes("briefing")) {
      selected = SCENARIOS.find((s) => s.id === "canadian-ai-health") || SCENARIOS[4];
    } else {
      selected = SCENARIOS.find((s) => s.id === "pitch-app") || SCENARIOS[3];
    }
    dispatch({ type: "START", scenario: selected, customGoal: goal });
    setLocation("/demo");
  };

  const banner = MODE_BANNERS[mode];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      {/* Hero */}
      <section className="w-full max-w-5xl px-6 pt-24 pb-12 flex flex-col items-center text-center space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Interactive Demo</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
            Watch AI Think,<br />Plan, and Act
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            See how AI agents break down goals, reason through problems, and use tools to get things done — and how that compares to plain generation.
          </p>
        </motion.div>
      </section>

      {/* Mode toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-1 p-1 bg-muted/40 border border-border rounded-lg mb-4"
        data-testid="mode-toggle"
      >
        {(Object.entries(MODE_CONFIG) as [AppMode, typeof MODE_CONFIG[AppMode]][]).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const isActive = mode === key;
          return (
            <button
              key={key}
              onClick={() => changeMode(key)}
              data-testid={`button-mode-${key}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isActive ? cfg.activeCls : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {cfg.label}
              {cfg.badge && <span>{cfg.badge}</span>}
            </button>
          );
        })}
      </motion.div>

      {/* Comparison callout — generative vs agent */}
      <AnimatePresence mode="wait">
        {mode === "generative" && (
          <motion.div
            key="compare-callout"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="w-full max-w-3xl px-6 mb-6 overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-card/40 p-4 grid grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <MessageSquare className="w-4 h-4" />
                  Generative AI
                </div>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-amber-400/60 shrink-0" />Single prompt → single response</li>
                  <li className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-amber-400/60 shrink-0" />No planning or reasoning steps</li>
                  <li className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-amber-400/60 shrink-0" />No tool use or external data</li>
                  <li className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-amber-400/60 shrink-0" />Fast — finishes in seconds</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2 border-l border-border pl-4">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <Bot className="w-4 h-4" />
                  Agentic AI
                </div>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li className="flex items-center gap-1.5"><ArrowDown className="w-3 h-3 text-primary/60 shrink-0" />Breaks goal into steps</li>
                  <li className="flex items-center gap-1.5"><ArrowDown className="w-3 h-3 text-primary/60 shrink-0" />Plans, thinks, reflects</li>
                  <li className="flex items-center gap-1.5"><ArrowDown className="w-3 h-3 text-primary/60 shrink-0" />Calls tools for real data</li>
                  <li className="flex items-center gap-1.5"><ArrowDown className="w-3 h-3 text-primary/60 shrink-0" />Richer, more reliable output</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Banner for real-agent */}
        {banner && mode !== "generative" && (
          <motion.div
            key="banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-6 px-4 py-2 rounded-lg border text-sm flex items-center gap-2 ${banner.cls}`}
          >
            <Bot className="w-4 h-4 shrink-0" />
            {banner.text}
          </motion.div>
        )}
      </AnimatePresence>

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
              <Card className={`h-full bg-card border-card-border transition-colors relative overflow-hidden ${
                mode === "generative" ? "hover:border-amber-500/50" : "hover:border-primary/50"
              }`}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/10 transition-colors duration-500" />
                {mode !== "scripted" && (
                  <div className={`absolute top-3 right-3 flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    mode === "generative"
                      ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
                      : "text-primary bg-primary/10 border-primary/20"
                  }`}>
                    {mode === "generative" ? <MessageSquare className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                    {mode === "generative" ? "Generative" : "Real Agent"}
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
            placeholder={
              mode === "generative"
                ? "Type any goal — see what plain generation produces…"
                : mode === "real-agent"
                ? "Type any goal and the real AI agent will work on it…"
                : "Or type your own goal… (e.g. 'Plan a trip' or 'Debug an API')"
            }
            className="w-full pl-12 pr-40 h-14 text-lg bg-card/50 border-border focus-visible:ring-primary/50 rounded-xl"
            data-testid="input-custom-goal"
          />
          <Button
            type="submit"
            className={`absolute right-2 h-10 rounded-lg text-white gap-1.5 ${
              mode === "generative"
                ? "bg-amber-500 hover:bg-amber-500/90"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
            data-testid="button-submit-goal"
          >
            {mode === "generative" && <MessageSquare className="w-4 h-4" />}
            {mode === "real-agent" && <Bot className="w-4 h-4" />}
            {mode === "generative" ? "Generate" : mode === "real-agent" ? "Run Agent" : "Run Demo"}
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
