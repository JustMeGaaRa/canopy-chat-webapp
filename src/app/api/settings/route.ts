import { NextResponse } from 'next/server';
import { getSettings, saveSettings, AppSettings } from '@/lib/settings';

function checkHasKey(settings: AppSettings) {
  const providerId = settings.providerId || 'claude';
  const envKeys = {
    claude: !!(process.env.ANTHROPIC_API_KEY || '').trim(),
    openai: !!(process.env.OPENAI_API_KEY || '').trim(),
    gemini: !!(process.env.GEMINI_API_KEY || '').trim(),
  };

  const savedKey = (settings.providerKeys?.[providerId] || '').trim();
  let hasKey = !!savedKey || envKeys[providerId as keyof typeof envKeys];

  // Legacy fallback for Claude providerApiKey
  if (providerId === 'claude' && !hasKey) {
    hasKey = !!(settings.providerApiKey || '').trim();
  }

  return { hasKey, envKeys };
}

export async function GET() {
  const settings = await getSettings();
  const { hasKey, envKeys } = checkHasKey(settings);
  return NextResponse.json({ settings, hasKey, envKeys });
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as AppSettings;
    await saveSettings(body);
    const { hasKey, envKeys } = checkHasKey(body);
    return NextResponse.json({ settings: body, hasKey, envKeys });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 }
    );
  }
}
