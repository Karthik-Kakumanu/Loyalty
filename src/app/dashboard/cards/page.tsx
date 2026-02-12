"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coffee, 
  Plus, 
  Gift, 
  ChevronRight, 
  QrCode, 
  Loader2, 
  CreditCard,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getDashboardData } from "@/actions/dashboard"; // Reuse existing action
import { Card } from "@/components/ui/card";

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
    image: string | null; // Tailwind bg color class or URL
    rating: number;
  };
}

// --- Helper: Deterministic Gradient Generator ---
// Generates a premium gradient based on the cafe name length/char to ensure consistency
const getCardGradient = (name: string) => {
  const gradients = [
    "from-zinc-900 to-zinc-800",
    "from-[#C72C48] to-[#9F1E35]",
    "from-emerald-800 to-emerald-950",
    "from-blue-900 to-indigo-950",
    "from-amber-700 to-orange-900",
    "from-purple-900 to-violet-950",
  ];
  const index = name.length % gradients.length;
  return gradients[index];
};

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
          // Normalize data to ensure defaults
          const formattedCards = data.myCards.map((card: any) => ({
            ...card,
            maxStamps: card.maxStamps || 10, // Default to 10 if missing
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

  // --- Loading State ---
  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#C72C48]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between px-5 md:px-0 mt-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">My Wallet</h1>
          <p className="text-sm text-zinc-500 font-medium">{cards.length} Active Cards</p>
        </div>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/dashboard")} 
          className="flex items-center gap-1.5 bg-[#C72C48]/10 text-[#C72C48] px-4 py-2 rounded-full text-xs font-bold hover:bg-[#C72C48]/20 transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Card</span>
          <span className="sm:hidden">Add</span>
        </motion.button>
      </div>

      {/* --- EMPTY STATE --- */}
      {!loading && cards.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-zinc-200 rounded-3xl mx-5 md:mx-0 bg-white"
        >
          <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="text-zinc-300" size={32} />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 mb-2">No Cards Yet</h3>
          <p className="text-sm text-zinc-500 max-w-xs mb-6">
            Join your favorite cafes to start collecting stamps and earning rewards.
          </p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="bg-[#C72C48] text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-red-200 hover:bg-[#A61F38] transition-colors"
          >
            Explore Cafes
          </button>
        </motion.div>
      )}

      {/* --- CARDS GRID --- */}
      <div className="grid gap-6 px-5 md:px-0 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {cards.map((card, index) => {
            const isEligibleForReward = card.stamps >= card.maxStamps;
            const progressPercent = (card.stamps / card.maxStamps) * 100;
            const gradient = getCardGradient(card.cafe.name);

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative"
              >
                {/* Main Card Container */}
                <div className={`relative h-64 w-full rounded-[2rem] overflow-hidden bg-gradient-to-br ${gradient} text-white shadow-xl shadow-zinc-200 flex flex-col justify-between p-7`}>
                  
                  {/* Decorative Background Elements */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

                  {/* Top Row: Cafe Info & Tier */}
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-bold text-2xl tracking-tight leading-none">{card.cafe.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-white/20 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider">
                          {card.tier}
                        </span>
                        {isEligibleForReward && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-yellow-400/90 text-black text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            <Gift size={10} /> Reward Ready
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Cafe Icon/Logo Placeholder */}
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                      <Coffee size={24} className="text-white/90" />
                    </div>
                  </div>

                  {/* Middle: Stamp Visuals */}
                  <div className="relative z-10 py-2">
                    <div className="flex justify-between items-end mb-2">
                      <div className="text-sm font-medium text-white/80">Stamp Card</div>
                      <div className="text-3xl font-bold tracking-tight">
                        {card.stamps}<span className="text-lg text-white/50 font-medium">/{card.maxStamps}</span>
                      </div>
                    </div>
                    
                    {/* Stamp Slots */}
                    <div className="flex justify-between gap-1.5">
                      {[...Array(card.maxStamps)].map((_, i) => {
                        const filled = i < card.stamps;
                        return (
                          <div 
                            key={i} 
                            className={`h-2 flex-1 rounded-full transition-all duration-700 ${
                              filled 
                                ? "bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)] scale-100" 
                                : "bg-white/20 scale-95"
                            }`} 
                          />
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-white/60 mt-2 text-right font-medium">
                      {isEligibleForReward 
                        ? "Visit cafe to redeem your reward!" 
                        : `${card.maxStamps - card.stamps} more stamps to unlock free coffee`
                      }
                    </p>
                  </div>

                  {/* Bottom Row: Actions */}
                  <div className="relative z-10 flex gap-3 mt-auto">
                    {isEligibleForReward ? (
                      <button 
                        onClick={() => console.log("Redeem Flow")}
                        className="flex-1 bg-white text-black h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-zinc-100 transition-colors shadow-lg"
                      >
                        <Gift size={14} className="text-[#C72C48]" /> Redeem Reward
                      </button>
                    ) : (
                      <button 
                        onClick={() => router.push("#scan")} // Triggers scanner via URL hash or logic
                        className="flex-1 bg-white/20 backdrop-blur-md border border-white/30 h-10 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 hover:bg-white/30 transition-colors"
                      >
                        <QrCode size={14} /> Pay & Earn
                      </button>
                    )}
                    
                    <button 
                      onClick={() => router.push(`/dashboard/reserve`)}
                      className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white hover:bg-black/30 transition-colors border border-white/10"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                </div>
                
                {/* Reflection Effect (Subtle) */}
                <div className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/10 pointer-events-none" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}