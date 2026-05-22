import { Chat, ChatMeta, ChatRepository } from './types';

// Safe check for browser environment and OPFS availability
const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined' && !!navigator.storage;

async function getChatsDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isBrowser) return null;
  try {
    const root = await navigator.storage.getDirectory();
    return await root.getDirectoryHandle('chats', { create: true });
  } catch (error) {
    console.error('Failed to get OPFS chats directory:', error);
    return null;
  }
}

async function readJsonFile<T>(dir: FileSystemDirectoryHandle, filename: string, defaultValue: T): Promise<T> {
  try {
    const fileHandle = await dir.getFileHandle(filename);
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text) as T;
  } catch {
    return defaultValue;
  }
}

async function writeJsonFile<T>(dir: FileSystemDirectoryHandle, filename: string, data: T): Promise<void> {
  const fileHandle = await dir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

export class BrowserOPFSChatRepository implements ChatRepository {
  async listChats(): Promise<ChatMeta[]> {
    const dir = await getChatsDirectory();
    if (!dir) return [];
    const list = await readJsonFile<ChatMeta[]>(dir, 'index.json', []);
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getChat(id: string): Promise<Chat | null> {
    const dir = await getChatsDirectory();
    if (!dir) return null;
    try {
      return await readJsonFile<Chat | null>(dir, `${id}.json`, null);
    } catch {
      return null;
    }
  }

  async createChat(chat: Chat): Promise<void> {
    const dir = await getChatsDirectory();
    if (!dir) return;

    await writeJsonFile(dir, `${chat.id}.json`, chat);

    const index = await readJsonFile<ChatMeta[]>(dir, 'index.json', []);
    const meta: ChatMeta = {
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      nodeCount: chat.nodes.length,
    };
    index.push(meta);
    await writeJsonFile(dir, 'index.json', index);
  }

  async updateChat(id: string, update: Partial<Chat>): Promise<void> {
    const dir = await getChatsDirectory();
    if (!dir) return;

    const chat = await this.getChat(id);
    if (!chat) {
      throw new Error(`Chat with id ${id} not found`);
    }

    const updatedChat: Chat = {
      ...chat,
      ...update,
      updatedAt: new Date().toISOString(),
    };

    await writeJsonFile(dir, `${id}.json`, updatedChat);

    const index = await readJsonFile<ChatMeta[]>(dir, 'index.json', []);
    const idx = index.findIndex((m) => m.id === id);
    if (idx !== -1) {
      index[idx] = {
        ...index[idx],
        title: updatedChat.title,
        updatedAt: updatedChat.updatedAt,
        nodeCount: updatedChat.nodes.length,
      };
    } else {
      index.push({
        id: updatedChat.id,
        title: updatedChat.title,
        createdAt: updatedChat.createdAt,
        updatedAt: updatedChat.updatedAt,
        nodeCount: updatedChat.nodes.length,
      });
    }
    await writeJsonFile(dir, 'index.json', index);
  }

  async deleteChat(id: string): Promise<void> {
    const dir = await getChatsDirectory();
    if (!dir) return;

    try {
      await dir.removeEntry(`${id}.json`);
    } catch {
      // Ignore if file doesn't exist
    }

    let index = await readJsonFile<ChatMeta[]>(dir, 'index.json', []);
    index = index.filter((m) => m.id !== id);
    await writeJsonFile(dir, 'index.json', index);
  }
}
