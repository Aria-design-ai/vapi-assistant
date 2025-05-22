import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    console.log("Webhook received:", req.body);

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Say hello back" }],
      });

      const reply = completion.choices[0].message.content;
      console.log("GPT Reply:", reply);

      res.status(200).json({
        type: "text",
        message: reply,
      });
    } catch (error) {
      console.error("OpenAI error:", error);
      res.status(500).json({ error: "Failed to call OpenAI" });
    }
  } else {
    res.status(405).send("Only POST requests are supported.");
  }
}
