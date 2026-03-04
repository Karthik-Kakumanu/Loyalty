"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { joinCafeWithSerial } from "@/actions/cafe";

const QrScanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((module) => module.Scanner),
  { ssr: false },
);

interface ScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export function Scanner({ isOpen, onClose, onScan }: ScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const closeScanner = () => {
    setError(null);
    setIsProcessing(false);
    onClose();
  };

  const handleScan = async (rawValue: string) => {
    if (isProcessing) return;

    const normalized = rawValue.trim();
    if (!normalized) return;

    const cafeId = normalized
      .replace(/^REVISTRA:\/\/cafe\//i, "")
      .replace(/^loyaltyapp:\/\/cafe\//i, "");

    setIsProcessing(true);
    setError(null);

    try {
      const result = await joinCafeWithSerial(cafeId);

      if (result.success) {
        onScan(cafeId);
        closeScanner();
        router.refresh();
        router.push(`/dashboard/cards/${result.cardId}`);
        return;
      }

      setError(result.error || "Invalid QR code.");
      setIsProcessing(false);
    } catch {
      setError("Failed to process code.");
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black"
        >
          <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4 pt-safe">
            <h2 className="pl-2 text-lg font-bold text-white">Scan Cafe QR</h2>
            <button
              type="button"
              onClick={closeScanner}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur"
              aria-label="Close scanner"
            >
              <X size={22} />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black">
            <div className="absolute inset-0">
              <QrScanner
                onScan={(result) => {
                  const raw = result?.[0]?.rawValue ?? "";
                  void handleScan(raw);
                }}
                onError={() => setError("Camera access unavailable.")}
                components={{ finder: false }}
                styles={{ container: { width: "100%", height: "100%" } }}
              />
            </div>

            <AnimatePresence>
              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-2xl bg-red-500/95 px-6 py-3 text-white shadow-xl"
                >
                  <AlertCircle size={20} />
                  <span className="text-sm font-bold">{error}</span>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {isProcessing ? (
              <div className="absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 rounded-2xl bg-black/70 px-8 py-4 text-white backdrop-blur">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/90">
                  Creating Card...
                </span>
              </div>
            ) : null}

            <div className="pointer-events-none relative z-10 h-64 w-64 rounded-[2rem] border-2 border-white/20 md:h-80 md:w-80">
              <div className="absolute left-0 top-0 h-10 w-10 rounded-tl-2xl border-l-[4px] border-t-[4px] border-[var(--brand)]" />
              <div className="absolute right-0 top-0 h-10 w-10 rounded-tr-2xl border-r-[4px] border-t-[4px] border-[var(--brand)]" />
              <div className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-2xl border-b-[4px] border-l-[4px] border-[var(--brand)]" />
              <div className="absolute bottom-0 right-0 h-10 w-10 rounded-br-2xl border-b-[4px] border-r-[4px] border-[var(--brand)]" />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
