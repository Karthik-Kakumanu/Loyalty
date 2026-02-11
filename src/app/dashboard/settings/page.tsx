"use client";

import { motion } from "framer-motion";
import { User, Bell, Shield, LogOut, ChevronRight, FileText, HelpCircle, Camera } from "lucide-react";
import { logoutUser } from "@/actions/auth";

// Menu configuration
const MENU_ITEMS = [
  { icon: User, label: "Edit Profile" },
  { icon: Bell, label: "Notifications" },
  { icon: Shield, label: "Privacy & Security" },
  { icon: FileText, label: "Terms & Conditions" },
  { icon: HelpCircle, label: "Help & Support" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-8 pb-24">
      {/* Title */}
      <motion.h1 
        initial={{ opacity: 0, x: -10 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="text-2xl font-bold text-zinc-900"
      >
        Account
      </motion.h1>

      {/* Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center"
      >
        <div className="relative">
          <div className="w-28 h-28 bg-zinc-100 rounded-full flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
             {/* Replace with <Image /> if available */}
             <span className="text-4xl font-bold text-zinc-300">K</span>
          </div>
          <button className="absolute bottom-0 right-0 bg-[#C72C48] p-2.5 rounded-full text-white shadow-lg border-2 border-white active:scale-95 transition-transform">
            <Camera size={16} />
          </button>
        </div>
        <h2 className="text-xl font-bold mt-4 text-zinc-900">Karthik</h2>
        <p className="text-zinc-500 text-sm font-medium">+91 88979 25715</p>
      </motion.div>

      {/* Settings Menu */}
      <div className="space-y-3">
        {MENU_ITEMS.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 + 0.1 }}
          >
            <button className="w-full flex items-center justify-between p-4 bg-white border border-zinc-100 rounded-2xl hover:bg-zinc-50 active:scale-[0.98] transition-all shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-500 group-hover:text-zinc-900">
                  <item.icon size={20} />
                </div>
                <span className="font-medium text-zinc-900 text-sm">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-zinc-300" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Logout Button */}
      <motion.button 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={() => logoutUser()} 
        className="w-full p-4 flex items-center justify-center gap-2 text-[#C72C48] font-bold bg-rose-50 rounded-2xl hover:bg-rose-100 active:scale-[0.98] transition-all shadow-sm"
      >
        <LogOut size={20} />
        Log Out
      </motion.button>
      
      <p className="text-center text-[10px] text-zinc-400 uppercase tracking-widest font-medium pt-2">
        Version 2.0.1
      </p>
    </div>
  );
}