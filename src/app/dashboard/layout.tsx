"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Home, 
  CalendarDays, 
  ScanLine, 
  CreditCard, 
  Star, 
  User, 
  Settings,
  LogOut,
  Menu // Added for potential mobile drawer if needed later
} from "lucide-react";
import { Scanner } from "@/components/dashboard/scanner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter(); 
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Navigation Data
  const TABS = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Reserve", href: "/dashboard/reserve", icon: CalendarDays },
    { name: "Scan", href: "#scan", icon: ScanLine, isSpecial: true }, // Special Trigger
    { name: "Cards", href: "/dashboard/cards", icon: CreditCard },
    { name: "Loyalty", href: "/dashboard/loyalty", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-zinc-900 flex flex-col md:flex-row">
      
      {/* ==================================================================
          DESKTOP SIDEBAR (Visible on Tablet/Desktop, Hidden on Mobile)
         ================================================================== */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-zinc-200 fixed inset-y-0 left-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        
        {/* Logo Area */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C72C48] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md shadow-red-200">
            L
          </div>
          <span className="font-bold text-xl tracking-tight text-zinc-900">LoyaltyApp</span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {TABS.map((tab) => {
            if (tab.isSpecial) return null; // Skip Scan button in sidebar list (we use a special one if needed)

            const isActive = pathname === tab.href;
            
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                  isActive 
                    ? "bg-[#C72C48]/5 text-[#C72C48]" 
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <div className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                   <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span>{tab.name}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C72C48]" />}
              </Link>
            );
          })}
          
          {/* Desktop Scan Button (Optional, if you want it in sidebar) */}
          <button
             onClick={() => setIsScannerOpen(true)}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-zinc-600 hover:bg-zinc-50 hover:text-[#C72C48] group mt-2"
          >
             <div className="p-1 group-hover:bg-[#C72C48]/10 rounded-lg transition-colors">
                <ScanLine size={20} />
             </div>
             <span>Scan QR</span>
          </button>
        </nav>

        {/* Desktop User Profile Section (Bottom of Sidebar) */}
        <div className="p-4 border-t border-zinc-100 bg-white">
          <button 
            onClick={() => router.push("/dashboard/settings")}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer group text-left border border-transparent hover:border-zinc-200"
          >
            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 border border-zinc-200 group-hover:border-[#C72C48]/30 transition-colors shrink-0">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-zinc-900 truncate">My Account</p>
              <p className="text-xs text-zinc-500 truncate">Settings & Profile</p>
            </div>
            <Settings size={16} className="text-zinc-400 group-hover:text-zinc-600 shrink-0" />
          </button>
        </div>
      </aside>


      {/* ==================================================================
          MAIN CONTENT WRAPPER
         ================================================================== */}
      <div className="flex-1 flex flex-col min-h-screen relative w-full md:pl-64 transition-all duration-300">
        
        {/* --- MOBILE HEADER (Sticky Top - Hidden on Desktop) --- */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-16 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200 px-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#C72C48] rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-red-200">L</div>
            <span className="font-bold text-lg tracking-tight text-zinc-900">Revistra</span>
          </div>
          
          {/* Mobile Profile Button */}
          <button 
            onClick={() => router.push("/dashboard/settings")}
            className="w-9 h-9 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-600 border border-zinc-200 active:scale-95 transition-transform hover:bg-zinc-100"
          >
            <User size={18} />
          </button>
        </header>

        {/* --- PAGE CONTENT INJECTION --- */}
        {/* Mobile: pt-20 (header space) + pb-32 (nav space)
            Desktop: pt-8 + px-8 (standard dashboard spacing)
        */}
        <main className="flex-1 w-full max-w-7xl mx-auto pt-20 px-0 pb-32 md:pt-8 md:px-8 md:pb-12">
          {children}
        </main>

        {/* --- MOBILE BOTTOM NAVIGATION (Sticky Bottom - Hidden on Desktop) --- */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 z-50 h-[80px] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex items-end justify-between h-full pb-3 px-6 relative max-w-md mx-auto w-full">
            
            {TABS.map((tab) => {
              const isActive = pathname === tab.href;
              
              // Mobile Floating Scanner Button Logic
              if (tab.isSpecial) {
                return (
                  <div key="scan" className="relative -top-8 flex justify-center w-[20%]">
                    <button 
                      onClick={() => setIsScannerOpen(true)}
                      className="w-14 h-14 bg-[#C72C48] rounded-full flex items-center justify-center text-white shadow-[0_8px_20px_rgba(199,44,72,0.4)] border-[4px] border-white active:scale-90 transition-transform hover:bg-[#A61F38] ring-1 ring-zinc-100"
                    >
                      <ScanLine size={24} strokeWidth={2.5} />
                    </button>
                  </div>
                );
              }

              // Standard Mobile Nav Items
              return (
                <button 
                  key={tab.name} 
                  onClick={() => router.push(tab.href)}
                  className={`flex flex-col items-center justify-end gap-1 w-[20%] h-full pb-1 transition-all duration-300 group active:scale-95 ${isActive ? "text-[#C72C48]" : "text-zinc-400 hover:text-zinc-600"}`}
                >
                  <div className={`transition-transform duration-300 ${isActive ? "-translate-y-1" : "group-hover:-translate-y-1"}`}>
                    <tab.icon 
                      size={22} 
                      strokeWidth={isActive ? 2.5 : 2} 
                    />
                  </div>
                  <span className={`text-[10px] font-medium tracking-wide transition-opacity duration-300 ${isActive ? "opacity-100 font-bold" : "opacity-80"}`}>
                    {tab.name}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

      </div>

      {/* --- GLOBAL SCANNER OVERLAY (Works on Mobile & Desktop) --- */}
      <Scanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={(data) => {
          console.log("Scanned:", data);
          // Scanner component handles the logic, but we close it here visually
          setIsScannerOpen(false);
        }} 
      />

    </div>
  );
}