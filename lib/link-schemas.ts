import { z } from "zod";

const RESERVED_SLUGS = new Set(["api", "favicon.ico"]);

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

export const createLinkSchema = z.object({
  url: z.url("Enter a valid URL"),
  slug: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .pipe(slugSchema.optional()),
});

export const updateLinkSchema = z.object({
  id: z.string().min(1),
  url: z.url("Enter a valid URL"),
  slug: slugSchema,
});
