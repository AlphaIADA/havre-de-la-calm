import Link from 'next/link';

import { Button } from '@/components/ui/Button';

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200/70 bg-white/80 backdrop-blur">
      <div className="container-px flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-sm font-semibold text-white">
            OTA
          </span>
          <span className="text-sm font-semibold tracking-tight">OTA Apartments</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/properties" className="text-zinc-700 hover:text-zinc-900">
            Properties
          </Link>
          <Link href="/blog" className="text-zinc-700 hover:text-zinc-900">
            Blog
          </Link>
          <Link href="/ota" className="text-zinc-700 hover:text-zinc-900">
            Ota
          </Link>
          <Link href="/sango-ota" className="text-zinc-700 hover:text-zinc-900">
            Sango-Ota
          </Link>
          <Link href="/contact" className="text-zinc-700 hover:text-zinc-900">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/properties" className="hidden sm:block">
            <Button>Book a stay</Button>
          </Link>
          <Link href="/admin" className="hidden sm:block">
            <Button variant="secondary">Admin</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

