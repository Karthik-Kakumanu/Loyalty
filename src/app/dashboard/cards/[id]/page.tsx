"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Coffee, QrCode, Loader2 } from "lucide-react";
import { getDashboardData } from "@/actions/dashboard"; // Reuse for now

export default function LoyaltyCardPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCard() {
      // In production, make a specific API `getCardById(id)`
      const data = await getDashboardData();
      const found = data.myCards.find((c: any) => c.id === id);
      setCard(found);
      setLoading(false);
    }
    fetchCard();
  }, [id]);

  if (loading) return <div className="h-screen bg-[#121212] flex items-center justify-center"><Loader2 className="text-[#C72C48] animate-spin"/></div>;
  if (!card) return <div className="h-screen bg-[#121212] text-white flex items-center justify-center">Card not found</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-[#C72C48] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-blue-900 rounded-full blur-[120px]" />
      </div>

      <button onClick={() => router.back()} className="absolute top-6 left-6 p-2 bg-white/10 rounded-full backdrop-blur-md z-50">
        <ChevronLeft />
      </button>

      {/* --- THE PREMIUM CARD --- */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="relative w-full max-w-sm aspect-[1.58/1] rounded-[24px] overflow-hidden shadow-2xl border border-white/10 bg-black/40 backdrop-blur-xl z-10"
      >
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative p-6 h-full flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-shadow-sm">{card.cafe.name}</h1>
              <p className="text-white/50 text-xs font-mono uppercase tracking-widest mt-1">Member ID</p>
              
              {/* --- UNIQUE SERIAL NUMBER DISPLAY --- */}
              <p className="text-[#ff4d6d] font-mono font-bold text-xl tracking-widest drop-shadow-[0_0_10px_rgba(199,44,72,0.5)]">
                {card.cardSerial || "PENDING"} 
              </p>
            </div>
            
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-md shadow-inner">
              <Coffee size={24} />
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Tier Status</p>
              <span className="inline-block px-3 py-1 bg-gradient-to-r from-amber-200 to-yellow-500 text-black text-xs font-bold rounded-lg shadow-lg">
                {card.tier}
              </span>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold leading-none">{card.stamps}</p>
              <p className="text-[10px] text-white/50 uppercase">Stamps Collected</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* --- STAMP GRID --- */}
      <div className="w-full max-w-sm mt-8 grid grid-cols-5 gap-4 relative z-10 px-2">
        {[...Array(card.maxStamps)].map((_, i) => {
          const isCollected = i < card.stamps;
          return (
            <motion.div 
              key={i}
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }}
              className={`aspect-square rounded-full flex items-center justify-center border-2 transition-all ${
                isCollected 
                  ? "bg-[#C72C48] border-[#C72C48] text-white shadow-[0_0_15px_#C72C48]" 
                  : "bg-white/5 border-white/10 text-white/20"
              }`}
            >
              <Coffee size={14} fill={isCollected ? "currentColor" : "none"} />
            </motion.div>
          )
        })}
      </div>

      <p className="text-white/40 text-xs mt-8 text-center max-w-xs relative z-10 leading-relaxed">
        Scan your membership QR at the counter to collect stamps. Rewards unlocked automatically.
      </p>

      {/* QR Code trigger */}
      <button className="mt-6 bg-white text-black px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 transition-transform z-10">
        <QrCode size={20} /> Show My QR
      </button>

    </div>
  );
}