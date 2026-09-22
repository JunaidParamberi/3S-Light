'use client';

import { signIn } from 'next-auth/react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

function LoginForm() {
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', {
      employeeId,
      pin,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError('Incorrect Employee ID or PIN');
      return;
    }
    router.push(params.get('callbackUrl') || '/');
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-12 w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm"
    >
      <h1 className="mb-1 text-xl font-bold">Welcome back</h1>
      <p className="mb-5 text-sm text-gray-500">
        Sign in with your Employee ID and PIN.
      </p>

      <label className="mb-1 block text-sm font-medium">Employee ID</label>
      <input
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
        placeholder="e.g. EMP-042"
        autoComplete="username"
        autoCapitalize="characters"
        required
        className="mb-4 w-full rounded-lg border px-3 py-3 text-base outline-none focus:border-blue-500"
      />

      <label className="mb-1 block text-sm font-medium">PIN</label>
      <input
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        placeholder="••••"
        required
        className="w-full rounded-lg border px-3 py-3 text-base tracking-widest outline-none focus:border-blue-500"
      />

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
