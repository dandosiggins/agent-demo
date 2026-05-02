import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useSimulation } from "@/context/simulation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, RotateCcw, Clock, Target, Rocket } from "lucide-react";

// Simple markdown renderer for the final answer
function renderMarkdown(text: string) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.*?)`/g, "<code class='bg-muted/50 px-1 py-0.5 rounded font-mono text-sm'>$1</code>")
    .replace(/\n\n/g, "</p><p className='mb-4'>")
    .replace(/\n/g, "<br/>");
  
  return `<p className='mb-4'>${html}</p>`;
}

export default function Results() {
  const [, setLocation] = useLocation();
  const { state, dispatch } = useSimulation();

  useEffect(() => {
    if (!state.scenario || state.status !== "done") {
      setLocation("/");
    }
  }, [state.scenario, state.status, setLocation]);

  if (!state.scenario || state.status !== "done") return null;

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-2">
            <Rocket className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Mission Accomplished</h1>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-card rounded-md border border-border">
              <Target className="w-4 h-4" />
              {state.customGoal ?? state.scenario.label}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-card rounded-md border border-border" data-testid="text-total-time">
              <Clock className="w-4 h-4" />
              {(state.elapsedMs / 1000).toFixed(1)}s elapsed
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          
          {/* Main Content: Final Answer */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 space-y-6"
          >
            <Card className="border-primary/20 bg-card/50 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-secondary/50" />
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  Final Output
                </h2>
                <div 
                  className="prose prose-invert prose-p:leading-relaxed prose-strong:text-foreground max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(state.scenario.finalAnswer) }}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar: Step Summary */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="md:col-span-1 space-y-6"
          >
            <Card className="bg-card">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 border-b border-border pb-4">What the agent did</h3>
                <ul className="space-y-4">
                  {state.scenario.stepSummary.map((summary, idx) => (
                    <motion.li 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + idx * 0.1 }}
                      className="flex items-start gap-3 text-sm"
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-muted-foreground">{summary}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <Button 
                onClick={() => {
                  dispatch({ type: "RESET" });
                  setLocation("/");
                }}
                className="w-full h-12 text-lg font-medium"
                size="lg"
                data-testid="button-try-another"
              >
                Try Another Scenario
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
