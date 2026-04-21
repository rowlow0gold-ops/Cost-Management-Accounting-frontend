"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getSession, hasRole, Session } from "@/lib/auth";

const NAV: { href: string; label: string; need?: "ADMIN" | "MANAGER" | "USER" }[] = [
  { href: "/dashboard",  label: "대시보드" },
  { href: "/timesheet",  label: "공수입력" },
  { href: "/allocation", label: "원가배분",  need: "MANAGER" },
  { href: "/transfer",   label: "내부대체",  need: "MANAGER" },
  { href: "/variance",   label: "차이분석" },
  { href: "/masters",    label: "마스터",   need: "ADMIN" },
  { href: "/audit",      label: "감사로그", need: "ADMIN" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const s = getSession();
    if (!s && pathname !== "/login") router.replace("/login");
    setSession(s);
  }, [pathname, router]);

  // close mobile sidebar when route changes
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (!mounted) return null;
  if (pathname === "/login") return <>{children}</>;
  if (!session) return null;

  const visibleNav = NAV.filter(item => !item.need || hasRole(item.need));
  const currentTitle = NAV.find(n => pathname?.startsWith(n.href))?.label || "Home";

  return (
    <div className="md:flex md:items-start">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar: slide-in on mobile, sticky full-height on desktop */}
      <aside
        className={`fixed z-40 top-0 left-0 h-screen w-64 transform transition-transform
                    bg-slate-900 text-slate-100 flex flex-col
                    md:sticky md:top-0 md:translate-x-0 md:w-60 md:flex-shrink-0
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Cost & Management</div>
            <div className="font-bold text-sm flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-brand-600 text-white text-xs font-bold">$</span>
              원가/관리회계
            </div>
          </div>
          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >✕</button>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {visibleNav.map(item => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}
                className={`block px-5 py-2.5 text-sm ${active
                  ? "bg-slate-800 text-white border-l-2 border-brand-500"
                  : "text-slate-300 hover:bg-slate-800"}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-slate-800 text-xs">
          <div className="text-slate-300 truncate">{session.name}</div>
          <div className="text-slate-500 truncate">{session.email}</div>
          <div className="text-brand-500 mt-1">{session.role}</div>
          <button
            onClick={() => { clearSession(); router.replace("/login"); }}
            className="mt-3 w-full text-left text-slate-400 hover:text-white">
            로그아웃 →
          </button>
        </div>
      </aside>

      {/* Main column */}
      <main className="flex-1 min-w-0 min-h-screen">
        <header className="sticky top-0 z-20 bg-white border-b px-4 md:px-8 py-3 md:py-4
                           flex items-center gap-3">
          <button
            className="md:hidden p-1 -ml-1 text-slate-700"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="text-base md:text-lg font-semibold truncate">{currentTitle}</h1>
        </header>
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
