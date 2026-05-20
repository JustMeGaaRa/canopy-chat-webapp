import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Chat, ChatMeta, ChatRepository } from './types';

const BASE_DIR = path.join(os.homedir(), '.canopy');
const CHATS_DIR = path.join(BASE_DIR, 'chats');
const INDEX_FILE = path.join(CHATS_DIR, 'index.json');

async function ensureDirectories() {
  await fs.mkdir(CHATS_DIR, { recursive: true });
  try {
    await fs.access(INDEX_FILE);
  } catch {
    await fs.writeFile(INDEX_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export class LocalFileChatRepository implements ChatRepository {
  async listChats(): Promise<ChatMeta[]> {
    await ensureDirectories();
    const data = await fs.readFile(INDEX_FILE, 'utf-8');
    const list = JSON.parse(data) as ChatMeta[];
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getChat(id: string): Promise<Chat | null> {
    await ensureDirectories();
    const filePath = path.join(CHATS_DIR, `${id}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as Chat;
    } catch {
      return null;
    }
  }

  async createChat(chat: Chat): Promise<void> {
    await ensureDirectories();
    const filePath = path.join(CHATS_DIR, `${chat.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(chat, null, 2), 'utf-8');

    const indexData = await fs.readFile(INDEX_FILE, 'utf-8');
    const index = JSON.parse(indexData) as ChatMeta[];
    const meta: ChatMeta = {
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      nodeCount: chat.nodes.length,
    };
    index.push(meta);
    await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
  }

  async updateChat(id: string, update: Partial<Chat>): Promise<void> {
    await ensureDirectories();
    const chat = await this.getChat(id);
    if (!chat) {
      throw new Error(`Chat with id ${id} not found`);
    }

    const updatedChat: Chat = {
      ...chat,
      ...update,
      updatedAt: new Date().toISOString(),
    };

    const filePath = path.join(CHATS_DIR, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(updatedChat, null, 2), 'utf-8');

    const indexData = await fs.readFile(INDEX_FILE, 'utf-8');
    const index = JSON.parse(indexData) as ChatMeta[];
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
    await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
  }

  async deleteChat(id: string): Promise<void> {
    await ensureDirectories();
    const filePath = path.join(CHATS_DIR, `${id}.json`);
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }

    const indexData = await fs.readFile(INDEX_FILE, 'utf-8');
    let index = JSON.parse(indexData) as ChatMeta[];
    index = index.filter((m) => m.id !== id);
    await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
  }
}
