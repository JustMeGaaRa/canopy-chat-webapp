import { ChatProvider } from './types';
import { ClaudeProvider } from './claude-provider';

const providers: Record<string, ChatProvider> = {
  claude: new ClaudeProvider(),
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
