import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import {
  SESSION_COOKIE,
  createSession,
  ensureAuthTables,
  getCurrentUser,
  setSessionCookie,
} from '@/lib/auth';

// GET: who is signed in, and whether the first account still needs to be created
export async function GET(request: NextRequest) {
  try {
    await ensureAuthTables();
    const user = await getCurrentUser(request);
    const userCount = await db.user.count();
    return NextResponse.json({ user, needsSetup: userCount === 0 });
  } catch (error: any) {
    console.error('Auth status error:', error);
    return NextResponse.json({ error: 'Auth unavailable' }, { status: 500 });
  }
}

// POST: { action: 'setup' | 'login' | 'logout', name?, email?, password? }
export async function POST(request: NextRequest) {
  try {
    await ensureAuthTables();
    const body = await request.json().catch(() => ({}));
    const action = body.action;

    if (action === 'logout') {
      const token = request.cookies.get(SESSION_COOKIE)?.value;
      if (token) await db.session.deleteMany({ where: { sessionToken: token } });
      const res = NextResponse.json({ ok: true });
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }

    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (action === 'setup') {
      // Only allowed while there are no accounts at all: the first person becomes the admin.
      const userCount = await db.user.count();
      if (userCount > 0) {
        return NextResponse.json({ error: 'Setup is already done. Please sign in.' }, { status: 403 });
      }
      if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }
      const user = await db.user.create({
        data: {
          name: String(body.name || 'Farm Owner').trim(),
          email,
          password: await bcrypt.hash(password, 10),
          role: 'admin',
          lastLogin: new Date(),
        },
      });
      const { token, expires } = await createSession(user.id);
      const res = NextResponse.json({ ok: true });
      setSessionCookie(res, token, expires);
      return res;
    }

    if (action === 'login') {
      const user = await db.user.findUnique({ where: { email } });
      const ok = user && user.isActive && (await bcrypt.compare(password, user.password));
      if (!ok) {
        await new Promise((r) => setTimeout(r, 800)); // slow down guessing
        return NextResponse.json({ error: 'Wrong email or password' }, { status: 401 });
      }
      await db.user.update({ where: { id: user!.id }, data: { lastLogin: new Date() } });
      const { token, expires } = await createSession(user!.id);
      const res = NextResponse.json({ ok: true });
      setSessionCookie(res, token, expires);
      return res;
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Sign-in failed' }, { status: 500 });
  }
}
