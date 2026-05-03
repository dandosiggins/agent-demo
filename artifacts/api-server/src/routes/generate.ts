import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const SYSTEM_PROMPT = `You are a helpful AI assistant. Answer the user's question or task directly and helpfully in a single response.
Be thorough but concise. Do not plan steps, do not use tools, do not reason out loud — just provide your best answer directly.`;

router.post("/generate/run", async (req, res) => {
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

  try {
    send({ type: "start" });

    const stream = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: goal },
      ],
      stream: true,
      max_completion_tokens: 800,
    });

    let fullContent = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullContent += content;
        send({ type: "chunk", content });
      }
    }

    send({ type: "done", answer: fullContent });
  } catch (err) {
    send({ type: "error", message: String(err) });
  }

  res.end();
});

export default router;
