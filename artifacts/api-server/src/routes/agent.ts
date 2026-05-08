import { Router } from "express";
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const router = Router();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SYSTEM_PROMPT = `You are an intelligent AI agent demonstrating how agents think and work.
Your purpose is to solve goals step by step, reasoning visibly so users can follow along.

Rules:
- Think out loud as you work. Show your reasoning clearly.
- Break complex goals into steps. Use tools to gather information.
- After using tools, synthesize what you learned before deciding next steps.
- When you have enough information, write a comprehensive final answer.
- Be specific, educational, and concrete in your reasoning.
- Do not ask clarifying questions — make reasonable assumptions and proceed.
- Limit tool use to 3-4 calls total, then synthesize your final answer.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information, news, facts, or research",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query to use" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculator",
      description: "Evaluate a mathematical expression or perform numerical computation",
      parameters: {
        type: "object",
        properties: {
          expression: { type: "string", description: "Mathematical expression to evaluate" },
        },
        required: ["expression"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "code_interpreter",
      description: "Write and run code to solve a computational problem or analyze data",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string", description: "Python code to execute" },
          description: { type: "string", description: "What this code does" },
        },
        required: ["code", "description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "memory",
      description: "Store or retrieve information from the agent's working memory",
      parameters: {
        type: "object",
        properties: {
          operation: { type: "string", enum: ["store", "retrieve"] },
          key: { type: "string", description: "Memory key" },
          value: { type: "string", description: "Value to store (for store operation)" },
        },
        required: ["operation", "key"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "file_read",
      description: "Read or analyze a document, file, or structured data source",
      parameters: {
        type: "object",
        properties: {
          filename: { type: "string", description: "File or document to read" },
          query: { type: "string", description: "What to look for in the document" },
        },
        required: ["filename", "query"],
      },
    },
  },
];

async function executeTool(name: string, args: Record<string, string>): Promise<string> {
  const prompts: Record<string, string> = {
    web_search: `Simulate realistic web search results for the query: "${args.query}".
Generate 4-5 search results with realistic titles, source names, and 2-3 sentence summaries per result.
Include specific facts, statistics, and data where relevant. Format as a numbered list.`,

    calculator: `Compute this mathematical expression: ${args.expression}
Show the step-by-step calculation clearly, then state the final result.`,

    code_interpreter: `Simulate running this Python code in a REPL:
\`\`\`python
${args.code}
\`\`\`
Show realistic output exactly as it would appear, including any print statements, computed values, or errors. Keep it concise.`,

    memory: args.operation === "store"
      ? `Confirm storing "${args.value ?? "(data)"}" under key "${args.key}". Return a brief confirmation.`
      : `Retrieve data from memory for key "${args.key}". Generate a plausible stored value relevant to a research or planning task.`,

    file_read: `Simulate reading "${args.filename}" and answering the query: "${args.query}".
Generate realistic file content (2-3 paragraphs with specific details, numbers, and facts) then answer the query.`,
  };

  const prompt = prompts[name] ?? `Execute tool ${name} with args: ${JSON.stringify(args)}. Return realistic output.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
    max_completion_tokens: 400,
  });

  return response.choices[0]?.message?.content ?? "(no output)";
}

router.post("/agent/run", async (req, res) => {
  const { goal } = req.body as { goal: string };

  if (!goal?.trim()) {
    res.status(400).json({ error: "goal is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Goal: ${goal}` },
  ];

  type Phase = "plan" | "think" | "act" | "observe" | "reflect" | "done";

  let stepIndex = 0;
  let justUsedTool = false;
  const MAX_ITERATIONS = 6;
  const completedThoughts: string[] = [];

  try {
    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      const thinkingPhase: Phase = iter === 0 ? "plan" : justUsedTool ? "reflect" : "think";
      send({ type: "phase", phase: thinkingPhase, stepIndex });

      const stream = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages,
        tools: TOOLS as any,
        tool_choice: "auto",
        stream: true,
        max_completion_tokens: 600,
      });

      let fullContent = "";
      const toolCallsMap: Record<number, { id: string; name: string; args: string }> = {};

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        if (delta?.content) {
          fullContent += delta.content;
          send({ type: "thought_chunk", content: delta.content });
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (!toolCallsMap[tc.index]) {
              toolCallsMap[tc.index] = { id: tc.id ?? "", name: "", args: "" };
            }
            if (tc.function?.name) toolCallsMap[tc.index].name = tc.function.name;
            if (tc.function?.arguments) toolCallsMap[tc.index].args += tc.function.arguments;
          }
        }
      }

      send({ type: "thought_done" });
      completedThoughts.push(fullContent);

      const toolCalls = Object.values(toolCallsMap);

      messages.push({
        role: "assistant",
        content: fullContent || null,
        tool_calls:
          toolCalls.length > 0
            ? toolCalls.map((tc) => ({
                id: tc.id,
                type: "function" as const,
                function: { name: tc.name, arguments: tc.args },
              }))
            : undefined,
      });

      send({ type: "step_done", stepIndex });
      stepIndex++;

      if (toolCalls.length === 0) {
        // No tool calls — this is the final answer
        const summary = completedThoughts.slice(0, -1).map((t, i) => {
          const first = t.split(".")[0];
          return first.length > 80 ? first.slice(0, 80) + "…" : first;
        });
        send({ type: "done", answer: fullContent, summary });
        break;
      }

      // Execute each tool call
      for (const tc of toolCalls) {
        let args: Record<string, string> = {};
        try {
          args = JSON.parse(tc.args);
        } catch {
          args = { input: tc.args };
        }

        // Determine the primary input string for display
        const primaryInput =
          args.query ?? args.expression ?? args.code ?? args.filename ?? tc.args;

        send({ type: "phase", phase: "act", stepIndex });
        send({ type: "tool_call", tool: tc.name, input: primaryInput });

        const toolOutput = await executeTool(tc.name, args);

        send({ type: "phase", phase: "observe", stepIndex });

        // Stream tool output in small chunks for effect
        const CHUNK = 25;
        for (let i = 0; i < toolOutput.length; i += CHUNK) {
          send({ type: "tool_chunk", content: toolOutput.slice(i, i + CHUNK) });
          await sleep(20);
        }

        send({ type: "tool_done" });
        send({ type: "step_done", stepIndex });
        stepIndex++;

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: toolOutput,
        });
      }

      justUsedTool = true;
    }
  } catch (err) {
    send({ type: "error", message: String(err) });
  }

  res.end();
});

export default router;
