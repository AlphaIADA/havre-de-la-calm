import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200/70 bg-white">
      <div className="container-px grid gap-8 py-10 md:grid-cols-4">
        <div className="space-y-2">
          <div className="text-sm font-semibold">OTA Apartments</div>
          <p className="text-sm text-zinc-600">
            Short-stay serviced apartments in Ota & Sango-Ota. Comfort, security, and a smooth booking
            experience.
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Explore</div>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/properties" className="text-zinc-600 hover:text-zinc-900">
                Properties
              </Link>
            </li>
            <li>
              <Link href="/blog" className="text-zinc-600 hover:text-zinc-900">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-zinc-600 hover:text-zinc-900">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Legal</div>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/privacy" className="text-zinc-600 hover:text-zinc-900">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-zinc-600 hover:text-zinc-900">
                Terms
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Contact</div>
          <div className="text-sm text-zinc-600">
            <div>+234 816 926 7198</div>
            <div>hdlc.bookings@gmail.com</div>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-200/70 py-6">
        <div className="container-px flex flex-col gap-2 text-xs text-zinc-500 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} OTA Apartments. All rights reserved.</div>
          <div>Pay now or pay later. Secure KYC review for confirmations.</div>
        </div>
      </div>
    </footer>
  );
}

