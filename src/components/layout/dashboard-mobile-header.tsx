"use client";

import Image from "next/image";
import { User } from "lucide-react";

type DashboardMobileHeaderProps = {
  onOpenSettings: () => void;
};

export function DashboardMobileHeader({
  onOpenSettings,
}: DashboardMobileHeaderProps) {
  return (
    <header className="md:hidden fixed inset-x-0 top-0 z-40 border-b border-zinc-200/90 bg-white/95 backdrop-blur-xl pt-safe shadow-[0_12px_28px_-20px_rgba(15,23,42,0.4)]">
      <div className="relative mx-auto flex h-[74px] w-full max-w-7xl items-center justify-between px-4 sm:px-5">
        <Image
          src="/logo.jpg"
          alt="Revistra"
          width={4320}
          height={1728}
          priority
          sizes="(max-width: 640px) 54vw, 300px"
          className="h-10 w-auto max-w-[58vw] object-contain"
        />

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open account settings"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition duration-200 hover:bg-zinc-50 active:scale-95"
        >
          <User size={18} />
        </button>
      </div>
    </header>
  );
}
