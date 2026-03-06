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
  <div className="p-4 flex gap-4 items-center bg-white rounded-2xl border border-zinc-100 shadow-sm animate-pulse">
    <div className="h-24 w-24 bg-zinc-200 rounded-2xl flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-5 w-3/4 bg-zinc-200 rounded" />
      <div className="h-3 w-1/2 bg-zinc-200 rounded" />
      <div className="h-4 w-1/3 bg-zinc-200 rounded mt-2" />
    </div>
    <div className="h-10 w-10 bg-zinc-200 rounded-xl" />
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
      <Card className="p-4 flex gap-4 items-center group cursor-pointer border-zinc-100 shadow-sm active:scale-[0.98] transition-transform hover:shadow-md h-full">
        {/* Cafe Image */}
        <div
          className={`h-24 w-24 rounded-2xl flex-shrink-0 bg-cover bg-center bg-zinc-100 ${cafe.image}`}
          style={getBgStyle(cafe.image)}
          role="img"
          aria-label={`Image of ${cafe.name}`}
        />

        <div className="flex-1 min-w-0 py-1">
          <div className="flex justify-between items-start mb-1 gap-2">
            <h3 className="font-bold text-zinc-900 truncate text-base leading-tight">
              {cafe.name}
            </h3>
            {isFull ? (
              <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded-full whitespace-nowrap border border-zinc-200 shrink-0">
                Full
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-full whitespace-nowrap border border-green-100 flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {tablesLeft} left
              </span>
            )}
          </div>

          <div className="flex items-center text-xs text-zinc-500 mt-1 mb-2">
            <MapPin size={12} className="mr-1 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {distance ? `${distance} km • ` : ""}
              {cafe.address}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="flex items-center bg-zinc-50 px-2 py-1 rounded-md">
              <Clock size={12} className="mr-1" aria-hidden="true" /> 10 AM - 11 PM
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isFull) onReserve(cafe);
            }}
            disabled={isFull}
            className="bg-zinc-900 text-white rounded-xl h-10 w-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:bg-zinc-800 shadow-md transition-colors hover:bg-black"
            aria-label={`Reserve table at ${cafe.name}`}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
          {/* Google Maps Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(cafe.lat, cafe.lng);
            }}
            className="bg-white border border-zinc-200 text-zinc-400 rounded-xl h-10 w-10 flex items-center justify-center active:bg-zinc-50 hover:text-[#C72C48] hover:border-[#C72C48]/30 transition-colors"
            aria-label={`Navigate to ${cafe.name}`}
          >
            <Navigation size={16} aria-hidden="true" />
          </button>
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
  <div className="pt-8">
    <h2 className="text-lg font-bold text-zinc-900 mb-4 px-1">Your Bookings</h2>

    <AnimatePresence>
      {reservations.length > 0 ? (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {reservations.map((res) => (
            <motion.div
              key={res.id}
              className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm hover:bg-zinc-50 transition-colors"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#C72C48]/10 flex items-center justify-center text-[#C72C48]">
                    <CalendarCheck size={20} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-zinc-900">{res.cafe.name}</p>
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
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                      res.status === "CONFIRMED"
                        ? "bg-green-50 text-green-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {res.status}
                  </span>
                  {res.status === "CONFIRMED" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => onModify(res)}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                        aria-label={`Modify reservation at ${res.cafe.name}`}
                      >
                        Modify
                      </button>
                      <button
                        onClick={() => onCancel(res.id)}
                        className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100 transition-colors"
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
          className="p-8 border-2 border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center text-center bg-zinc-50/50"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
            <CalendarClock size={20} className="text-zinc-400" aria-hidden="true" />
          </div>
          <p className="text-zinc-900 font-medium text-sm">No active reservations</p>
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
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-zinc-900">
            {isEditing ? "Modify Reservation" : "Reserve at"} {displayCafe?.name}
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            {isEditing ? "Update your booking details" : "Select your preferences below"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="guests" className="block text-sm font-medium text-zinc-700 mb-2">
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
              className="mt-1 block w-full rounded-lg border-zinc-300 shadow-sm focus:border-[#C72C48] focus:ring-[#C72C48] sm:text-sm px-3 py-2"
              required
              aria-describedby="guests-help"
            />
            <p id="guests-help" className="text-xs text-zinc-500 mt-1">
              Maximum 20 guests per reservation
            </p>
          </div>

          <div>
            <label htmlFor="datetime" className="block text-sm font-medium text-zinc-700 mb-2">
              <Calendar size={16} className="inline mr-1" aria-hidden="true" />
              Date & time
            </label>
            <input
              id="datetime"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="mt-1 block w-full rounded-lg border-zinc-300 shadow-sm focus:border-[#C72C48] focus:ring-[#C72C48] sm:text-sm px-3 py-2"
              required
              aria-describedby="datetime-help"
            />
            <p id="datetime-help" className="text-xs text-zinc-500 mt-1">
              Reservations must be in the future
            </p>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <p className="text-xs text-amber-800">
              You must arrive within 20 minutes of the booked time or your reservation will be automatically cancelled.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#C72C48] text-white py-3 rounded-xl shadow-lg hover:bg-[#A61E3A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {submitting ? (isEditing ? "Updating…" : "Booking…") : (isEditing ? "Update reservation" : "Confirm reservation")}
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
      <div className="w-full max-w-7xl mx-auto px-5 md:px-0 py-8 text-center">
        <div className="p-8 bg-red-50 border border-red-200 rounded-3xl">
          <AlertCircle size={48} className="text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Something went wrong</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-4">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 md:px-0 pt-2"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">
          Reserve a Table
        </h1>
        <p className="text-sm text-zinc-500 font-medium mt-1">
          Real-time availability at cafes near you.
        </p>
      </motion.div>

      {/* CONTENT AREA */}
      <div className="px-5 md:px-0">
        {/* Loading Skeletons */}
        {loading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <ReserveSkeleton key={i} />
            ))}
          </div>
        )}

        {/* LIVE CAFES LIST */}
        {!loading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <ReservationHistory reservations={reservations} onModify={handleModify} onCancel={handleCancel} />
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
