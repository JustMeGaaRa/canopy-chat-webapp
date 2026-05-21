import { ChatProvider } from './types';
import { ClaudeProvider } from './claude-provider';
import { OpenAIProvider } from './openai-provider';
import { GeminiProvider } from './gemini-provider';

const providers: Record<string, ChatProvider> = {
  claude: new ClaudeProvider(),
  openai: new OpenAIProvider(),
  gemini: new GeminiProvider(),
};

export function getProvider(id: string): ChatProvider {
  const provider = providers[id];
  if (!provider) {
    throw new Error(`Provider ${id} not found`);
  }
  return provider;
}

export function getAllProviders(): ChatProvider[] {
  return Object.values(providers);
}
