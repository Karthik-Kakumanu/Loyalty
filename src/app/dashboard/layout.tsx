// file: src/app/dashboard/layout.tsx
"use client";

import { useCallback, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  CalendarDays,
  ScanLine,
  CreditCard,
  Star,
  User,
  Settings
} from "lucide-react";
import { Scanner } from "@/components/dashboard/scanner";
import { DashboardMobileHeader } from "@/components/layout/dashboard-mobile-header";

type TabConfig = {
  name: string;
  href: string;
  icon: typeof Home;
  isSpecial?: boolean;
};

const TABS: TabConfig[] = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Reserve", href: "/dashboard/reserve", icon: CalendarDays },
  { name: "Scan", href: "#scan", icon: ScanLine, isSpecial: true },
  { name: "Cards", href: "/dashboard/cards", icon: CreditCard },
  { name: "Loyalty", href: "/dashboard/loyalty", icon: Star }
];

export default function DashboardLayout(props: { children: React.ReactNode }) {
  const { children } = props;
  const pathname = usePathname();
  const router = useRouter();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerSession, setScannerSession] = useState(0);

  const openScanner = useCallback(() => {
    setScannerSession((current) => current + 1);
    setIsScannerOpen(true);
  }, []);
  const closeScanner = useCallback(() => setIsScannerOpen(false), []);
  const openSettings = useCallback(
    () => router.push("/dashboard/settings"),
    [router]
  );
  const navigateTo = useCallback(
    (href: string) => router.push(href),
    [router]
  );
  const handleScan = useCallback(
    (data: string) => {
      void data;
      closeScanner();
    },
    [closeScanner]
  );

  return (
    <div className="flex min-h-dvh flex-col bg-[#F8F9FA] font-sans text-zinc-900 md:flex-row">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-zinc-200 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] md:flex">
        <div className="flex items-center gap-3 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C72C48] text-xl font-bold text-white shadow-md shadow-red-200">
            L
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900">
            Revistra
          </span>
        </div>

        <nav className="mt-4 flex-1 space-y-2 overflow-y-auto px-4">
          {TABS.map((tab) => {
            if (tab.isSpecial) return null;
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#C72C48]/5 text-[#C72C48]"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <div
                  className={`transition-transform duration-300 ${
                    isActive ? "scale-110" : "group-hover:scale-110"
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span>{tab.name}</span>
                {isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#C72C48]" />
                )}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={openScanner}
            className="group mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 transition-all duration-200 hover:bg-zinc-50 hover:text-[#C72C48]"
          >
            <div className="rounded-lg p-1 transition-colors group-hover:bg-[#C72C48]/10">
              <ScanLine size={20} />
            </div>
            <span>Scan QR</span>
          </button>
        </nav>

        <div className="bg-white p-4">
          <button
            type="button"
            onClick={openSettings}
            className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent p-3 text-left transition-colors hover:border-zinc-200 hover:bg-zinc-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-zinc-500 transition-colors group-hover:border-[#C72C48]/30">
              <User size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-zinc-900">
                My Account
              </p>
              <p className="truncate text-xs text-zinc-500">
                Settings &amp; Profile
              </p>
            </div>
            <Settings
              size={16}
              className="shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-600"
            />
          </button>
        </div>
      </aside>

      <div className="relative flex min-h-dvh w-full flex-1 flex-col md:pl-64 transition-all duration-300">
        <DashboardMobileHeader onOpenSettings={openSettings} />

        <main className="mx-auto w-full max-w-7xl flex-1 px-0 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(74px+env(safe-area-inset-top)+0.25rem)] md:px-8 md:pb-10 md:pt-8">
          {children}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden">
          <div className="mx-auto w-full max-w-md px-4 pb-safe">
            <div className="relative h-[82px] rounded-t-[22px] border border-zinc-200 bg-white shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
              <button
                type="button"
                onClick={openScanner}
                aria-label="Open scanner"
                className="absolute left-1/2 top-0 z-20 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-[4px] border-white bg-[#C72C48] text-white shadow-[0_10px_24px_rgba(199,44,72,0.45)] transition-transform hover:bg-[#A61F38] active:scale-95"
              >
                <ScanLine size={24} strokeWidth={2.5} className="mx-auto" />
              </button>

              <div className="grid h-full grid-cols-5 items-end px-2 pb-3">
                {TABS.map((tab) => {
                  if (tab.isSpecial) {
                    return <div key="scan-space" />;
                  }

                  const isActive = pathname === tab.href;
                  const Icon = tab.icon;

                  return (
                    <button
                      key={tab.name}
                      type="button"
                      onClick={() => navigateTo(tab.href)}
                      aria-label={`Navigate to ${tab.name}`}
                      className={`mx-auto flex min-h-[44px] w-full max-w-[72px] flex-col items-center justify-end gap-1 rounded-xl pb-0.5 text-[11px] font-medium tracking-wide transition-colors ${
                        isActive ? "text-[#C72C48]" : "text-zinc-400 hover:text-zinc-600"
                      }`}
                    >
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                      <span className={isActive ? "font-bold" : ""}>{tab.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>
      </div>

      <Scanner
        key={scannerSession}
        isOpen={isScannerOpen}
        onClose={closeScanner}
        onScan={handleScan}
      />
    </div>
  );
}
