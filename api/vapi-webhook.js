export const config = {
  runtime: 'edge',
};

// Main POST handler
export async function POST(req: Request): Promise<Response> {
  try {
    const raw = await req.json();
    let { messages, session_id } = raw;

    // Ensure messages is an array
    if (!messages || !Array.isArray(messages)) {
      messages = [];
    }

    // Inject system prompt if not present
    if (!messages.find((m: any) => m.role === 'system')) {
      messages.unshift({
        role: 'system',
        content: 'You are a helpful voice assistant.',
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a friendly assistant who responds to the user’s queries clearly and conversationally. If the user asks for a joke or fun fact, provide a humorous or interesting response.' },
    ...messages
  ],
  stream: true,
}),
        });

        const reader = response.body!.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.replace('data: ', '');
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  console.log('Chunk:', content);
                  
                  const payload = `event: message\ndata: ${JSON.stringify({ type: 'text', message: content })}\n\n`;
                  controller.enqueue(encoder.encode(payload));
                }
              } catch (err) {
                console.error('❌ Parse error:', err);
              }
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
