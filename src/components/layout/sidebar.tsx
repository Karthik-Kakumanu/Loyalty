"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutGrid, Users, CreditCard, Settings, PieChart, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { icon: LayoutGrid, label: "Overview", href: "/dashboard" },
  { icon: PieChart, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Users, label: "Customers", href: "/dashboard/customers" },
  { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-zinc-200 bg-white h-full hidden md:flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 bg-[#C72C48] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-lg tracking-tight">SaaS App</span>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="block relative">
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-zinc-100 rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                <div className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium",
                  isActive ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                )}>
                  <item.icon size={18} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-zinc-100">
        <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-900 rounded-xl hover:bg-zinc-50 transition-colors">
          <Settings size={18} />
          Settings
        </Link>
         <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors">
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}