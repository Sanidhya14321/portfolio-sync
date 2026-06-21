import { NextResponse } from 'next/server';
import { runDailySync } from '@/lib/sync-manager';

export async function POST() {
  try {
    const results = await runDailySync();
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
