import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/settings';

export async function GET() {
  const settings = await getSettings();
  const hasKey = !!(process.env.ANTHROPIC_API_KEY || settings.providerApiKey);
  return NextResponse.json({ settings, hasKey });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    await saveSettings(body);
    const hasKey = !!(process.env.ANTHROPIC_API_KEY || body.providerApiKey);
    return NextResponse.json({ settings: body, hasKey });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
