import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const event = req.body;

    console.log("Incoming Vapi event:", event);

    try {
      const stream = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful and intelligent voice assistant.",
          },
          {
            role: "user",
            content: event?.transcript || "Hello!",
          },
        ],
        stream: true,
      });

      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked',
      });

      for await (const chunk of stream) {
        const token = chunk.choices?.[0]?.delta?.content || '';
        if (token) {
          res.write(token);
        }
      }

      res.end();
    } catch (error) {
      console.error("OpenAI streaming error:", error);
      res.status(500).json({ error: "OpenAI streaming error" });
    }
  } else {
    res.status(405).send('Only POST requests are supported.');
  }
}
