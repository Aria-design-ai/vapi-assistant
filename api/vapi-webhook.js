import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
export default async function handler(req, res) {
  console.log("Vapi webhook hit");

  if (req.method === 'POST') {
    const event = req.body;

    console.log("Received from Vapi:", event);

    // Simple response (can be replaced with GPT logic)
    res.status(200).json({
      type: 'text',
      message: "Hi there! I'm your AI assistant. What can I help with?",
    });
  } else {
    res.status(405).send('Only POST requests are supported.');
  }
}
