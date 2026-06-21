import { NextRequest, NextResponse } from 'next/server';
import { setAgentState, getAgentState } from '@/lib/db';

export async function GET() {
  try {
    const settings = getAgentState('agent-settings');
    return NextResponse.json(JSON.parse(settings || '{}'));
  } catch (error) {
    return NextResponse.json({});
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    setAgentState('agent-settings', JSON.stringify(data));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
