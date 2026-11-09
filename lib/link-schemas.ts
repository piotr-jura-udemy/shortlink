import { z } from "zod";

const RESERVED_SLUGS = new Set([
  "api",
  "app",
  "favicon.ico",
  "login",
  "signup",
]);

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(64, "Slug must be 64 characters or fewer")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Slug can only contain letters, numbers, hyphens, and underscores",
  )
  .refine((slug) => !RESERVED_SLUGS.has(slug.toLowerCase()), {
    message: "This slug is reserved",
  });

const destinationUrlSchema = z.url({
  protocol: /^https?$/,
  error: "Enter a valid http(s) URL",
});

export const createLinkSchema = z.object({
  url: destinationUrlSchema,
  slug: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .pipe(slugSchema.optional()),
});

export const updateLinkSchema = z.object({
  id: z.string().min(1),
  url: destinationUrlSchema,
  slug: slugSchema,
});
