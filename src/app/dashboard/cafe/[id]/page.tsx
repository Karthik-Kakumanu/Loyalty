"use client";

import { useEffect, useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Star, ChevronLeft, ChevronRight, CreditCard, Lock, Loader2, Coffee, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCafeDetails, joinCafeWithSerial } from "@/actions/cafe";

// --- TYPES ---
type MenuType = "VEG" | "NON-VEG";

interface MenuItem {
  id: string | number;
  name: string;
  price: string;
  description: string;
  tag?: string;
  type: MenuType;
  isSpecial: boolean;
}

type CafeData = {
  id: string;
  name: string;
  address: string;
  rating: number;
  description?: string | null;
  image?: string | null;
  lat?: number | null;
  lng?: number | null;
  plan?: "STARTER" | "GROWTH" | "CUSTOM";
  menu?: MenuItem[];
  cards?: Array<{
    id: string;
    cardSerial?: string | null;
  }>;
};

// --- MOCK MENU DATA (Until your Admin Panel is connected) ---
const MOCK_DB_MENU: MenuItem[] = [
  { id: 1, name: "Signature Ruby Latte", price: "$6.50", description: "Our house special rose-infused latte with a hint of Madagascar vanilla.", tag: "Popular", type: "VEG", isSpecial: true },
  { id: 2, name: "Artisan Butter Croissant", price: "$4.00", description: "Freshly baked daily, perfectly flaky and golden brown.", type: "VEG", isSpecial: false },
  { id: 3, name: "Smoked Turkey Sandwich", price: "$9.50", description: "Oven-smoked turkey breast with cranberry glaze on sourdough.", type: "NON-VEG", isSpecial: true },
  { id: 4, name: "Truffle Chocolate Cake", price: "$8.50", description: "Rich dark chocolate layered with velvet truffle cream.", tag: "Chef's Pick", type: "VEG", isSpecial: false },
  { id: 5, name: "Spicy Chicken Wrap", price: "$8.00", description: "Grilled chicken with spicy mayo and fresh greens.", type: "NON-VEG", isSpecial: false },
  { id: 6, name: "Matcha Green Tea", price: "$5.50", description: "Premium ceremonial grade matcha whisked to perfection.", type: "VEG", isSpecial: true },
];

// Veg/Non-Veg Indicator Icon Component
const DietIcon = ({ type }: { type: MenuType }) => {
  const color = type === "VEG" ? "border-green-600" : "border-red-600";
  const dotColor = type === "VEG" ? "bg-green-600" : "bg-red-600";
  return (
    <div className={`w-3 h-3 border flex items-center justify-center rounded-sm shrink-0 ${color}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
    </div>
  );
};

export default function CafeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params); 
  const id = resolvedParams.id;

  const [cafe, setCafe] = useState<CafeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  
  // State for Custom Plan Menu Filter
  const [filter, setFilter] = useState<"ALL" | "VEG" | "NON-VEG">("ALL");

  useEffect(() => {
    getCafeDetails(id).then(data => {
      // NOTE: For testing purposes, we are injecting a fake plan and menu into the data.
      const cafeDataWithMocks = {
        ...data,
        plan: data?.plan || "STARTER",
        menu: data?.menu || MOCK_DB_MENU
      };
      setCafe(cafeDataWithMocks);
      setLoading(false);
    });
  }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    try {
        const res = await joinCafeWithSerial(id);
        if (res.success) {
            window.location.reload(); 
        } else {
            alert("Error: " + res.error);
            setJoining(false);
        }
    } catch {
        setJoining(false);
    }
  };

  // --- GET DIRECTIONS LOGIC (FIXED) ---
  const openGoogleMaps = () => {
    if (!cafe) return;
    
    // Check if coordinates exist, otherwise use the cafe name and address
    const destination = (cafe.lat && cafe.lng) 
        ? `${cafe.lat},${cafe.lng}` 
        : encodeURIComponent(`${cafe.name}, ${cafe.address}`);
    
    // Correct Official Google Maps Universal Link
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(mapsUrl, "_blank");
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#FDFCFD]"><Loader2 className="animate-spin text-[#C72C48] w-8 h-8"/></div>;
  if (!cafe) return <div className="h-screen flex items-center justify-center text-zinc-500 bg-[#FDFCFD]">Cafe not found</div>;

  const isMember = cafe.cards && cafe.cards.length > 0;
  const memberCard = isMember ? cafe.cards[0] : null;

  // --- MENU FILTERING LOGIC BASED ON CAFE PLAN ---
  let displayMenu: MenuItem[] = cafe.menu || [];
  
  if (cafe.plan === "STARTER") {
    displayMenu = displayMenu.filter(item => item.isSpecial).slice(0, 20);
  } else if (cafe.plan === "GROWTH") {
    displayMenu = displayMenu.slice(0, 50);
    } else if (cafe.plan === "CUSTOM") {
    if (filter !== "ALL") {
      displayMenu = displayMenu.filter(item => item.type === filter);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFCFD] pb-24 relative selection:bg-[#C72C48] selection:text-white">
      
      {/* --- HERO IMAGE --- */}
      <div className="relative h-72 w-full bg-zinc-900">
        <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${cafe.image || "/placeholder.jpg"})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <button onClick={() => router.back()} className="absolute top-4 left-4 bg-white/20 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-white/30 transition-colors">
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="px-5 -mt-12 relative z-10 space-y-6">
        
        {/* --- CAFE INFO CARD --- */}
        <div className="bg-white rounded-[2rem] p-6 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] border border-zinc-100">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h1 className="text-2xl font-bold text-zinc-900 leading-tight font-serif tracking-tight">{cafe.name}</h1>
              <p className="text-zinc-500 text-sm flex items-start gap-1.5 mt-2 font-medium text-left">
                <MapPin size={16} className="text-[#C72C48] shrink-0 mt-0.5" /> 
                <span className="leading-snug">{cafe.address}</span>
              </p>
            </div>
            <div className="bg-rose-50 text-[#C72C48] px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 border border-rose-100 shadow-sm shrink-0">
              <Star size={12} fill="currentColor" /> {cafe.rating}
            </div>
          </div>

          {/* DEDICATED GET DIRECTIONS BUTTON */}
          <button 
            onClick={openGoogleMaps}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-zinc-50 hover:bg-rose-50 text-zinc-700 hover:text-[#C72C48] py-3 rounded-xl font-bold text-sm transition-colors border border-zinc-200 hover:border-rose-200 active:scale-95"
          >
            <Navigation size={16} />
            Get Directions
          </button>

          <p className="text-zinc-600 text-sm mt-5 leading-relaxed border-b border-zinc-100 pb-5 mb-5">
            {cafe.description || "Experience the finest atmosphere and exceptional service at our premium location. Join our exclusive membership to unlock special rewards."}
          </p>

          {/* --- MEMBERSHIP STATUS --- */}
          {isMember ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/dashboard/cards/${memberCard.id}`)}
              className="w-full bg-gradient-to-r from-zinc-900 to-zinc-800 text-white py-4 rounded-2xl font-bold flex items-center justify-between px-6 shadow-lg shadow-zinc-900/20"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-full">
                   <CreditCard size={18} className="text-rose-300" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Active Member</p>
                  <p className="text-sm font-mono tracking-widest text-rose-50">{memberCard.cardSerial || "VIEW CARD"}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-500" />
            </motion.button>
          ) : (
            <div className="bg-gradient-to-br from-rose-50 to-white border border-rose-100 p-5 rounded-2xl text-center shadow-inner">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-[#C72C48] shadow-sm border border-rose-50">
                <Lock size={18} />
              </div>
              <p className="text-zinc-900 font-bold text-sm mb-1">Exclusive Access</p>
              <p className="text-zinc-500 text-xs mb-4 leading-relaxed px-2">
                Join {cafe.name} to unlock your digital premium pass and start earning rewards.
              </p>
              <button 
                onClick={handleJoin} 
                disabled={joining}
                className="w-full bg-[#C72C48] hover:bg-[#b5253f] text-white h-12 rounded-xl text-sm font-bold shadow-lg shadow-rose-200 flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                {joining ? <Loader2 className="animate-spin" size={18} /> : "Unlock Membership"}
              </button>
            </div>
          )}
        </div>

        {/* --- DYNAMIC MENU SECTION --- */}
        <div>
          <div className="flex items-center justify-between mb-4 px-2">
             <div className="flex items-center gap-2">
                 <Coffee size={18} className="text-[#C72C48]" />
                 <h2 className="text-lg font-bold text-zinc-900 font-serif tracking-tight">
                    {cafe.plan === "STARTER" ? "Special Dishes" : "Menu Highlights"}
                 </h2>
             </div>
             
             {/* FILTER TOGGLE (VISIBLE ON GROWTH/CUSTOM, not STARTER) */}
             {cafe.plan !== "STARTER" && (
                <div className="flex bg-zinc-100 p-1 rounded-full border border-zinc-200 shadow-inner">
                   {(["ALL", "VEG", "NON-VEG"] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all ${
                           filter === type 
                            ? "bg-white text-zinc-900 shadow-sm" 
                            : "text-zinc-400 hover:text-zinc-600"
                        }`}
                      >
                         {type}
                      </button>
                   ))}
                </div>
             )}
          </div>
          
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
                {displayMenu.length === 0 ? (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-6 text-zinc-400 text-sm border border-dashed border-zinc-200 rounded-2xl">
                      No items available in this category.
                   </motion.div>
                ) : (
                    displayMenu.map((item) => (
                    <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        key={item.id} 
                        className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-1">
                        <div className="flex items-start gap-2">
                            <div className="mt-1"><DietIcon type={item.type} /></div>
                            <div>
                                <h3 className="font-bold text-zinc-900 leading-tight pr-2 group-hover:text-[#C72C48] transition-colors">{item.name}</h3>
                                {item.tag && (
                                <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider bg-rose-50 text-[#C72C48] px-2 py-0.5 rounded-md border border-rose-100">
                                    {item.tag}
                                </span>
                                )}
                            </div>
                        </div>
                        <span className="font-bold text-zinc-900 bg-zinc-50 border border-zinc-100 px-2 py-1 rounded-lg text-sm shrink-0">{item.price}</span>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed mt-2 pl-5 pr-4">
                        {item.description}
                        </p>
                    </motion.div>
                    ))
                )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
