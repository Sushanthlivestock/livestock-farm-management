import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

const NOTIFICATION_SERVICE_URL = 'http://localhost:3002';

export async function POST(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { type, title, message, data } = body;

    let endpoint = `${NOTIFICATION_SERVICE_URL}/api/send-alert`;
    
    if (type === 'test') {
      endpoint = `${NOTIFICATION_SERVICE_URL}/api/send-test`;
    } else if (type === 'daily-summary') {
      endpoint = `${NOTIFICATION_SERVICE_URL}/api/daily-summary`;
    } else if (type === 'animal-alert') {
      endpoint = `${NOTIFICATION_SERVICE_URL}/api/animal-alert`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(type === 'test' ? {} : type === 'daily-summary' ? data : { title, message, ...data }),
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
