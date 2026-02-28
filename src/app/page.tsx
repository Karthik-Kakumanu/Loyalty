"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden selection:bg-[#C72C48] selection:text-white">
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center w-full max-w-md"
      >
        {/* --- LOGO CONTAINER (SEAMLESS CIRCLE) --- */}
        <div className="relative mb-14 group">
          {/* Ultra-refined luxury shadow */}
          <div className="absolute inset-0 bg-[#C72C48] rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-700" />
          
          <div className="relative w-36 h-36 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] border border-zinc-100 rounded-full flex items-center justify-center overflow-hidden">
             {/* Using object-contain and a white background makes your logo 
                blend perfectly into the circle without cutting off the edges.
             */}
             <Image 
               src="/logo.png" 
               alt="Revistra Logo" 
               fill
               className="object-contain scale-110 z-10" // scale-110 makes it look larger inside the circle
               onError={(e) => {
                 (e.target as HTMLImageElement).style.display = 'none';
                 document.getElementById('fallback-logo')!.style.display = 'flex';
               }}
             />
             {/* Fallback Icon */}
             <div id="fallback-logo" className="hidden absolute inset-0 items-center justify-center bg-white">
                <Sparkles size={40} className="text-[#C72C48]" />
             </div>
          </div>
        </div>

        {/* --- TYPOGRAPHY (QUIET LUXURY) --- */}
        <div className="space-y-6 mb-16">
            <h1 className="text-5xl md:text-6xl font-serif font-extrabold text-zinc-900 tracking-tight">
              Revistra
            </h1>
            <div className="w-12 h-[2px] bg-[#C72C48] mx-auto" />
            <p className="text-zinc-500 text-lg md:text-xl leading-relaxed px-2 font-medium max-w-sm mx-auto">
              Elevate your lifestyle. Unlock exclusive memberships, collect premium rewards, and experience the extraordinary.
            </p>
        </div>

        {/* --- ACTION BUTTON --- */}
        <Link 
          href="/auth" 
          className="group relative w-full max-w-xs flex items-center justify-center gap-3 bg-[#C72C48] text-white px-8 py-5 rounded-full font-bold text-lg shadow-[0_15px_30px_-10px_rgba(199,44,72,0.4)] hover:shadow-[0_20px_40px_-10px_rgba(199,44,72,0.5)] hover:bg-[#b5253f] active:scale-95 transition-all overflow-hidden"
        >
          {/* Subtle Button Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          
          <span className="tracking-wide relative z-10">Request Access</span> 
          <ArrowRight size={22} className="relative z-10 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* --- FOOTER --- */}
        <p className="mt-16 text-[11px] text-zinc-400 uppercase tracking-[0.3em] font-bold">
          Your Loyalty Companion
        </p>
      </motion.div>
    </div>
  );
}