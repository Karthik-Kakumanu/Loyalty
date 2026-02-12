"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coffee, 
  Plus, 
  Gift, 
  ChevronRight, 
  QrCode, 
  CreditCard
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getDashboardData } from "@/actions/dashboard";

// --- Types ---
interface LoyaltyCard {
  id: string;
  stamps: number;
  maxStamps: number;
  tier: string;
  balance: number;
  cafe: {
    id: string;
    name: string;
    image: string | null;
    rating: number;
  };
}

// --- Constants ---
const BRAND_COLOR = "#C72C48";

// --- Helper: Premium Gradient Generator ---
const getCardGradient = (name: string) => {
  const gradients = [
    "from-zinc-900 via-zinc-800 to-zinc-900",
    "from-[#C72C48] via-[#9F1E35] to-[#801B2E]",
    "from-emerald-900 via-emerald-800 to-emerald-950",
    "from-blue-900 via-indigo-900 to-slate-900",
    "from-amber-800 via-orange-900 to-amber-950",
    "from-violet-900 via-purple-900 to-fuchsia-950",
  ];
  const index = name.length % gradients.length;
  return gradients[index];
};

// --- Component: Skeleton Card (For Native-Feel Loading) ---
const CardSkeleton = () => (
  <div className="relative h-64 w-full rounded-[2rem] bg-zinc-100 overflow-hidden shadow-sm animate-pulse p-7 flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div className="space-y-3">
        <div className="h-8 w-40 bg-zinc-200 rounded-lg" />
        <div className="h-5 w-20 bg-zinc-200 rounded-md" />
      </div>
      <div className="h-12 w-12 bg-zinc-200 rounded-2xl" />
    </div>
    <div className="space-y-2">
      <div className="flex justify-between">
         <div className="h-4 w-24 bg-zinc-200 rounded" />
         <div className="h-6 w-16 bg-zinc-200 rounded" />
      </div>
      <div className="flex gap-1.5 h-2">
         {[...Array(5)].map((_, i) => <div key={i} className="flex-1 bg-zinc-200 rounded-full" />)}
      </div>
    </div>
    <div className="flex gap-3 mt-4">
      <div className="h-10 flex-1 bg-zinc-200 rounded-xl" />
      <div className="h-10 w-10 bg-zinc-200 rounded-xl" />
    </div>
  </div>
);

export default function CardsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Real Data
  useEffect(() => {
    async function loadCards() {
      try {
        const data = await getDashboardData();
        if (data && data.myCards) {
          const formattedCards = data.myCards.map((card: any) => ({
            ...card,
            maxStamps: card.maxStamps || 10,
            tier: card.tier || "Member",
          }));
          setCards(formattedCards);
        }
      } catch (error) {
        console.error("Failed to load cards:", error);
      } finally {
        setLoading(false);
      }
    }
    loadCards();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-32 md:pb-12">
      
      {/* --- HEADER --- */}
      {/* Fixed top alignment with sticky feel handled by parent layout usually, 
          but we ensure padding respects mobile notches here. */}
      <div className="flex items-center justify-between px-5 md:px-0 pt-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">My Wallet</h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            {loading ? "Syncing..." : `${cards.length} Active Cards`}
          </p>
        </div>
        
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/dashboard")} 
          className="flex items-center gap-2 bg-[#C72C48]/10 text-[#C72C48] pl-3 pr-4 py-2.5 rounded-full text-xs font-bold hover:bg-[#C72C48]/20 transition-colors active:bg-[#C72C48]/30"
        >
          <div className="bg-[#C72C48] text-white rounded-full p-0.5">
            <Plus size={14} strokeWidth={3} />
          </div>
          <span className="translate-y-[0.5px]">Add Card</span>
        </motion.button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="px-5 md:px-0">
        
        {/* Loading Skeletons */}
        {loading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {/* Empty State */}
        {!loading && cards.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center border-2 border-dashed border-zinc-200 rounded-[2.5rem] bg-zinc-50/50"
          >
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-zinc-100">
              <CreditCard className="text-zinc-300" size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Your wallet is empty</h3>
            <p className="text-sm text-zinc-500 max-w-xs mb-8 leading-relaxed">
              Unlock a membership card at any partner cafe to start collecting digital stamps.
            </p>
            <button 
              onClick={() => router.push("/dashboard")}
              className="bg-[#C72C48] text-white px-8 py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-red-200/50 hover:bg-[#A61F38] active:scale-95 transition-all"
            >
              Discover Cafes
            </button>
          </motion.div>
        )}

        {/* Cards Grid */}
        {!loading && cards.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {cards.map((card, index) => {
                const isEligibleForReward = card.stamps >= card.maxStamps;
                const gradient = getCardGradient(card.cafe.name);

                return (
                  <motion.div
                    key={card.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                    whileHover={{ y: -5, scale: 1.01 }}
                    className="group relative select-none"
                  >
                    {/* Main Card Container */}
                    <div 
                      onClick={() => router.push(`/dashboard/cards/${card.id}`)} // Optional: detailed view
                      className={`relative h-64 w-full rounded-[2rem] overflow-hidden bg-gradient-to-br ${gradient} text-white shadow-xl shadow-zinc-200 flex flex-col justify-between p-6 sm:p-7 cursor-pointer`}
                    >
                      
                      {/* Decorative Background Elements */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none mix-blend-overlay" />
                      <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

                      {/* Top Row: Info */}
                      <div className="relative z-10 flex justify-between items-start">
                        <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                          <h3 className="font-bold text-xl sm:text-2xl tracking-tight leading-none truncate w-full">
                            {card.cafe.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider">
                              {card.tier}
                            </span>
                            {isEligibleForReward && (
                              <motion.span 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-400 text-black text-[10px] font-bold uppercase tracking-wider shadow-sm"
                              >
                                <Gift size={10} strokeWidth={3} /> Free Reward
                              </motion.span>
                            )}
                          </div>
                        </div>
                        
                        {/* Cafe Icon */}
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-inner flex-shrink-0">
                          <Coffee size={24} className="text-white/90" />
                        </div>
                      </div>

                      {/* Middle: Stamp Visuals */}
                      <div className="relative z-10 py-2">
                        <div className="flex justify-between items-end mb-2.5">
                          <div className="text-xs sm:text-sm font-medium text-white/70">Progress</div>
                          <div className="text-2xl sm:text-3xl font-bold tracking-tight leading-none">
                            {card.stamps}<span className="text-base sm:text-lg text-white/40 font-medium">/{card.maxStamps}</span>
                          </div>
                        </div>
                        
                        {/* Stamp Slots */}
                        <div className="flex justify-between gap-1.5 h-2 w-full">
                          {[...Array(card.maxStamps)].map((_, i) => {
                            const filled = i < card.stamps;
                            return (
                              <div 
                                key={i} 
                                className={`h-full flex-1 rounded-full transition-all duration-700 ${
                                  filled 
                                    ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] opacity-100" 
                                    : "bg-white/20 opacity-100"
                                }`} 
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Bottom Row: Actions */}
                      <div className="relative z-10 flex gap-3 mt-auto pt-2">
                        {isEligibleForReward ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); console.log("Redeem"); }}
                            className="flex-1 bg-white text-black h-11 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 transition-colors shadow-lg active:scale-[0.98]"
                          >
                            <Gift size={16} className="text-[#C72C48]" /> Redeem Reward
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); router.push("#scan"); }}
                            className="flex-1 bg-white/20 backdrop-blur-md border border-white/30 h-11 rounded-xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 hover:bg-white/30 transition-colors active:scale-[0.98]"
                          >
                            <QrCode size={16} /> Pay & Earn
                          </button>
                        )}
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/reserve`); }}
                          className="w-11 h-11 bg-black/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-black/30 transition-colors border border-white/10 active:scale-95"
                          aria-label="View Details"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>

                    </div>
                    
                    {/* Glass Reflection Overlay */}
                    <div className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/10 pointer-events-none" />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}