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

    // Prefer the user-saved key, fall back to the env variable.
    // Treat an empty string as "not set" so the env fallback always works.
    const savedKey = (settings.providerApiKey || '').trim();
    const envKey = (process.env.ANTHROPIC_API_KEY || '').trim();
    const providerApiKey = savedKey || envKey;

    if (!providerApiKey) {
      return NextResponse.json(
        { error: 'API key is missing. Please configure it in settings or .env.local.' },
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
      });
    } catch (err: any) {
      console.error('[message/route] provider.sendMessage error:', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
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
        } catch (err: any) {
          console.error('[message/route] Streaming error:', err);
          controller.error(err);
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
  } catch (error: any) {
    console.error('[message/route] Unhandled error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
