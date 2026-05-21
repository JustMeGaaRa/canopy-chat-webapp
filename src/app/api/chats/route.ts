import { NextResponse } from 'next/server';
import { getChatRepository } from '@/lib/storage';

export async function GET() {
  try {
    const repo = getChatRepository();
    const chats = await repo.listChats();
    return NextResponse.json({ chats });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const repo = getChatRepository();
    const chat = await request.json();
    await repo.createChat(chat);
    return NextResponse.json({ success: true, chat });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
