"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Search, 
  Star, 
  CreditCard, 
  Flame, 
  Navigation, 
  Lock,
  Unlock,
  X,
  Loader2,
  CheckCircle2,
  Coffee,
  Ghost
} from "lucide-react";
import { getDashboardData, searchCafes, joinCafe } from "@/actions/dashboard"; 
import { useRouter } from "next/navigation";

// --- TYPES ---
type Cafe = {
  id: string;
  name: string;
  address: string;
  image: string | null;
  rating: number;
  lat: number | null;
  lng: number | null;
};

type LoyaltyCard = {
  id: string;
  stamps: number;
  maxStamps: number;
  tier: string;
  cafe: Cafe;
};

// --- TABS CONFIGURATION ---
const TABS = [
  { id: "cards", label: "My Cards", icon: CreditCard }, // Shortened label for better mobile fit
  { id: "trending", label: "Trending", icon: Flame },
  { id: "nearby", label: "Nearby", icon: Navigation },
];

// --- UTILS ---
function calculateDistance(lat1: number | null, lon1: number | null, lat2: number | null, lon2: number | null) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

// --- SKELETON LOADER ---
const DashboardSkeleton = () => (
  <div className="space-y-6 px-5 md:px-0 pt-4">
    <div className="h-12 w-full bg-zinc-100 rounded-2xl animate-pulse" />
    <div className="h-12 w-full bg-zinc-100 rounded-full animate-pulse" />
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-48 bg-zinc-100 rounded-[24px] animate-pulse" />
      ))}
    </div>
  </div>
);

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("trending"); 
  const [data, setData] = useState<{ myCards: LoyaltyCard[], trending: Cafe[], allCafes: Cafe[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [unlockModal, setUnlockModal] = useState<Cafe | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    try {
      const res = await getDashboardData();
      if (res) {
        setData({
          myCards: res.myCards || [],
          trending: res.trending || [],
          allCafes: res.allCafes || []
        });
        // Auto-switch to cards if user has them
        if (res.myCards && res.myCards.length > 0) setActiveTab("cards");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("Location access denied", err)
      );
    }
  }, [fetchData]);

  // --- SEARCH LOGIC ---
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (searchQuery.trim()) {
        const res = await searchCafes(searchQuery);
        setSearchResults(res);
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  // --- UNLOCK ACTION ---
  const handleUnlock = async (cafeId: string) => {
    if(isUnlocking) return;
    setIsUnlocking(true);
    try {
      const result = await joinCafe(cafeId);
      if (result.success) {
        setUnlockModal(null);
        await fetchData(); 
        setActiveTab("cards");
      } else {
        alert(result.error || "Failed to unlock");
      }
    } catch (error) {
      console.error("Unlock failed", error);
    } finally {
      setIsUnlocking(false);
    }
  };

  // --- STYLING HELPERS ---
  const getBgStyle = (imageString: string | null | undefined) => {
    if (imageString?.startsWith("http") || imageString?.startsWith("/")) {
      return { backgroundImage: `url(${imageString})` };
    }
    return {}; 
  };
  
  const getImageClass = (imageString: string | null | undefined) => {
    if (!imageString) return "bg-zinc-800"; 
    if (imageString.startsWith("http") || imageString.startsWith("/")) return "bg-zinc-200";
    return imageString; 
  };

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen w-full relative pb-24">
      
      {/* --- SEARCH BAR (Smart Sticky) --- */}
      <div className="sticky top-[-1px] md:top-0 z-30 bg-[#F8F9FA]/95 backdrop-blur-md py-4 md:pt-0 px-5 md:px-0 transition-all duration-300">
        <div className="relative">
          <div className="flex items-center bg-white border border-zinc-200 rounded-full px-4 py-3.5 shadow-sm focus-within:ring-2 focus-within:ring-[#C72C48]/20 focus-within:border-[#C72C48] transition-all">
            <Search size={20} className="text-zinc-400 mr-3 shrink-0" />
            <input 
              type="text" 
              placeholder="Search cafes..." 
              className="flex-1 bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="p-1">
                <X size={16} className="text-zinc-400" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute top-full left-0 right-0 bg-white rounded-2xl shadow-xl border border-zinc-100 mt-2 p-2 z-40 max-h-64 overflow-y-auto"
              >
                {searchResults.map((cafe: any) => (
                   <button 
                     key={cafe.id} 
                     onClick={() => setUnlockModal(cafe)}
                     className="w-full text-left p-3 hover:bg-zinc-50 rounded-xl flex items-center gap-3 transition-colors"
                   >
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-zinc-900 truncate">{cafe.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{cafe.address}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- REDESIGNED PREMIUM TABS --- */}
      <div className="mb-6 px-5 md:px-0">
        <div className="relative flex items-center bg-zinc-200/60 p-1 rounded-full overflow-hidden shadow-inner">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-bold z-10 transition-colors duration-300 rounded-full whitespace-nowrap ${
                  isActive ? "text-[#C72C48]" : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-zinc-100"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <tab.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="px-5 md:px-0 min-h-[40vh]">
        <AnimatePresence mode="wait">
          
          {/* 1. YOUR CARDS */}
          {activeTab === "cards" && (
            <motion.div 
              key="cards"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0"
            >
              {(!data?.myCards || data.myCards.length === 0) ? (
                <div className="text-center py-16 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-[32px] col-span-full flex flex-col items-center justify-center gap-3 bg-white/50">
                  <Ghost size={32} className="opacity-50" />
                  <p className="font-medium text-zinc-600">No cards found</p>
                  <button onClick={() => setActiveTab("trending")} className="text-xs text-[#C72C48] font-bold hover:underline">
                    Browse Trending Cafes
                  </button>
                </div>
              ) : (
                data.myCards.map((card: LoyaltyCard) => (
                  <div key={card.id} className="relative w-full h-48 rounded-[32px] overflow-hidden shadow-lg shadow-zinc-200 group bg-zinc-900 cursor-pointer active:scale-[0.98] transition-transform">
                    {/* Background */}
                    <div 
                      className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 ${getImageClass(card.cafe.image)}`} 
                      style={getBgStyle(card.cafe.image)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

                    <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-xl leading-tight text-shadow-sm">{card.cafe.name}</h3>
                          <p className="text-xs text-white/80 flex items-center gap-1 mt-1 font-medium">
                            <MapPin size={10} /> 
                            {userLoc && card.cafe.lat && card.cafe.lng 
                              ? `${calculateDistance(userLoc.lat, userLoc.lng, card.cafe.lat, card.cafe.lng)} km` 
                              : "Nearby"}
                          </p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md p-2 rounded-full border border-white/10">
                          <Coffee size={18} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-2 tracking-wide uppercase opacity-90">
                          <span>{card.tier}</span>
                          <span>{card.stamps} / {card.maxStamps}</span>
                        </div>
                        <div className="flex gap-1.5 h-1.5">
                          {[...Array(card.maxStamps)].map((_, i) => (
                            <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${i < card.stamps ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-white/20"}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* 2. TRENDING / NEARBY (Reused Grid Layout) */}
          {(activeTab === "trending" || activeTab === "nearby") && (
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
            >
              {(activeTab === "trending" ? data?.trending : data?.allCafes)?.map((cafe: Cafe) => {
                 const isMember = data?.myCards.some(c => c.cafe?.id === cafe.id);
                 return (
                <div 
                  key={cafe.id} 
                  onClick={() => !isMember && setUnlockModal(cafe)}
                  className="bg-white p-2.5 rounded-[28px] border border-zinc-100 shadow-sm flex flex-col gap-2 active:scale-95 transition-transform hover:shadow-lg cursor-pointer relative overflow-hidden group"
                >
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white p-1.5 rounded-full z-10 shadow-sm">
                    {isMember ? <CheckCircle2 size={12} className="text-emerald-400"/> : <Lock size={12} />}
                  </div>

                  <div 
                    className={`h-32 w-full rounded-[22px] bg-zinc-100 bg-cover bg-center ${getImageClass(cafe.image)}`} 
                    style={getBgStyle(cafe.image)} 
                  />
                  
                  <div className="px-1">
                    <h3 className="font-bold text-sm text-zinc-900 leading-tight truncate">{cafe.name}</h3>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500 truncate">
                      <MapPin size={10} className="shrink-0" /> 
                      <span className="truncate">{userLoc && cafe.lat && cafe.lng ? `${calculateDistance(userLoc.lat, userLoc.lng, cafe.lat, cafe.lng)} km` : cafe.address}</span>
                    </div>
                  </div>
                  
                  <div className="mt-auto px-1 flex items-center justify-between pb-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-600 bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-100">
                      <Star size={10} className="fill-amber-400 text-amber-400" /> {cafe.rating}
                    </div>
                    {!isMember && (
                        <span className="text-[10px] font-bold text-[#C72C48] bg-rose-50 px-2 py-1 rounded-lg">
                            Unlock
                        </span>
                    )}
                  </div>
                </div>
              )})}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* --- UNLOCK MODAL --- */}
      <AnimatePresence>
        {unlockModal && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isUnlocking && setUnlockModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white rounded-[36px] p-1.5 overflow-hidden shadow-2xl"
            >
               <div className="relative bg-white rounded-[32px] overflow-hidden border border-zinc-100">
                  <div 
                    className={`h-44 bg-zinc-200 bg-cover bg-center relative ${getImageClass(unlockModal.image)}`} 
                    style={getBgStyle(unlockModal.image)}
                  >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <button onClick={() => setUnlockModal(null)} className="absolute top-4 right-4 bg-black/20 text-white p-2 rounded-full hover:bg-black/40 backdrop-blur-md transition-colors"><X size={16} /></button>
                      <div className="absolute bottom-4 left-6 text-white">
                          <h3 className="text-2xl font-bold leading-tight">{unlockModal.name}</h3>
                           <div className="flex items-center gap-2 text-xs opacity-90 mt-1 font-medium">
                              <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Star size={12} className="fill-yellow-400 text-yellow-400" /> {unlockModal.rating}
                              </span>
                              <span>• {unlockModal.address}</span>
                           </div>
                      </div>
                  </div>
                  
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto -mt-14 mb-4 shadow-lg ring-4 ring-white relative z-10">
                      <Unlock className="text-[#C72C48]" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900">Unlock Membership?</h3>
                    <p className="text-sm text-zinc-500 mt-2 mb-6 leading-relaxed px-4">
                      Join <strong>{unlockModal.name}</strong> to get a digital card and start earning rewards immediately.
                    </p>
                    <button 
                      onClick={() => handleUnlock(unlockModal.id)}
                      disabled={isUnlocking}
                      className="w-full bg-[#C72C48] text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2 text-sm"
                    >
                      {isUnlocking ? <Loader2 className="animate-spin" size={20} /> : "Join & Unlock Card"}
                    </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}