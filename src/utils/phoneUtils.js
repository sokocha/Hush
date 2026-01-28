/**
 * Phone number utility functions
 */

/**
 * Normalize a Nigerian phone number to remove any existing country code prefix.
 * Handles various input formats:
 * - +2348187494741 -> 8187494741
 * - 2348187494741 -> 8187494741
 * - 08187494741 -> 8187494741
 * - 8187494741 -> 8187494741
 *
 * @param {string} phone - The phone number to normalize
 * @returns {string} The normalized phone number (digits only, no country code)
 */
export const normalizePhoneNumber = (phone) => {
  if (!phone) return '';

  // Remove all non-digits
  let normalized = phone.replace(/\D/g, '');

  // Keep stripping 234 prefix while present (handles duplicate prefixes like 2342348187494741)
  while (normalized.startsWith('234') && normalized.length > 10) {
    normalized = normalized.slice(3);
  }

  // Remove leading 0 if present (common Nigerian local format like 08187494741)
  if (normalized.startsWith('0') && normalized.length > 10) {
    normalized = normalized.slice(1);
  }

  return normalized;
};

/**
 * Format a phone number with Nigerian country code
 * @param {string} phone - The phone number (will be normalized first)
 * @returns {string} The formatted phone number with +234 prefix
 */
export const formatPhoneWithCountryCode = (phone) => {
  const normalized = normalizePhoneNumber(phone);
  return normalized ? `+234${normalized}` : '';
};

/**
 * Validate a Nigerian phone number
 * @param {string} phone - The phone number to validate (will be normalized first)
 * @returns {boolean} True if valid Nigerian phone number
 */
export const isValidNigerianPhone = (phone) => {
  const normalized = normalizePhoneNumber(phone);
  // Nigerian mobile numbers are 10 digits starting with 7, 8, or 9
  return /^[789]\d{9}$/.test(normalized);
};
