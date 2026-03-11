import Link from 'next/link';

const links = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/properties', label: 'Properties' },
  { href: '/admin/units', label: 'Units' },
  { href: '/admin/availability', label: 'Availability' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/discounts', label: 'Discounts' },
  { href: '/admin/kyc', label: 'KYC' },
  { href: '/admin/messages', label: 'Messages' },
  { href: '/admin/blog', label: 'Blog' },
  { href: '/admin/blog/comments', label: 'Comments' },
  { href: '/admin/email', label: 'Email' },
];

export function AdminNav() {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
