import Link from 'next/link';

import { AdminNav } from '@/components/admin/AdminNav';
import { AdminLogoutButton } from '@/components/admin/AdminLogoutButton';
import { requireStaff } from '@/lib/auth/rbac';
import { isDbConfigured } from '@/lib/env';

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStaff();
  const dbReady = isDbConfigured();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold text-zinc-500">OTA Apartments</div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
          <div className="mt-1 text-xs text-zinc-500">
            {session.email} • {session.role}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
          >
            Public site
          </Link>
          <AdminLogoutButton />
        </div>
      </div>

      <AdminNav />
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        {dbReady ? (
          children
        ) : (
          <div className="space-y-2">
            <h2 className="text-base font-semibold">Database not configured</h2>
            <p className="text-sm text-zinc-600">
              Set <span className="font-medium">DATABASE_URL</span> and run migrations to enable admin
              features.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
