import { ChatRepository } from './types';
import { LocalFileChatRepository } from './local-file-repository';

let repository: ChatRepository | null = null;

export function getChatRepository(): ChatRepository {
  if (!repository) {
    repository = new LocalFileChatRepository();
  }
  return repository;
}
