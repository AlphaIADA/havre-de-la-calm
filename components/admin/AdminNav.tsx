'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/cn';

const links = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/properties', label: 'Properties' },
  { href: '/admin/units', label: 'Units' },
  { href: '/admin/availability', label: 'Availability' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/discounts', label: 'Discounts' },
  { href: '/admin/kyc', label: 'KYC' },
  { href: '/admin/messages', label: 'Messages' },
  { href: '/admin/blog/comments', label: 'Comments' },
  { href: '/admin/blog', label: 'Blog' },
  { href: '/admin/email', label: 'Email' },
];

export function AdminNav() {
  const pathname = usePathname();

  const activeHref = links.reduce<string | null>((best, l) => {
    const isExact = Boolean(l.exact);
    const match =
      isExact ? pathname === l.href : pathname === l.href || pathname.startsWith(`${l.href}/`);
    if (!match) return best;
    if (!best) return l.href;
    return l.href.length > best.length ? l.href : best;
  }, null);

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={activeHref === l.href ? 'page' : undefined}
          className={cn(
            'rounded-xl border px-3 py-2 text-xs font-medium transition',
            activeHref === l.href
              ? 'border-zinc-900 bg-zinc-900 text-white'
              : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-900',
          )}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
