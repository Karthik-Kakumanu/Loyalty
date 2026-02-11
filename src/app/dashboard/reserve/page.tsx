"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, MapPin, ChevronRight, Clock, Loader2, CalendarCheck, Navigation } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getReserveData } from "@/actions/dashboard";

// --- UTILS: Calculate Real Distance ---
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
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

// Helper for image handling (URL vs Tailwind Class)
const getBgStyle = (imageString: string) => {
  if (imageString?.startsWith("http") || imageString?.startsWith("/")) {
    return { backgroundImage: `url(${imageString})` };
  }
  return {}; 
};

export default function ReservePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await getReserveData();
        setData(res);
      } catch (error) {
        console.error("Error loading reserve data", error);
      } finally {
        setLoading(false);
      }
    }
    load();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  const handleNavigate = (lat?: number, lng?: number) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-zinc-400"><Loader2 className="animate-spin mr-2"/> Loading Availability...</div>;

  return (
    <div className="space-y-8 pb-24">
      
      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-zinc-900">Reserve a Table</h1>
        <p className="text-zinc-500 text-sm">Real-time availability at cafes near you.</p>
      </motion.div>

      {/* --- LIVE CAFES LIST --- */}
      <div className="grid gap-4">
        {data?.cafes?.map((cafe: any, i: number) => {
          // Calculate Tables: Total - Active Reservations
          // Uses db._count field we fetched
          const tablesLeft = Math.max(0, cafe.totalTables - (cafe._count?.reservations || 0));
          const isFull = tablesLeft === 0;
          const distance = userLoc && cafe.lat && cafe.lng ? calculateDistance(userLoc.lat, userLoc.lng, cafe.lat, cafe.lng) : null;
          
          return (
            <motion.div
              key={cafe.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-4 flex gap-4 items-center group cursor-pointer border-zinc-100 shadow-sm active:scale-[0.98] transition-transform hover:shadow-md">
                
                {/* Cafe Image */}
                <div 
                  className={`h-24 w-24 rounded-2xl flex-shrink-0 bg-cover bg-center bg-zinc-100 ${cafe.image}`} 
                  style={getBgStyle(cafe.image)}
                />

                <div className="flex-1 min-w-0 py-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-zinc-900 truncate text-base">{cafe.name}</h3>
                    {isFull ? (
                      <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded-full whitespace-nowrap border border-zinc-200">
                        Full
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-full whitespace-nowrap border border-green-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        {tablesLeft} left
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-xs text-zinc-500 mt-1 mb-2">
                    <MapPin size={12} className="mr-1 shrink-0" />
                    <span className="truncate">
                      {distance ? `${distance} km • ` : ""}{cafe.address}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                     <span className="flex items-center bg-zinc-50 px-2 py-1 rounded-md">
                       <Clock size={12} className="mr-1"/> 10 AM - 11 PM
                     </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    disabled={isFull}
                    className="bg-zinc-900 text-white rounded-xl h-10 w-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:bg-zinc-800 shadow-md transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                  {/* Google Maps Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(cafe.lat, cafe.lng);
                    }}
                    className="bg-white border border-zinc-200 text-zinc-400 rounded-xl h-10 w-10 flex items-center justify-center active:bg-zinc-50 hover:text-[#C72C48] hover:border-[#C72C48]/30 transition-colors"
                  >
                    <Navigation size={16} />
                  </button>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* --- USER BOOKING HISTORY --- */}
      <div className="pt-6">
        <h2 className="text-lg font-bold text-zinc-900 mb-4">Your Bookings</h2>
        
        {data?.reservations?.length > 0 ? (
          <div className="space-y-3">
            {data.reservations.map((res: any) => (
              <div key={res.id} className="p-4 bg-white border border-zinc-100 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#C72C48]/10 flex items-center justify-center text-[#C72C48]">
                    <CalendarCheck size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-zinc-900">{res.cafe.name}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(res.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                  res.status === 'CONFIRMED' ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-500'
                }`}>
                  {res.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center text-center bg-zinc-50/50">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
               <CalendarClock size={20} className="text-zinc-400" />
             </div>
             <p className="text-zinc-900 font-medium text-sm">No active reservations</p>
             <p className="text-zinc-400 text-xs mt-1">Book a table to see it here.</p>
          </div>
        )}
      </div>

    </div>
  );
}