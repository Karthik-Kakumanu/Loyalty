"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gift, Clock, CheckCircle2, Ticket, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLoyaltyData } from "@/actions/dashboard";

export default function LoyaltyPage() {
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getLoyaltyData();
        setRewards(data);
      } catch (error) {
        console.error("Failed to load rewards", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-zinc-400"><Loader2 className="animate-spin mr-2"/> Loading Rewards...</div>;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-zinc-900">My Rewards</h1>
        <p className="text-zinc-500 text-sm">Enjoy the freebies you've earned!</p>
      </motion.div>

      {/* Rewards List */}
      <div className="space-y-4">
        {rewards.length > 0 ? (
          rewards.map((reward, i) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="relative overflow-hidden border-zinc-100 shadow-sm active:scale-[0.99] transition-transform">
                <div className="flex">
                  
                  {/* Left: Ticket Stub Visual */}
                  <div className={`w-24 flex flex-col items-center justify-center p-4 ${reward.status === 'USED' ? 'bg-zinc-100' : 'bg-[#C72C48]/5'} border-r border-dashed border-zinc-200`}>
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-2 ${reward.status === 'USED' ? 'bg-zinc-200 text-zinc-400' : 'bg-white text-[#C72C48] shadow-sm'}`}>
                      {reward.status === 'USED' ? <CheckCircle2 size={24} /> : <Gift size={24} />}
                    </div>
                    <span className={`text-[10px] font-bold ${reward.status === 'USED' ? 'text-zinc-400' : 'text-[#C72C48]'}`}>
                      {reward.pointsUsed} pts
                    </span>
                  </div>

                  {/* Right: Content */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <h3 className={`font-bold text-lg ${reward.status === 'USED' ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>
                        {reward.title}
                      </h3>
                      <p className="text-sm text-zinc-500 font-medium">{reward.cafeName}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center text-xs text-zinc-400">
                        <Clock size={12} className="mr-1" />
                        Expires {reward.expiry}
                      </div>
                      
                      {reward.status === 'READY' ? (
                        <Button size="sm" className="h-8 text-xs bg-zinc-900 text-white rounded-lg px-4 hover:bg-zinc-800">
                          Redeem
                        </Button>
                      ) : (
                        <span className="text-xs font-bold text-zinc-300 bg-zinc-100 px-3 py-1.5 rounded-lg">
                          Used
                        </span>
                      )}
                    </div>
                  </div>

                </div>
                
                {/* Decorative Circles for Ticket Effect */}
                <div className="absolute -top-2 left-[5.8rem] w-4 h-4 bg-white rounded-full border border-zinc-100" />
                <div className="absolute -bottom-2 left-[5.8rem] w-4 h-4 bg-white rounded-full border border-zinc-100" />
              </Card>
            </motion.div>
          ))
        ) : (
          /* Empty State Suggestion */
          <div className="text-center py-12 opacity-60">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
              <Ticket size={32} />
            </div>
            <p className="text-zinc-900 font-medium">No rewards yet</p>
            <p className="text-xs text-zinc-500 mt-1">Keep collecting points to unlock freebies!</p>
          </div>
        )}
      </div>
    </div>
  );
}