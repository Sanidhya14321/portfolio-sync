import { NextResponse } from 'next/server';
import { getSyncLogs } from '@/lib/db';

export async function GET() {
  try {
    const logs = getSyncLogs();
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
