import { z } from "zod";

export const searchQuerySchema = z
  .string()
  .trim()
  .min(1, "Search query is required.")
  .max(80, "Search query is too long.");
