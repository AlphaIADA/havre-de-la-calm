'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function AdminLogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const onLogout = () => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/logout', { method: 'POST' });
        if (!res.ok) throw new Error('Logout failed');
        toast.success('Signed out');
        router.push('/admin/login');
        router.refresh();
      } catch (err) {
        toast.error('Could not sign out', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={pending}
      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-60"
    >
      {pending ? 'Signing out…' : 'Logout'}
    </button>
  );
}

