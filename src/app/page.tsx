import Link from "next/link";
import { Coffee, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center">
      
      {/* Logo / Icon */}
      <div className="w-20 h-20 bg-[#C72C48] rounded-3xl flex items-center justify-center text-white shadow-xl shadow-red-200 mb-8">
        <Coffee size={40} />
      </div>

      <h1 className="text-3xl font-bold text-zinc-900 mb-3 tracking-tight">
        Loyalty App
      </h1>
      
      <p className="text-zinc-500 mb-10 max-w-xs leading-relaxed">
        Collect stamps, earn rewards, and discover the best cafes in your city.
      </p>

      {/* Action Button */}
      <Link 
        href="/auth" 
        className="flex items-center gap-2 bg-[#C72C48] text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-red-200 active:scale-95 transition-transform"
      >
        Get Started <ArrowRight size={20} />
      </Link>

      <p className="mt-8 text-xs text-zinc-400 font-medium">
        Install the app for the best experience.
      </p>
    </div>
  );
}