import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

const NOTIFICATION_SERVICE_URL = 'http://localhost:3002';

export async function GET(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;

  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/settings`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json({ error: 'Notification service unavailable' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
