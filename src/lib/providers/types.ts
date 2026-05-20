export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatProvider {
  id: string;
  name: string;
  sendMessage(
    messages: ChatMessage[],
    options?: { stream?: boolean; apiKey?: string }
  ): Promise<ReadableStream<Uint8Array> | string>;
}
