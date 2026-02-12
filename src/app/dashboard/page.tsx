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
  AlertCircle,
  Lock,
  Unlock,
  X,
  Loader2,
  CheckCircle2,
  Coffee
} from "lucide-react";
import { getDashboardData, searchCafes, joinCafe } from "@/actions/dashboard"; 
import { useRouter } from "next/navigation";

// --- TYPES (Fixed to match Prisma Schema) ---
type Cafe = {
  id: string;
  name: string;
  address: string;
  image: string | null; // Allow null
  rating: number;
  lat: number | null;   // Allow null
  lng: number | null;   // Allow null
};

type LoyaltyCard = {
  id: string;
  stamps: number;
  maxStamps: number;
  tier: string;
  cafe: Cafe;
};

// --- TABS ---
const TABS = [
  { id: "cards", label: "Your Cards", icon: CreditCard },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "nearby", label: "Nearby", icon: Navigation },
];

// --- UTILS: Calculate Real Distance ---
function calculateDistance(lat1: number | null, lon1: number | null, lat2: number | null, lon2: number | null) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("trending"); 
  const [data, setData] = useState<{ myCards: LoyaltyCard[], trending: Cafe[], allCafes: Cafe[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [unlockModal, setUnlockModal] = useState<Cafe | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const router = useRouter();

  // Fetch Data Function
  const fetchData = useCallback(async () => {
    try {
      const res = await getDashboardData();
      
      // Safety check: ensure response exists
      if (res) {
        setData({
          myCards: res.myCards || [],
          trending: res.trending || [],
          allCafes: res.allCafes || []
        });

        // Auto-switch tab if user has cards
        if (res.myCards && res.myCards.length > 0) {
          setActiveTab("cards");
        }
      } else {
        // Fallback if server returns nothing
        setData({ myCards: [], trending: [], allCafes: [] });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setData({ myCards: [], trending: [], allCafes: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 1. Initial Load
  useEffect(() => {
    fetchData();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("Location denied", err)
      );
    }
  }, [fetchData]);

  // 2. Search Logic
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (searchQuery) {
        const res = await searchCafes(searchQuery);
        setSearchResults(res);
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  // 3. Unlock Handler
  const handleUnlock = async (cafeId: string) => {
    if(isUnlocking) return;
    setIsUnlocking(true);

    try {
      const result = await joinCafe(cafeId);
      if (result.success) {
        setUnlockModal(null);
        await fetchData(); // Refresh data to show new card
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

  // Helper for background images/colors (Handles Nulls)
  const getBgStyle = (imageString: string | null | undefined) => {
    if (imageString?.startsWith("http") || imageString?.startsWith("/")) {
      return { backgroundImage: `url(${imageString})` };
    }
    return {}; // Use className for colors
  };

  // Helper to safely get image class (Handles Nulls)
  const getImageClass = (imageString: string | null | undefined) => {
    if (!imageString) return "bg-zinc-800"; // Default fallback color
    if (imageString.startsWith("http") || imageString.startsWith("/")) return "bg-zinc-200";
    return imageString; // Assume it's a tailwind class like 'bg-red-500'
  };

  if (isLoading) return <div className="min-h-[60vh] flex items-center justify-center text-zinc-400"><Loader2 className="animate-spin mr-2"/> Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] w-full relative">
      
      {/* --- SEARCH BAR --- */}
      <div className="sticky top-0 z-30 bg-[#F8F9FA]/95 backdrop-blur-sm pb-4 pt-4 px-5 md:px-0">
        <div className="flex items-center bg-white border border-zinc-200 rounded-2xl px-4 py-3.5 shadow-sm focus-within:ring-2 focus-within:ring-[#C72C48]/20 focus-within:border-[#C72C48] transition-all">
          <Search size={20} className="text-zinc-400 mr-3" />
          <input 
            type="text" 
            placeholder="Search cafes..." 
            className="flex-1 bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {searchResults.length > 0 && (
          <div className="absolute top-full left-5 right-5 md:left-0 md:right-0 bg-white rounded-2xl shadow-xl border border-zinc-100 mt-2 p-2 z-40 max-h-60 overflow-y-auto">
            {searchResults.map((cafe: any) => (
               <button key={cafe.id} className="w-full text-left p-3 hover:bg-zinc-50 rounded-xl flex items-center gap-3 transition-colors">
                <MapPin size={18} className="text-zinc-400" />
                <div><p className="font-bold text-sm text-zinc-900">{cafe.name}</p><p className="text-xs text-zinc-500">{cafe.address}</p></div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --- TABS --- */}
      <div className="px-5 md:px-0 mb-8">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-2 min-w-[90px] py-2 rounded-2xl transition-all duration-300 ${isActive ? "scale-105" : "opacity-60 scale-100 hover:opacity-100"}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border transition-colors duration-300 ${isActive ? "bg-[#C72C48] border-[#C72C48] text-white shadow-lg shadow-red-200" : "bg-white border-zinc-200 text-zinc-600"}`}>
                  <tab.icon size={24} />
                </div>
                <span className={`text-xs font-bold tracking-wide ${isActive ? "text-[#C72C48]" : "text-zinc-500"}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="px-5 md:px-0 pb-24 space-y-4">
        <AnimatePresence mode="wait">
          
          {/* 1. YOUR CARDS */}
          {activeTab === "cards" && (
            <motion.div 
              key="cards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0"
            >
              {(!data?.myCards || data.myCards.length === 0) ? (
                <div className="text-center py-16 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-[24px] col-span-full flex flex-col items-center justify-center gap-3">
                  <CreditCard size={32} className="opacity-50" />
                  <p className="font-medium">No cards yet.</p>
                  <p className="text-xs">Unlock membership at trending cafes.</p>
                </div>
              ) : (
                data.myCards.map((card: LoyaltyCard) => (
                  <div key={card.id} className="relative w-full h-48 rounded-[24px] overflow-hidden shadow-lg shadow-zinc-200 group bg-zinc-900">
                    {/* Background Image Paved */}
                    <div 
                      className={`absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 ${getImageClass(card.cafe.image)}`} 
                      style={getBgStyle(card.cafe.image)}
                    />
                    <div className="absolute inset-0 bg-black/50" /> {/* Dark Overlay */}

                    <div className="relative z-10 p-5 h-full flex flex-col justify-between text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-xl leading-tight">{card.cafe.name}</h3>
                          <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                            <MapPin size={10} /> 
                            {userLoc && card.cafe.lat && card.cafe.lng 
                              ? `${calculateDistance(userLoc.lat, userLoc.lng, card.cafe.lat, card.cafe.lng)} km` 
                              : card.cafe.address}
                          </p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md p-2 rounded-full">
                          <Coffee size={18} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold mb-2">
                          <span>{card.tier}</span>
                          <span>{card.stamps} / {card.maxStamps} Stamps</span>
                        </div>
                        <div className="flex gap-1 h-1.5">
                          {[...Array(card.maxStamps)].map((_, i) => (
                            <div key={i} className={`flex-1 rounded-full ${i < card.stamps ? "bg-white" : "bg-white/20"}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* 2. TRENDING */}
          {activeTab === "trending" && (
            <motion.div 
              key="trending"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
            >
              {data?.trending.map((cafe: Cafe) => {
                 const isMember = data.myCards.some(c => c.cafe?.id === cafe.id);
                 return (
                <div 
                  key={cafe.id} 
                  onClick={() => !isMember && setUnlockModal(cafe)}
                  className="bg-white p-3 rounded-[24px] border border-zinc-100 shadow-sm flex flex-col gap-2 active:scale-95 transition-transform hover:shadow-lg cursor-pointer relative overflow-hidden group"
                >
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white p-1.5 rounded-full z-10">
                    {isMember ? <CheckCircle2 size={12} className="text-green-400"/> : <Lock size={12} />}
                  </div>

                  <div 
                    className={`h-32 w-full rounded-2xl bg-zinc-200 bg-cover bg-center ${getImageClass(cafe.image)}`} 
                    style={getBgStyle(cafe.image)} 
                  />
                  
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 leading-tight truncate">{cafe.name}</h3>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500 truncate">
                      <MapPin size={10} className="shrink-0" /> 
                      <span className="truncate">{userLoc && cafe.lat && cafe.lng ? `${calculateDistance(userLoc.lat, userLoc.lng, cafe.lat, cafe.lng)} km` : cafe.address}</span>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-600 bg-zinc-50 px-2 py-1 rounded-lg">
                      <Star size={10} className="fill-amber-400 text-amber-400" /> {cafe.rating}
                    </div>
                    {!isMember && <span className="text-[10px] font-bold text-[#C72C48]">Unlock</span>}
                  </div>
                </div>
              )})}
            </motion.div>
          )}

          {/* 3. NEARBY */}
          {activeTab === "nearby" && (
            <motion.div 
              key="nearby"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4"
            >
              {data?.allCafes.map((cafe: Cafe) => {
                  const isMember = data.myCards.some(c => c.cafe?.id === cafe.id);
                  return (
                <div 
                  key={cafe.id} 
                  onClick={() => !isMember && setUnlockModal(cafe)}
                  className="bg-white p-3 rounded-[24px] border border-zinc-100 shadow-sm flex gap-4 items-center active:scale-[0.98] transition-transform hover:shadow-md cursor-pointer"
                >
                  <div 
                    className={`w-20 h-20 bg-zinc-200 rounded-2xl flex-shrink-0 bg-cover bg-center ${getImageClass(cafe.image)}`} 
                    style={getBgStyle(cafe.image)} 
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <h3 className="font-bold text-zinc-900 truncate">{cafe.name}</h3>
                      {isMember && <CheckCircle2 size={16} className="text-green-500" />}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-zinc-500">
                       <MapPin size={12} className="shrink-0" /> 
                       <span>{userLoc && cafe.lat && cafe.lng ? `${calculateDistance(userLoc.lat, userLoc.lng, cafe.lat, cafe.lng)} km` : cafe.address}</span>
                    </div>
                     {!isMember ? (
                        <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#C72C48] bg-rose-50 px-2 py-1 rounded-full">
                            <Unlock size={10} /> Unlock Membership
                        </div>
                     ) : (
                        <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-full">
                            Member
                        </div>
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
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-1 overflow-hidden shadow-2xl"
            >
               <div className="relative bg-white rounded-[22px] overflow-hidden">
                  <div 
                    className={`h-36 bg-zinc-200 bg-cover bg-center relative ${getImageClass(unlockModal.image)}`} 
                    style={getBgStyle(unlockModal.image)}
                  >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <button onClick={() => setUnlockModal(null)} className="absolute top-4 right-4 bg-black/30 text-white p-1.5 rounded-full hover:bg-black/50 backdrop-blur-md"><X size={16} /></button>
                      <div className="absolute bottom-4 left-4 text-white">
                          <h3 className="text-xl font-bold leading-tight">{unlockModal.name}</h3>
                           <div className="flex items-center gap-1 text-xs opacity-90 mt-1">
                              <Star size={12} className="fill-yellow-400 text-yellow-400" /> {unlockModal.rating}
                           </div>
                      </div>
                  </div>
                  
                  <div className="p-5 text-center">
                    <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto -mt-12 mb-3 shadow-lg ring-4 ring-white relative z-10">
                      <Unlock className="text-[#C72C48]" size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900">Join this Cafe?</h3>
                    <p className="text-sm text-zinc-500 mt-1 mb-5 leading-relaxed">
                      Unlock a digital membership card for <strong>{unlockModal.name}</strong> to start collecting stamps.
                    </p>
                    <button 
                      onClick={() => handleUnlock(unlockModal.id)}
                      disabled={isUnlocking}
                      className="w-full bg-[#C72C48] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-200 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                      {isUnlocking ? <Loader2 className="animate-spin" size={18} /> : "Join & Unlock Card"}
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