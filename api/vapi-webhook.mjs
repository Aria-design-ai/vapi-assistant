import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Only POST requests are supported.");
    return;
  }

  const { messages, session_id } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Missing or invalid messages array." });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // ensures headers are sent immediately

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4", // or "gpt-3.5-turbo"
      stream: true,
      messages,
    });

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        const payload = {
          type: "text",
          message: content,
        };
        res.write(`event: message\ndata: ${JSON.stringify(payload)}\n\n`);
      }
    }

    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  } catch (err) {
    console.error("Streaming error:", err);
    res.write(`event: error\ndata: ${JSON.stringify({ error: "OpenAI streaming failed." })}\n\n`);
    res.end();
  }
}
