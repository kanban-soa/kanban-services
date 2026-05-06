import { customAlphabet } from 'nanoid';

/**
 * Defines the alphabet for generating unique IDs.
 * It includes numbers (0-9), uppercase letters (A-Z), and lowercase letters (a-z).
 */
const alphabet =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Creates a custom nanoid generator.
 * This generator uses the defined alphabet and creates IDs of length 12.
 */
const nanoid = customAlphabet(alphabet, 12);

/**
 * Generates a unique public ID.
 * @returns {string} A 12-character unique ID.
 */
export function generatePublicId() {
  return nanoid();
}
