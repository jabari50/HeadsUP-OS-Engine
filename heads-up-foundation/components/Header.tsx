"use client";

import Link from "next/link";
import { useState } from "react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/events", label: "Events" },
  { href: "/get-involved", label: "Get Involved" },
  { href: "/media", label: "Media" },
  { href: "/pro-file-os", label: "PRO-File OS" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-headline text-2xl tracking-headline text-white">
            HEADS UP!
          </span>
          <span className="font-body text-[10px] font-semibold uppercase tracking-wide2 text-teal">
            Foundation
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-body text-xs font-semibold uppercase tracking-wide2 text-white/80 transition-colors hover:text-teal"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="font-body text-xs font-semibold uppercase tracking-wide2 text-warmgray transition-colors hover:text-teal"
          >
            Log In
          </Link>
          <Link
            href="/donate"
            className="bg-teal px-5 py-2.5 font-body text-xs font-bold uppercase tracking-wide2 text-navy transition-colors hover:bg-white"
          >
            Donate
          </Link>
        </nav>

        <button
          className="lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <div className="space-y-1.5">
            <span className="block h-0.5 w-6 bg-teal" />
            <span className="block h-0.5 w-6 bg-white" />
            <span className="block h-0.5 w-4 bg-white" />
          </div>
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/10 bg-navy-deep px-5 py-6 lg:hidden">
          <div className="flex flex-col gap-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="font-body text-sm font-semibold uppercase tracking-wide2 text-white/80"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="font-body text-sm font-semibold uppercase tracking-wide2 text-warmgray"
            >
              Log In
            </Link>
            <Link
              href="/donate"
              onClick={() => setOpen(false)}
              className="mt-2 inline-block w-max bg-teal px-6 py-3 font-body text-sm font-bold uppercase tracking-wide2 text-navy"
            >
              Donate
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
