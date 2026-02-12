"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Clock, CheckCircle2, Ticket, Copy, ExternalLink } from "lucide-react";
import { getLoyaltyData } from "@/actions/dashboard";

// --- Types ---
interface Reward {
  id: string;
  title: string;
  cafeName: string;
  expiry: string; // e.g., "Expires in 6 days"
  status: "READY" | "USED" | "EXPIRED";
  pointsUsed: number;
  code?: string; // Optional coupon code
}

// --- Component: Ticket Skeleton ---
const RewardSkeleton = () => (
  <div className="relative h-32 w-full rounded-2xl bg-zinc-100 overflow-hidden shadow-sm animate-pulse flex">
    {/* Stub */}
    <div className="w-24 border-r border-dashed border-zinc-300 flex flex-col items-center justify-center p-2 gap-2">
      <div className="h-10 w-10 bg-zinc-200 rounded-full" />
      <div className="h-3 w-12 bg-zinc-200 rounded" />
    </div>
    {/* Body */}
    <div className="flex-1 p-4 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="h-5 w-3/4 bg-zinc-200 rounded" />
        <div className="h-3 w-1/2 bg-zinc-200 rounded" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-3 w-20 bg-zinc-200 rounded" />
        <div className="h-8 w-20 bg-zinc-200 rounded-lg" />
      </div>
    </div>
  </div>
);

export default function LoyaltyPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getLoyaltyData();
        // Ensure data matches our type, fallback if needed
        setRewards(data || []);
      } catch (error) {
        console.error("Failed to load rewards", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-32 md:pb-12">
      
      {/* --- HEADER --- */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="px-5 md:px-0 pt-2"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">My Rewards</h1>
        <p className="text-sm text-zinc-500 font-medium mt-1">
          {loading ? "Syncing..." : `You have ${rewards.filter(r => r.status === 'READY').length} active rewards`}
        </p>
      </motion.div>

      {/* --- CONTENT AREA --- */}
      <div className="px-5 md:px-0">
        
        {/* Loading Skeletons */}
        {loading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4].map((i) => <RewardSkeleton key={i} />)}
          </div>
        )}

        {/* Empty State */}
        {!loading && rewards.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center border-2 border-dashed border-zinc-200 rounded-[2.5rem] bg-zinc-50/50"
          >
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-zinc-100">
              <Ticket className="text-zinc-300" size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">No rewards yet</h3>
            <p className="text-sm text-zinc-500 max-w-xs mb-1 leading-relaxed">
              Collect stamps at cafes to unlock free items and discounts.
            </p>
          </motion.div>
        )}

        {/* Rewards Grid */}
        {!loading && rewards.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {rewards.map((reward, i) => (
                <motion.div
                  key={reward.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative"
                >
                  <div className={`relative flex w-full h-32 rounded-2xl overflow-hidden border transition-all duration-300 ${
                    reward.status === 'USED' 
                      ? 'bg-zinc-50 border-zinc-200 opacity-75 grayscale' 
                      : 'bg-white border-zinc-100 shadow-sm hover:shadow-md'
                  }`}>
                    
                    {/* LEFT SIDE: TICKET STUB */}
                    <div className={`w-24 min-w-[6rem] flex flex-col items-center justify-center p-2 border-r border-dashed ${
                      reward.status === 'USED' ? 'border-zinc-300 bg-zinc-100' : 'border-zinc-200 bg-[#C72C48]/5'
                    }`}>
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-1.5 shadow-sm ${
                        reward.status === 'USED' ? 'bg-zinc-200 text-zinc-400' : 'bg-white text-[#C72C48]'
                      }`}>
                        {reward.status === 'USED' ? <CheckCircle2 size={20} /> : <Gift size={20} />}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        reward.status === 'USED' ? 'text-zinc-400' : 'text-[#C72C48]'
                      }`}>
                        {reward.pointsUsed} Pts
                      </span>
                    </div>

                    {/* RIGHT SIDE: INFO */}
                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className={`font-bold text-base truncate ${
                          reward.status === 'USED' ? 'text-zinc-500 line-through' : 'text-zinc-900'
                        }`}>
                          {reward.title}
                        </h3>
                        <p className="text-xs text-zinc-500 font-medium truncate flex items-center gap-1">
                           {reward.cafeName}
                        </p>
                      </div>

                      <div className="flex items-end justify-between mt-2">
                        <div className="flex items-center text-[10px] text-zinc-400 font-medium bg-zinc-50 px-2 py-1 rounded-md">
                          <Clock size={10} className="mr-1" />
                          {reward.expiry}
                        </div>
                        
                        {reward.status === 'READY' ? (
                          <button className="h-8 px-4 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-black active:scale-95 transition-all shadow-md shadow-zinc-200 flex items-center gap-1.5">
                            Redeem
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">
                            USED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* DECORATIVE: TICKET CUTOUTS */}
                    {/* Top Cutout */}
                    <div className="absolute -top-1.5 left-[5.65rem] w-3 h-3 bg-[#F8F9FA] rounded-full border-b border-zinc-200 z-10" />
                    {/* Bottom Cutout */}
                    <div className="absolute -bottom-1.5 left-[5.65rem] w-3 h-3 bg-[#F8F9FA] rounded-full border-t border-zinc-200 z-10" />
                    
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}