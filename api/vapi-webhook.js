import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const event = req.body;

    console.log("Incoming Vapi event:", event);

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4", // or "gpt-3.5-turbo"
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
      });

      const reply = completion.choices[0].message.content;

      res.status(200).json({
        type: 'text',
        message: reply,
      });
    } catch (error) {
      console.error("OpenAI error:", error);
      res.status(500).json({ error: "OpenAI error" });
    }
  } else {
    res.status(405).send('Only POST requests are supported.');
  }
}
