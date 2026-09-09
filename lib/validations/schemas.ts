import { z } from "zod";
import { sanitizeHtml, sanitizeString, sanitizeFilename } from "@/lib/sanitization";
import { validatePhone, validatePincode, validateEmail } from "@/lib/validators";

/**
 * Address Input Validation Schema
 */
export const addressInputSchema = z.object({
  id: z.string().max(100).optional(),
  userId: z.string().max(100).optional(),
  label: z.enum(["Home", "Work", "Site", "Other"]).optional().default("Home"),
  fullName: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeString(val, 100) : null)),
  phone: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || validatePhone(val), {
      message: "Phone must be a valid 10-digit Indian mobile number",
    }),
  houseNumber: z
    .string()
    .max(50)
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeString(val, 50) : null)),
  buildingName: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeString(val, 100) : null)),
  floor: z
    .string()
    .max(30)
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeString(val, 30) : null)),
  street: z
    .string()
    .min(1, "Street address is required")
    .max(200, "Street address cannot exceed 200 characters")
    .transform((val) => sanitizeHtml(val)),
  area: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeString(val, 100) : null)),
  landmark: z
    .string()
    .max(150)
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeString(val, 150) : null)),
  city: z
    .string()
    .max(80)
    .optional()
    .default("Bengaluru")
    .transform((val) => sanitizeString(val, 80)),
  district: z
    .string()
    .max(80)
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeString(val, 80) : null)),
  state: z
    .string()
    .max(80)
    .optional()
    .default("Karnataka")
    .transform((val) => sanitizeString(val, 80)),
  country: z
    .string()
    .max(80)
    .optional()
    .default("India")
    .transform((val) => sanitizeString(val, 80)),
  pincode: z
    .string()
    .optional()
    .refine((val) => !val || validatePincode(val), {
      message: "Pincode must be a valid 6-digit Indian postal code",
    }),
  postalCode: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || validatePincode(val), {
      message: "Postal code must be a valid 6-digit Indian postal code",
    }),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  accuracy: z.number().min(0).max(100000).optional().nullable(),
  source: z.string().max(50).optional().default("MANUAL"),
  deliveryInstructions: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : null)),
  isDefault: z.boolean().optional().default(false),
});

/**
 * Review Submission Validation Schema
 */
export const reviewInputSchema = z.object({
  productId: z.string().min(1, "Product ID is required").max(100),
  orderId: z.string().min(1, "Order ID is required").max(100),
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  title: z
    .string()
    .max(150, "Review title cannot exceed 150 characters")
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : null)),
  body: z
    .string()
    .max(2000, "Review body cannot exceed 2000 characters")
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeHtml(val) : null)),
});

/**
 * AI Design Prompt Validation Schema
 */
export const aiGenerateInputSchema = z.object({
  prompt: z
    .string()
    .min(5, "Prompt must be at least 5 characters")
    .max(1000, "Prompt cannot exceed 1000 characters")
    .transform((val) => sanitizeHtml(val)),
  roomType: z
    .string()
    .max(50)
    .optional()
    .default("general")
    .transform((val) => sanitizeString(val, 50)),
  style: z
    .string()
    .max(50)
    .optional()
    .default("modern")
    .transform((val) => sanitizeString(val, 50)),
});

/**
 * File Upload Security Rules & Whitelist
 */
export const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export const ALLOWED_DOC_MIMES = new Set(["application/pdf"]);

export const ALLOWED_VIDEO_MIMES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/x-m4v",
]);

export const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
  ".pdf",
  ".mp4",
  ".mov",
]);

/**
 * Magic bytes validator: verifies binary file headers match claimed MIME type.
 * Protects against files disguised with fake extensions (e.g. evil.php.jpg or SVG with embedded scripts).
 */
export function verifyFileMagicBytes(buffer: Buffer): {
  valid: boolean;
  type?: "image" | "pdf" | "video";
  detectedExt?: string;
} {
  if (!buffer || buffer.length < 4) return { valid: false };

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, type: "image", detectedExt: ".jpg" };
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { valid: true, type: "image", detectedExt: ".png" };
  }

  // GIF: 47 49 46 38 ('GIF8')
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return { valid: true, type: "image", detectedExt: ".gif" };
  }

  // WebP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { valid: true, type: "image", detectedExt: ".webp" };
  }

  // PDF: %PDF (25 50 44 46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { valid: true, type: "pdf", detectedExt: ".pdf" };
  }

  // MP4 / MOV: Check for 'ftyp' or 'moov' box
  if (buffer.length >= 12) {
    const boxType = buffer.toString("latin1", 4, 8);
    if (boxType === "ftyp" || boxType === "moov" || boxType === "wide" || boxType === "mdat") {
      return { valid: true, type: "video", detectedExt: ".mp4" };
    }
  }

  return { valid: false };
}
