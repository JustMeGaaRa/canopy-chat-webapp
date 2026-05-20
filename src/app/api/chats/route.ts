import { NextResponse } from 'next/server';
import { getChatRepository } from '@/lib/storage';

export async function GET() {
  try {
    const repo = getChatRepository();
    const chats = await repo.listChats();
    return NextResponse.json({ chats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const repo = getChatRepository();
    const chat = await request.json();
    await repo.createChat(chat);
    return NextResponse.json({ success: true, chat });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
