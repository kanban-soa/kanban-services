import { customAlphabet } from "nanoid";
import { PUBLIC_ID_LENGTH } from "../config/constants";

/**
 * Generate a unique public ID using nanoid
 * Format: alphanumeric characters only
 * Length: 12 characters (configurable)
 */
const generateNanoId = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  PUBLIC_ID_LENGTH
);

/**
 * Generate a unique public ID for database records
 * Used for workspace, board, member, and other entities
 */
export function generatePublicId(): string {
  return generateNanoId();
}

/**
 * Generate multiple public IDs
 */
export function generatePublicIds(count: number): string[] {
  return Array.from({ length: count }, () => generatePublicId());
}

/**
 * Validate if a string is a valid public ID
 */
export function isValidPublicId(id: string): boolean {
  if (!id || typeof id !== "string") {
    return false;
  }
  return /^[0-9A-Za-z]{12}$/.test(id);
}

/**
 * Generate a slug from a name
 * Remove spaces, convert to lowercase, replace special chars with hyphens
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug with timestamp suffix
 * Used when slug already exists
 */
export function generateUniqueSlug(baseSlug: string): string {
  const timestamp = Date.now().toString(36); // Convert to base36 for shorter string
  return `${baseSlug}-${timestamp}`;
}
