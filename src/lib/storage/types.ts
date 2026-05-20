export interface ChatNode {
  id: string; // uuid
  parentId: string | null;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string; // ISO timestamp
}

export interface Chat {
  id: string; // uuid
  title: string; // derived from first user message (first 60 chars)
  createdAt: string;
  updatedAt: string;
  nodes: ChatNode[]; // flat array; tree is reconstructed via parentId
  selectedNodeId: string | null; // persisted last-selected node
}

export interface ChatMeta {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
}

export interface ChatRepository {
  listChats(): Promise<ChatMeta[]>;
  getChat(id: string): Promise<Chat | null>;
  createChat(chat: Chat): Promise<void>;
  updateChat(id: string, update: Partial<Chat>): Promise<void>;
  deleteChat(id: string): Promise<void>;
}
