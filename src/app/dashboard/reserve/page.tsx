"use client";

import { useCallback, useEffect, useMemo, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarClock,
  MapPin,
  ChevronRight,
  Clock,
  CalendarCheck,
  Navigation,
  Users,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { toast } from "sonner";
import { getReserveData } from "@/actions/dashboard";
import { reserveTable, cancelReservation, modifyReservation } from "@/actions/cafe";

// --- UTILS: Calculate Real Distance ---
const calculateDistance = (
  lat1: number | null | undefined,
  lon1: number | null | undefined,
  lat2: number | null | undefined,
  lon2: number | null | undefined,
): string | null => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

// Helper for image handling (URL vs Tailwind Class)
const getBgStyle = (imageString: string | null | undefined) => {
  if (imageString?.startsWith("http") || imageString?.startsWith("/")) {
    return { backgroundImage: `url(${imageString})` };
  }
  return {};
};

type ReserveData = Awaited<ReturnType<typeof getReserveData>>;
type ReserveCafe = ReserveData["cafes"][number];
type UserReservation = ReserveData["reservations"][number];

// --- Custom Hook: Use Reserve Data ---
const useReserveData = () => {
  const [data, setData] = useState<ReserveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getReserveData();
      setData(res);
    } catch (err) {
      console.error("Error loading reserve data", err);
      setError("Failed to load reservation data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// --- Custom Hook: Use User Location ---
const useUserLocation = () => {
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn("Geolocation error:", err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return userLoc;
};

// --- Component: Reserve Skeleton ---
const ReserveSkeleton = memo(() => (
  <div className="p-3 sm:p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm animate-pulse">
    <div className="h-20 sm:h-24 w-full sm:w-24 bg-zinc-200 rounded-2xl mb-3 sm:mb-0 sm:float-left sm:mr-4" />
    <div className="space-y-2">
      <div className="h-4 sm:h-5 w-3/4 bg-zinc-200 rounded" />
      <div className="h-3 w-1/2 bg-zinc-200 rounded" />
      <div className="h-3 w-2/3 bg-zinc-200 rounded mt-2" />
    </div>
  </div>
));
ReserveSkeleton.displayName = "ReserveSkeleton";

// --- Component: Cafe Card ---
const CafeCard = memo<{
  cafe: ReserveCafe;
  index: number;
  userLoc: { lat: number; lng: number } | null;
  onReserve: (cafe: ReserveCafe) => void;
  onNavigate: (lat: number | null | undefined, lng: number | null | undefined) => void;
}>(({ cafe, index, userLoc, onReserve, onNavigate }) => {
  const tablesLeft = useMemo(
    () => Math.max(0, cafe.totalTables - (cafe._count?.reservations || 0)),
    [cafe.totalTables, cafe._count?.reservations]
  );
  const isFull = tablesLeft === 0;
  const distance = useMemo(
    () =>
      userLoc && cafe.lat != null && cafe.lng != null
        ? calculateDistance(userLoc.lat, userLoc.lng, cafe.lat, cafe.lng)
        : null,
    [userLoc, cafe.lat, cafe.lng]
  );

  return (
    <motion.div
      key={cafe.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="p-3 sm:p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm active:scale-[0.98] transition-all hover:shadow-md cursor-pointer">
        {/* Mobile: Image above, Desktop: Image left */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div
            className={`h-32 sm:h-24 w-full sm:w-24 rounded-2xl flex-shrink-0 bg-cover bg-center bg-zinc-100 ${cafe.image}`}
            style={getBgStyle(cafe.image)}
            role="img"
            aria-label={`Image of ${cafe.name}`}
          />

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="font-bold text-zinc-900 text-sm sm:text-base leading-tight">
                  {cafe.name}
                </h3>
                {isFull ? (
                  <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap border border-zinc-200 shrink-0">
                    Full
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap border border-green-100 flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    {tablesLeft}
                  </span>
                )}
              </div>

              <div className="flex items-center text-xs text-zinc-500 mb-2">
                <MapPin size={12} className="mr-1 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {distance ? `${distance} km • ` : ""}
                  {cafe.address}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Clock size={12} className="flex-shrink-0" aria-hidden="true" />
                <span>10 AM - 11 PM</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-3 sm:mt-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isFull) onReserve(cafe);
                }}
                disabled={isFull}
                className="flex-1 sm:flex-none bg-[#C72C48] text-white rounded-lg sm:rounded-xl h-10 sm:w-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:bg-[#A61E3A] shadow-md transition-colors hover:bg-[#A61E3A] text-sm sm:text-base font-medium sm:font-normal"
                aria-label={`Reserve table at ${cafe.name}`}
              >
                <ChevronRight size={20} className="hidden sm:block" aria-hidden="true" />
                <span className="sm:hidden">Reserve</span>
              </button>
              {/* Google Maps Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(cafe.lat, cafe.lng);
                }}
                className="h-10 w-10 border border-zinc-200 text-zinc-400 rounded-lg sm:rounded-xl flex items-center justify-center active:bg-zinc-50 hover:text-[#C72C48] hover:border-[#C72C48]/30 transition-colors bg-white"
                aria-label={`Navigate to ${cafe.name}`}
              >
                <Navigation size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});
CafeCard.displayName = "CafeCard";

// --- Component: Reservation History ---
const ReservationHistory = memo<{ 
  reservations: UserReservation[];
  onModify: (res: UserReservation) => void;
  onCancel: (resId: string) => void;
}>(({ reservations, onModify, onCancel }) => (
  <div className="pt-6 sm:pt-8">
    <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3 sm:mb-4 px-1">Your Bookings</h2>

    <AnimatePresence>
      {reservations.length > 0 ? (
        <motion.div
          className="space-y-2 sm:space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {reservations.map((res) => (
            <motion.div
              key={res.id}
              className="p-3 sm:p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm hover:bg-zinc-50 transition-colors"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-[#C72C48]/10 flex items-center justify-center text-[#C72C48] flex-shrink-0">
                    <CalendarCheck size={18} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs sm:text-sm text-zinc-900 truncate">{res.cafe.name}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(res.date).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap ${
                      res.status === "CONFIRMED"
                        ? "bg-green-50 text-green-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {res.status}
                  </span>
                  {res.status === "CONFIRMED" && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => onModify(res)}
                        className="flex-1 sm:flex-none text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors font-medium"
                        aria-label={`Modify reservation at ${res.cafe.name}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onCancel(res.id)}
                        className="flex-1 sm:flex-none text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100 transition-colors font-medium"
                        aria-label={`Cancel reservation at ${res.cafe.name}`}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="p-6 sm:p-8 border-2 border-dashed border-zinc-200 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-center bg-zinc-50/50"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 sm:mb-3">
            <CalendarClock size={18} className="text-zinc-400" aria-hidden="true" />
          </div>
          <p className="text-zinc-900 font-medium text-xs sm:text-sm">No active reservations</p>
          <p className="text-zinc-400 text-xs mt-1">Book a table to see it here.</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
));
ReservationHistory.displayName = "ReservationHistory";

// --- Component: Reservation Modal ---
const ReservationModal = memo<{
  cafe: ReserveCafe | null;
  editingReservation: UserReservation | null;
  onClose: () => void;
  onSuccess: () => void;
}>(({ cafe, editingReservation, onClose, onSuccess }) => {
  const [guests, setGuests] = useState(editingReservation?.guests.toString() || "1");
  const [dateTime, setDateTime] = useState(
    editingReservation ? new Date(editingReservation.date).toISOString().slice(0, 16) : ""
  );
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!editingReservation;

  useEffect(() => {
    if (editingReservation) {
      setGuests(editingReservation.guests.toString());
      setDateTime(new Date(editingReservation.date).toISOString().slice(0, 16));
    } else {
      setGuests("1");
      setDateTime("");
    }
  }, [editingReservation]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!cafe && !editingReservation) return;
      setSubmitting(true);
      try {
        let result;
        if (isEditing && editingReservation) {
          result = await modifyReservation(
            editingReservation.id,
            new Date(dateTime),
            parseInt(guests, 10) || 1,
          );
        } else if (cafe) {
          result = await reserveTable(
            cafe.id,
            new Date(dateTime),
            parseInt(guests, 10) || 1,
          );
        }
        if (result?.success) {
          toast.success(
            isEditing
              ? "Reservation updated successfully!"
              : "Table booked! Please arrive within 20 minutes or your reservation will be cancelled.",
            { duration: 6000 }
          );
          onSuccess();
          onClose();
        } else {
          toast.error(result?.error || "Unable to process reservation.");
        }
      } catch (err) {
        console.error("Reservation error:", err);
        toast.error("An unexpected error occurred. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [cafe, editingReservation, dateTime, guests, onClose, onSuccess, isEditing]
  );

  if (!cafe && !editingReservation) return null;

  const displayCafe = cafe || editingReservation?.cafe;

  return (
    <Modal open={!!cafe || !!editingReservation} onClose={onClose}>
      <div className="space-y-5 sm:space-y-6">
        <div className="text-center">
          <h3 className="text-lg sm:text-xl font-bold text-zinc-900">
            {isEditing ? "Modify" : "Reserve at"} {displayCafe?.name}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            {isEditing ? "Update booking details" : "Choose your preferences"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="guests" className="block text-xs sm:text-sm font-medium text-zinc-700 mb-2">
              <Users size={16} className="inline mr-1" aria-hidden="true" />
              Number of guests
            </label>
            <input
              id="guests"
              type="number"
              min={1}
              max={20}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 shadow-sm focus:border-[#C72C48] focus:ring-[#C72C48] text-sm px-3 py-2.5"
              required
              aria-describedby="guests-help"
            />
            <p id="guests-help" className="text-xs text-zinc-500 mt-1">
              1-20 guests
            </p>
          </div>

          <div>
            <label htmlFor="datetime" className="block text-xs sm:text-sm font-medium text-zinc-700 mb-2">
              <Calendar size={16} className="inline mr-1" aria-hidden="true" />
              Date & time
            </label>
            <input
              id="datetime"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full rounded-lg border border-zinc-300 shadow-sm focus:border-[#C72C48] focus:ring-[#C72C48] text-sm px-3 py-2.5"
              required
              aria-describedby="datetime-help"
            />
            <p id="datetime-help" className="text-xs text-zinc-500 mt-1">
              Must be in the future
            </p>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle size={14} className="text-amber-600 mt-1 flex-shrink-0" aria-hidden="true" />
            <p className="text-xs text-amber-800">
              Arrive within 20 minutes or your reservation will be cancelled automatically.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#C72C48] text-white py-3 rounded-lg sm:rounded-xl shadow-lg hover:bg-[#A61E3A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
          >
            {submitting ? (isEditing ? "Updating…" : "Booking…") : (isEditing ? "Update" : "Confirm")}
          </button>
        </form>
      </div>
    </Modal>
  );
});
ReservationModal.displayName = "ReservationModal";

// --- Main Component ---
export default function ReservePage() {
  const { data, loading, error, refetch } = useReserveData();
  const userLoc = useUserLocation();
  const [selectedCafe, setSelectedCafe] = useState<ReserveCafe | null>(null);
  const [editingReservation, setEditingReservation] = useState<UserReservation | null>(null);

  const reservations = useMemo(() => data?.reservations ?? [], [data?.reservations]);

  const handleNavigate = useCallback((lat?: number | null, lng?: number | null) => {
    if (lat != null && lng != null) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank", "noopener,noreferrer");
    }
  }, []);

  const handleReserveSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleModify = useCallback((res: UserReservation) => {
    setEditingReservation(res);
  }, []);

  const handleCancel = useCallback(async (resId: string) => {
    if (confirm("Are you sure you want to cancel this reservation?")) {
      try {
        const result = await cancelReservation(resId);
        if (result.success) {
          toast.success("Reservation cancelled successfully.");
          refetch();
        } else {
          toast.error(result.error || "Unable to cancel reservation.");
        }
      } catch (err) {
        console.error("Cancel error:", err);
        toast.error("An unexpected error occurred.");
      }
    }
  }, [refetch]);

  if (error) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center px-4 sm:px-5">
        <div className="p-6 sm:p-8 bg-red-50 border border-red-200 rounded-2xl sm:rounded-3xl max-w-md text-center">
          <AlertCircle size={40} className="text-red-600 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-bold text-red-900 mb-2">Something went wrong</h2>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <button
            onClick={refetch}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 sm:px-5 pt-4 sm:pt-6 pb-4 sm:pb-6 border-b border-zinc-100"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
          Reserve a Table
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-1">
          Real-time availability at cafes near you
        </p>
      </motion.div>

      {/* CONTENT AREA */}
      <div className="px-4 sm:px-5 py-4 sm:py-6 space-y-6 sm:space-y-8 max-w-6xl mx-auto">
        {/* Loading Skeletons */}
        {loading && (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <ReserveSkeleton key={i} />
            ))}
          </div>
        )}

        {/* LIVE CAFES LIST */}
        {!loading && (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-max">
            {data?.cafes?.map((cafe, i) => (
              <CafeCard
                key={cafe.id}
                cafe={cafe}
                index={i}
                userLoc={userLoc}
                onReserve={setSelectedCafe}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}

        {/* USER BOOKING HISTORY */}
        <div className="border-t border-zinc-100 pt-6 sm:pt-8">
          <ReservationHistory reservations={reservations} onModify={handleModify} onCancel={handleCancel} />
        </div>
      </div>

      {/* RESERVATION MODAL */}
      <ReservationModal
        cafe={selectedCafe}
        editingReservation={editingReservation}
        onClose={() => {
          setSelectedCafe(null);
          setEditingReservation(null);
        }}
        onSuccess={handleReserveSuccess}
      />
    </div>
  );
}
