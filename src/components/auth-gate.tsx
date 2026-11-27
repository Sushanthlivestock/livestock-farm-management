'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Status = 'loading' | 'signed-in' | 'login' | 'setup' | 'error';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const check = async () => {
    try {
      const res = await fetch('/api/auth', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(data.user ? 'signed-in' : data.needsSetup ? 'setup' : 'login');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    check();
    // If a session expires mid-use, any API call returning 401 sends the user back to sign-in.
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof URL ? args[0].href : args[0].url;
      if (res.status === 401 && url.includes('/api/') && !url.includes('/api/auth')) {
        setStatus('login');
      }
      return res;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: status === 'setup' ? 'setup' : 'login', name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sign-in failed');
      setPassword('');
      setStatus('signed-in');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    setStatus('login');
  };

  if (status === 'signed-in') {
    return (
      <>
        {children}
        <button
          onClick={logout}
          className="fixed bottom-4 right-4 z-50 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-gray-700 shadow-lg border hover:bg-gray-50"
        >
          Sign out
        </button>
      </>
    );
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-gray-600">
        <p>Can't reach the server right now.</p>
        <Button onClick={check}>Try again</Button>
      </div>
    );
  }

  const isSetup = status === 'setup';
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader>
          <CardTitle>{isSetup ? 'Create the owner account' : 'Sign in'}</CardTitle>
          <CardDescription>
            {isSetup
              ? 'First time here. This account will be the farm admin.'
              : 'Livestock Farm Management'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {isSetup && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={isSetup ? 'new-password' : 'current-password'}
                required
                minLength={isSetup ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Please wait…' : isSetup ? 'Create account' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
