// chatController.js
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const aiChat = async (req, res) => {
  const message = req.query.message || 'Hello!';

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
      stream: true,
    });

    // Iterate over streaming events
    for await (const event of stream) {
      const textChunk = event.choices?.[0]?.delta?.content;
      if (textChunk) {
        res.write(`data: ${textChunk}\n\n`);
      }

      // Optional: detect end
      const finishReason = event.choices?.[0]?.finish_reason;
      if (finishReason === 'stop') {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }

    // Signal end of stream
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error(err);
    res.write(`data: ERROR: ${err.message}\n\n`);
    res.end();
  }
};

module.exports = { aiChat };
