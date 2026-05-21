import { ChatMessage, ChatProvider } from './types';

export class OpenAIProvider implements ChatProvider {
  id = 'openai';
  name = 'OpenAI';

  async sendMessage(
    messages: ChatMessage[],
    options?: { stream?: boolean; apiKey?: string; modelId?: string }
  ): Promise<ReadableStream<Uint8Array> | string> {
    const apiKey = options?.apiKey || process.env.OPENAI_API_KEY;
    const model = options?.modelId || 'gpt-5.5';

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is missing');
    }

    const isMockKey = apiKey === 'mock' || apiKey.startsWith('mock-');

    if (isMockKey) {
      if (options?.stream) {
        return new ReadableStream<Uint8Array>({
          async start(controller) {
            const encoder = new TextEncoder();
            const text = `This is a mock streaming response from OpenAI (${model}) via Canopy. The input box, settings, and layout are working beautifully!`;
            const words = text.split(' ');
            try {
              for (const word of words) {
                controller.enqueue(encoder.encode(word + ' '));
                await new Promise((resolve) => setTimeout(resolve, 80));
              }
              controller.close();
            } catch (err) {
              controller.error(err);
            }
          },
        });
      } else {
        return `This is a mock response from OpenAI (${model}).`;
      }
    }

    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        stream: !!options?.stream,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `OpenAI API returned status ${response.status}`
      );
    }

    if (options?.stream) {
      const reader = response.body?.getReader();
      if (!reader) throw new Error('OpenAI response body is not readable');

      return new ReadableStream<Uint8Array>({
        async start(controller) {
          const encoder = new TextEncoder();
          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const cleanedLine = line.trim();
                if (!cleanedLine.startsWith('data: ')) continue;
                if (cleanedLine === 'data: [DONE]') continue;

                try {
                  const jsonStr = cleanedLine.slice(6);
                  const parsed = JSON.parse(jsonStr);
                  const text = parsed.choices?.[0]?.delta?.content || '';
                  if (text) {
                    controller.enqueue(encoder.encode(text));
                  }
                } catch {
                  // Ignore JSON parse errors for partially loaded lines
                }
              }
            }
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });
    } else {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    }
  }
}
