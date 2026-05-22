import { NextResponse } from 'next/server';
import { getProvider } from '@/lib/providers/registry';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { history, providerId, modelId, providerApiKey } = await request.json();

    // Determine the API key for the active provider
    // Fall back to server environment keys if the client didn't supply a key
    let finalApiKey = (providerApiKey || '').trim();
    const activeProviderId = providerId || 'claude';
    const activeModelId = modelId;

    if (!finalApiKey) {
      if (activeProviderId === 'claude') {
        finalApiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
      } else if (activeProviderId === 'openai') {
        finalApiKey = (process.env.OPENAI_API_KEY || '').trim();
      } else if (activeProviderId === 'gemini') {
        finalApiKey = (process.env.GEMINI_API_KEY || '').trim();
      }
    }

    if (!finalApiKey) {
      const providerLabel =
        activeProviderId === 'claude'
          ? 'Anthropic Claude'
          : activeProviderId === 'openai'
            ? 'OpenAI'
            : 'Google Gemini';
      return NextResponse.json(
        { error: `API key is missing for ${providerLabel}. Please configure it in settings.` },
        { status: 400 }
      );
    }

    const provider = getProvider(activeProviderId);
    let aiStream: ReadableStream<Uint8Array> | string;
    try {
      aiStream = await provider.sendMessage(history, {
        stream: true,
        apiKey: finalApiKey,
        modelId: activeModelId,
      });
    } catch (err) {
      console.error('[message/route] provider.sendMessage error:', err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : String(err) },
        { status: 500 }
      );
    }

    if (!(aiStream instanceof ReadableStream)) {
      return NextResponse.json(
        { error: 'Expected stream response from provider' },
        { status: 500 }
      );
    }

    // Proxy the stream back to the client
    const reader = aiStream.getReader();
    const outputStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        } catch (err) {
          console.error('[message/route] Streaming error:', err);
          controller.error(err instanceof Error ? err : new Error(String(err)));
        }
      },
    });

    return new Response(outputStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('[message/route] Unhandled error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
