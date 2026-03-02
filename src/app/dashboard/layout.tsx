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

  const openScanner = useCallback(() => setIsScannerOpen(true), []);
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
      console.log("Scanned:", data);
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

        <main className="mx-auto flex w-full max-w-7xl flex-1 px-0 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+4.625rem)] md:px-8 md:pb-12 md:pt-8">
          {children}
        </main>

        <nav className="pb-safe fixed bottom-0 left-0 right-0 z-50 h-[80px] border-t border-zinc-100 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.03)] md:hidden">
          <div className="relative mx-auto flex h-full w-full max-w-md items-end justify-between px-6 pb-3">
            {TABS.map((tab) => {
              const isActive = pathname === tab.href;
              const Icon = tab.icon;

              if (tab.isSpecial) {
                return (
                  <div
                    key="scan"
                    className="relative -top-8 flex w-[20%] justify-center"
                  >
                    <button
                      type="button"
                      onClick={openScanner}
                      className="h-14 w-14 rounded-full border-[4px] border-white bg-[#C72C48] text-white ring-1 ring-zinc-100 shadow-[0_8px_20px_rgba(199,44,72,0.4)] transition-transform hover:bg-[#A61F38] active:scale-90"
                    >
                      <ScanLine size={24} strokeWidth={2.5} />
                    </button>
                  </div>
                );
              }

              return (
                <button
                  key={tab.name}
                  type="button"
                  onClick={() => navigateTo(tab.href)}
                  className={`flex h-full w-[20%] flex-col items-center justify-end gap-1 pb-1 text-[10px] font-medium tracking-wide transition-all duration-300 active:scale-95 ${
                    isActive
                      ? "text-[#C72C48]"
                      : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  <div
                    className={`transition-transform duration-300 ${
                      isActive ? "-translate-y-1" : "group-hover:-translate-y-1"
                    }`}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span
                    className={`transition-opacity duration-300 ${
                      isActive ? "font-bold opacity-100" : "opacity-80"
                    }`}
                  >
                    {tab.name}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <Scanner isOpen={isScannerOpen} onClose={closeScanner} onScan={handleScan} />
    </div>
  );
}
