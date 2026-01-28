import { describe, it, expect } from 'vitest';
import {
  normalizePhoneNumber,
  formatPhoneWithCountryCode,
  isValidNigerianPhone,
} from '../utils/phoneUtils';

describe('normalizePhoneNumber', () => {
  describe('handles country code prefix', () => {
    it('removes +234 prefix from phone number', () => {
      expect(normalizePhoneNumber('+2348187494741')).toBe('8187494741');
    });

    it('removes 234 prefix (without +) from phone number', () => {
      expect(normalizePhoneNumber('2348187494741')).toBe('8187494741');
    });

    it('removes +234 when pasted with spaces', () => {
      expect(normalizePhoneNumber('+234 818 749 4741')).toBe('8187494741');
    });

    it('removes +234 when pasted with dashes', () => {
      expect(normalizePhoneNumber('+234-818-749-4741')).toBe('8187494741');
    });
  });

  describe('handles local format with leading zero', () => {
    it('removes leading 0 from 11-digit number', () => {
      expect(normalizePhoneNumber('08187494741')).toBe('8187494741');
    });

    it('handles 0 prefix with spaces', () => {
      expect(normalizePhoneNumber('0818 749 4741')).toBe('8187494741');
    });
  });

  describe('handles already normalized numbers', () => {
    it('returns 10-digit number unchanged', () => {
      expect(normalizePhoneNumber('8187494741')).toBe('8187494741');
    });

    it('returns 10-digit number starting with 7 unchanged', () => {
      expect(normalizePhoneNumber('7012345678')).toBe('7012345678');
    });

    it('returns 10-digit number starting with 9 unchanged', () => {
      expect(normalizePhoneNumber('9012345678')).toBe('9012345678');
    });
  });

  describe('handles edge cases', () => {
    it('returns empty string for null input', () => {
      expect(normalizePhoneNumber(null)).toBe('');
    });

    it('returns empty string for undefined input', () => {
      expect(normalizePhoneNumber(undefined)).toBe('');
    });

    it('returns empty string for empty string input', () => {
      expect(normalizePhoneNumber('')).toBe('');
    });

    it('strips all non-digit characters', () => {
      expect(normalizePhoneNumber('abc8187494741xyz')).toBe('8187494741');
    });

    it('handles number with parentheses', () => {
      expect(normalizePhoneNumber('(234) 8187494741')).toBe('8187494741');
    });
  });

  describe('does not incorrectly strip valid leading digits', () => {
    it('does not strip 234 from short numbers', () => {
      // 2341234567 is 10 digits, should not strip 234
      expect(normalizePhoneNumber('2341234567')).toBe('2341234567');
    });

    it('does not strip 0 from short numbers', () => {
      // 0123456789 is 10 digits, should not strip 0
      expect(normalizePhoneNumber('0123456789')).toBe('0123456789');
    });
  });

  describe('prevents duplicate country code bug', () => {
    it('handles the exact bug case: +234+2348187494741', () => {
      // This was the actual bug - user pasted full number with +234
      // then the code added another +234
      // normalizePhoneNumber should handle this gracefully
      expect(normalizePhoneNumber('+234+2348187494741')).toBe('8187494741');
    });

    it('handles multiple 234 prefixes', () => {
      expect(normalizePhoneNumber('2342348187494741')).toBe('8187494741');
    });
  });
});

describe('formatPhoneWithCountryCode', () => {
  it('formats normalized number with +234 prefix', () => {
    expect(formatPhoneWithCountryCode('8187494741')).toBe('+2348187494741');
  });

  it('normalizes and formats number with existing +234', () => {
    expect(formatPhoneWithCountryCode('+2348187494741')).toBe('+2348187494741');
  });

  it('normalizes and formats number with 234 prefix', () => {
    expect(formatPhoneWithCountryCode('2348187494741')).toBe('+2348187494741');
  });

  it('normalizes and formats number with leading 0', () => {
    expect(formatPhoneWithCountryCode('08187494741')).toBe('+2348187494741');
  });

  it('returns empty string for empty input', () => {
    expect(formatPhoneWithCountryCode('')).toBe('');
  });

  it('returns empty string for null input', () => {
    expect(formatPhoneWithCountryCode(null)).toBe('');
  });
});

describe('isValidNigerianPhone', () => {
  describe('valid numbers', () => {
    it('validates number starting with 8', () => {
      expect(isValidNigerianPhone('8187494741')).toBe(true);
    });

    it('validates number starting with 7', () => {
      expect(isValidNigerianPhone('7012345678')).toBe(true);
    });

    it('validates number starting with 9', () => {
      expect(isValidNigerianPhone('9012345678')).toBe(true);
    });

    it('validates number with +234 prefix', () => {
      expect(isValidNigerianPhone('+2348187494741')).toBe(true);
    });

    it('validates number with leading 0', () => {
      expect(isValidNigerianPhone('08187494741')).toBe(true);
    });
  });

  describe('invalid numbers', () => {
    it('rejects number starting with invalid digit', () => {
      expect(isValidNigerianPhone('1234567890')).toBe(false);
    });

    it('rejects number starting with 0 (after normalization)', () => {
      // After normalization, 0123456789 stays 10 digits starting with 0
      expect(isValidNigerianPhone('0123456789')).toBe(false);
    });

    it('rejects too short number', () => {
      expect(isValidNigerianPhone('81234567')).toBe(false);
    });

    it('rejects too long number', () => {
      expect(isValidNigerianPhone('812345678901')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isValidNigerianPhone('')).toBe(false);
    });

    it('rejects null', () => {
      expect(isValidNigerianPhone(null)).toBe(false);
    });
  });
});
