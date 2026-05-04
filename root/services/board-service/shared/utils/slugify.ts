/**
 * Converts a string into a URL-friendly slug.
 *
 * @param {string} text - The string to slugify.
 * @returns {string} The slugified string.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple hyphens with a single hyphen
    .replace(/^-+/, '') // Trim hyphens from the start of the text
    .replace(/-+$/, ''); // Trim hyphens from the end of the text
}
