"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, Calendar, Users, ChevronLeft, CreditCard, Lock, Unlock } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { getCafeDetails, reserveTable, joinCafeWithSerial } from "@/actions/cafe";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function CafeDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [cafe, setCafe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState("");

  useEffect(() => {
    getCafeDetails(id).then(data => {
      setCafe(data);
      setLoading(false);
    });
  }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    const res = await joinCafeWithSerial(id);
    if (res.success) {
      window.location.reload(); // Hard refresh to update server state
    } else {
      alert("Error: " + res.error);
      setJoining(false);
    }
  };

  const handleReserve = async () => {
    if (!date) return alert("Select a date");
    const res = await reserveTable(id, new Date(date), guests);
    if (res.success) alert("Table Reserved!");
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#C72C48]"/></div>;
  if (!cafe) return <div>Cafe not found</div>;

  const isMember = cafe.cards && cafe.cards.length > 0;
  const memberCard = isMember ? cafe.cards[0] : null;

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 relative">
      
      {/* Hero Image */}
      <div className="relative h-72 w-full">
        <img src={cafe.image || "/placeholder.jpg"} className="h-full w-full object-cover" alt={cafe.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button onClick={() => router.back()} className="absolute top-4 left-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white">
          <ChevronLeft />
        </button>
      </div>

      <div className="px-5 -mt-10 relative z-10">
        <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-zinc-200/50 border border-zinc-100">
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 leading-tight">{cafe.name}</h1>
              <p className="text-zinc-500 text-sm flex items-center gap-1 mt-1">
                <MapPin size={14} /> {cafe.address}
              </p>
            </div>
            <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-yellow-100">
              <Star size={12} fill="currentColor" /> {cafe.rating}
            </div>
          </div>

          <p className="text-zinc-500 text-sm mt-4 leading-relaxed border-b border-zinc-100 pb-4 mb-4">
            {cafe.description || "Experience the best atmosphere and coffee in town."}
          </p>

          {/* === MEMBERSHIP STATUS === */}
          {isMember ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/dashboard/cards/${memberCard.id}`)}
              className="w-full bg-[#18181B] text-white py-4 rounded-2xl font-bold flex items-center justify-between px-6 shadow-lg shadow-zinc-900/20"
            >
              <div className="flex items-center gap-3">
                <CreditCard size={20} className="text-[#C72C48]" />
                <div className="text-left">
                  <p className="text-xs text-zinc-400 uppercase tracking-wider">Member ID</p>
                  <p className="text-sm font-mono tracking-widest">{memberCard.cardSerial}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-500" />
            </motion.button>
          ) : (
            <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-[#C72C48] shadow-sm">
                <Lock size={20} />
              </div>
              <p className="text-[#C72C48] font-bold text-sm mb-1">Members Only Area</p>
              <p className="text-zinc-500 text-xs mb-4 leading-relaxed">
                Join {cafe.name} to unlock exclusive rewards, digital stamp card, and table reservations.
              </p>
              <Button 
                onClick={handleJoin} 
                disabled={joining}
                className="w-full bg-[#C72C48] hover:bg-[#A01B30] text-white h-12 rounded-xl text-sm font-bold shadow-lg shadow-red-200"
              >
                {joining ? <Loader2 className="animate-spin" /> : "Unlock Membership"}
              </Button>
            </div>
          )}
        </div>

        {/* === RESERVATION (LOCKED IF NOT MEMBER) === */}
        {isMember && (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-zinc-900 mb-4 px-1">Reserve a Table</h2>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100 space-y-5">
              
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Date & Time</label>
                <div className="flex items-center gap-3 mt-2 bg-zinc-50 p-3 rounded-xl border border-zinc-200 focus-within:border-[#C72C48] transition-colors">
                  <Calendar size={18} className="text-zinc-400" />
                  <input 
                    type="datetime-local" 
                    className="bg-transparent w-full outline-none text-sm text-zinc-900"
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Guests</label>
                <div className="flex items-center gap-3 mt-2 overflow-x-auto no-scrollbar pb-1">
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <button 
                      key={num}
                      onClick={() => setGuests(num)}
                      className={`h-10 min-w-[40px] rounded-xl font-bold text-sm transition-all ${
                        guests === num 
                          ? "bg-zinc-900 text-white shadow-md" 
                          : "bg-zinc-50 text-zinc-500 border border-zinc-200"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleReserve} className="w-full h-12 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold shadow-lg">
                Confirm Reservation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}