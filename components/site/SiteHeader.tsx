'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Menu, X } from 'lucide-react';

import { BookingLookupForm } from '@/components/booking/BookingLookupForm';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const links = [
  { href: '/properties', label: 'Properties', match: ['/properties', '/stay', '/book'] },
  { href: '/blog', label: 'Blog', match: ['/blog'] },
  { href: '/ota', label: 'Ota', match: ['/ota'] },
  { href: '/sango-ota', label: 'Sango-Ota', match: ['/sango-ota'] },
  { href: '/contact', label: 'Contact', match: ['/contact'] },
];

function isActive(pathname: string, match: string[]) {
  return match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [lookupOpen, setLookupOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const overlayOpen = mobileOpen || lookupOpen;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setMobileOpen(false);
    setLookupOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!overlayOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setLookupOpen(false);
      setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [overlayOpen]);

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
          {links.map((l) => {
            const active = isActive(pathname, l.match);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'transition hover:text-zinc-900',
                  active ? 'font-semibold text-zinc-900' : 'text-zinc-700',
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLookupOpen(true)}
            className="hidden rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 sm:inline-flex"
          >
            My booking
          </button>
          <Link href="/properties" className="hidden sm:block">
            <Button>Book a stay</Button>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mounted && mobileOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] bg-black/30 p-4 md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden={!mobileOpen}
            >
              <div
                className="mx-auto w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-5 shadow-lg"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">Menu</div>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 grid gap-2">
                  {links.map((l) => {
                    const active = isActive(pathname, l.match);
                    return (
                      <Link
                        key={l.href}
                        href={l.href}
                        className={cn(
                          'rounded-2xl border px-4 py-3 text-sm font-medium',
                          active
                            ? 'border-zinc-900 bg-zinc-900 text-white'
                            : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300',
                        )}
                      >
                        {l.label}
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="text-sm font-semibold">Find your booking</div>
                  <div className="mt-3">
                    <BookingLookupForm onDone={() => setMobileOpen(false)} />
                  </div>
                </div>

                <div className="mt-4">
                  <Link href="/properties">
                    <Button className="w-full">Book a stay</Button>
                  </Link>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {mounted && lookupOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 p-4 sm:items-center"
              onClick={() => setLookupOpen(false)}
              aria-hidden={!lookupOpen}
            >
              <div
                className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-lg"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-base font-semibold">Find your booking</div>
                    <div className="mt-1 text-xs text-zinc-500">Open your guest portal using a booking code.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLookupOpen(false)}
                    className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4">
                  <BookingLookupForm onDone={() => setLookupOpen(false)} />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
