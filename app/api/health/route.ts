import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Stock Anomaly Detector API is running',
    timestamp: new Date().toISOString()
  });
}

export const dynamic = 'force-dynamic';
