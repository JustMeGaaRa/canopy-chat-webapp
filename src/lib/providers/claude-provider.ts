import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage, ChatProvider } from './types';

export class ClaudeProvider implements ChatProvider {
  id = 'claude';
  name = 'Anthropic Claude';

  async sendMessage(
    messages: ChatMessage[],
    options?: { stream?: boolean; apiKey?: string; modelId?: string }
  ): Promise<ReadableStream<Uint8Array> | string> {
    const apiKey = options?.apiKey || process.env.ANTHROPIC_API_KEY;
    const model = options?.modelId || 'claude-sonnet-4-6';
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is missing');
    }

    const isMockKey =
      apiKey === 'mock' ||
      apiKey.startsWith('mock-');

    if (isMockKey) {
      if (options?.stream) {
        return new ReadableStream<Uint8Array>({
          async start(controller) {
            const encoder = new TextEncoder();
            const text = `This is a mock streaming response from Anthropic Claude (${model}) via Canopy. The branching tree layout, dynamic settings, and panel scaling are running perfectly!`;
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
        return `This is a mock response from Anthropic Claude (${model}).`;
      }
    }

    const anthropic = new Anthropic({ apiKey });
    const formattedMessages = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    if (options?.stream) {
      const stream = await anthropic.messages.create({
        max_tokens: 4000,
        messages: formattedMessages,
        model: model,
        stream: true,
      });

      return new ReadableStream<Uint8Array>({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const chunk of stream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                controller.enqueue(encoder.encode(chunk.delta.text));
              }
            }
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });
    } else {
      const response = await anthropic.messages.create({
        max_tokens: 4000,
        messages: formattedMessages,
        model: model,
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      return textBlock && 'text' in textBlock ? textBlock.text : '';
    }
  }
}
