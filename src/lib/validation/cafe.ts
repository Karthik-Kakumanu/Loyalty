import { z } from "zod";

export const cafeIdSchema = z.string().cuid("Invalid cafe identifier.");

export const reservationPayloadSchema = z.object({
  cafeId: cafeIdSchema,
  date: z.coerce.date().refine((date) => date.getTime() > Date.now(), {
    message: "Reservation time must be in the future.",
  }),
  guests: z.number().int().min(1, "Guests must be at least 1.").max(12, "Too many guests."),
});
