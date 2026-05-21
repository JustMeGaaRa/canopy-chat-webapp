import { NextResponse } from 'next/server';
import { getChatRepository } from '@/lib/storage';
import { getProvider } from '@/lib/providers/registry';
import { getSettings } from '@/lib/settings';
import { ChatNode } from '@/lib/storage/types';
import { ChatMessage } from '@/lib/providers/types';
import crypto from 'crypto';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { content, parentNodeId } = await request.json();

    const repo = getChatRepository();
    const chat = await repo.getChat(id);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const settings = await getSettings();
    const providerId = settings.providerId || 'claude';
    const modelId = settings.modelId;

    // Determine the API key for the active provider
    let savedKey = (settings.providerKeys?.[providerId] || '').trim();
    if (providerId === 'claude' && !savedKey) {
      savedKey = (settings.providerApiKey || '').trim(); // Legacy fallback
    }

    let envKey = '';
    if (providerId === 'claude') {
      envKey = (process.env.ANTHROPIC_API_KEY || '').trim();
    } else if (providerId === 'openai') {
      envKey = (process.env.OPENAI_API_KEY || '').trim();
    } else if (providerId === 'gemini') {
      envKey = (process.env.GEMINI_API_KEY || '').trim();
    }

    const providerApiKey = savedKey || envKey;

    if (!providerApiKey) {
      const providerLabel =
        providerId === 'claude'
          ? 'Anthropic Claude'
          : providerId === 'openai'
          ? 'OpenAI'
          : 'Google Gemini';
      return NextResponse.json(
        { error: `API key is missing for ${providerLabel}. Please configure it in settings.` },
        { status: 400 }
      );
    }

    const userNodeId = crypto.randomUUID();
    const userNode: ChatNode = {
      id: userNodeId,
      parentId: parentNodeId || null,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    const updatedNodes = [...chat.nodes, userNode];

    let initialTitle = chat.title;
    if (chat.nodes.length === 0) {
      initialTitle = content.length > 60 ? `${content.substring(0, 57)}...` : content;
    }

    await repo.updateChat(id, {
      nodes: updatedNodes,
      selectedNodeId: userNodeId,
      title: initialTitle,
    });

    // Build conversation history by walking the parent chain
    const history: ChatMessage[] = [];
    let currentId: string | null = userNodeId;
    while (currentId !== null) {
      const node = updatedNodes.find((n) => n.id === currentId);
      if (!node) break;
      history.unshift({ role: node.role, content: node.content });
      currentId = node.parentId;
    }

    const provider = getProvider(providerId);
    let aiStream: ReadableStream<Uint8Array> | string;
    try {
      aiStream = await provider.sendMessage(history, {
        stream: true,
        apiKey: providerApiKey,
        modelId,
      });
    } catch (err) {
      console.error('[message/route] provider.sendMessage error:', err);
      return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }

    if (!(aiStream instanceof ReadableStream)) {
      return NextResponse.json(
        { error: 'Expected stream response from provider' },
        { status: 500 }
      );
    }

    const assistantNodeId = crypto.randomUUID();
    const assistantCreatedAt = new Date().toISOString();
    const reader = aiStream.getReader();

    const outputStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let fullAssistantContent = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const textChunk = new TextDecoder().decode(value);
            fullAssistantContent += textChunk;
            controller.enqueue(value);
          }

          const assistantNode: ChatNode = {
            id: assistantNodeId,
            parentId: userNodeId,
            role: 'assistant',
            content: fullAssistantContent,
            createdAt: assistantCreatedAt,
          };

          const currentChat = await repo.getChat(id);
          const currentNodes = currentChat ? currentChat.nodes : updatedNodes;

          await repo.updateChat(id, {
            nodes: [...currentNodes, assistantNode],
            selectedNodeId: assistantNodeId,
          });

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
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
