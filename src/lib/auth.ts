import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { db } from '@/lib/db';

export const SESSION_COOKIE = 'farm_session';
const SESSION_DAYS = 30;

let tablesReady = false;

// Make sure the User and Session tables exist (the Vercel build skips `prisma db push`).
export async function ensureAuthTables() {
  if (tablesReady) return;
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT UNIQUE NOT NULL,
      "password" TEXT NOT NULL,
      "role" TEXT DEFAULT 'user',
      "phone" TEXT,
      "avatar" TEXT,
      "isActive" BOOLEAN DEFAULT true,
      "lastLogin" TIMESTAMP,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );
  `);
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Session" (
      "id" TEXT PRIMARY KEY,
      "sessionToken" TEXT UNIQUE NOT NULL,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "expires" TIMESTAMP NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW()
    );
  `);
  tablesReady = true;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { sessionToken: token, userId, expires } });
  return { token, expires };
}

export function setSessionCookie(res: NextResponse, token: string, expires: Date) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  });
}

export async function getCurrentUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    await ensureAuthTables();
    const session = await db.session.findUnique({
      where: { sessionToken: token },
      include: { user: true },
    });
    if (!session || session.expires < new Date() || !session.user.isActive) return null;
    const { password, ...user } = session.user;
    return user;
  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
}

// Use at the top of every API handler: returns a 401 response when not signed in.
export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
  }
  return null;
}
