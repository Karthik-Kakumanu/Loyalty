"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Home, 
  CalendarDays, 
  CreditCard, 
  Star, 
  Settings, 
  LogOut, 
  User 
} from "lucide-react";
import { motion } from "framer-motion";
import { logoutUser } from "@/actions/auth";

const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: CalendarDays, label: "Reserve", href: "/dashboard/reserve" },
  { icon: CreditCard, label: "My Cards", href: "/dashboard/cards" },
  { icon: Star, label: "Loyalty", href: "/dashboard/loyalty" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-zinc-200 bg-white h-full hidden md:flex flex-col fixed left-0 top-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      
      {/* --- LOGO AREA --- */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 bg-[#C72C48] rounded-xl flex items-center justify-center shadow-md shadow-red-200">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-zinc-900">Revistra</span>
        </div>

        {/* --- NAVIGATION --- */}
        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link key={item.href} href={item.href} className="block relative group">
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-[#C72C48]/5 rounded-xl border border-[#C72C48]/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                  isActive 
                    ? "text-[#C72C48]" 
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                }`}>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C72C48]" />}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* --- FOOTER ACTIONS --- */}
      <div className="mt-auto p-4 border-t border-zinc-100 space-y-2">
        
        {/* Settings Link */}
        <Link 
          href="/dashboard/settings" 
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-500 hover:text-zinc-900 rounded-xl hover:bg-zinc-50 transition-colors"
        >
          <Settings size={18} />
          <span>Settings</span>
        </Link>

        {/* Logout Button */}
        <button 
          onClick={() => logoutUser()}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Sign Out</span>
        </button>

        {/* Mini Profile (Optional Visual) */}
        <div className="pt-4 mt-2 border-t border-zinc-50 flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
             <User size={14} />
          </div>
          <div className="flex-1 min-w-0">
             <p className="text-xs font-bold text-zinc-900 truncate">My Account</p>
             <p className="text-[10px] text-zinc-400 truncate">Manage Profile</p>
          </div>
        </div>

      </div>
    </aside>
  );
}