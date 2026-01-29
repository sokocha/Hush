import { describe, it, expect } from 'vitest';

/**
 * formatNaira is defined locally in multiple files with slight variations.
 * These tests cover the core variants to ensure consistency.
 *
 *   App.jsx / ExplorePage / AuthPage / ReviewsPage:
 *       (amount) => `₦${amount.toLocaleString()}`
 *
 *   ClientDashboardPage:
 *       (amount) => `₦${Math.abs(amount).toLocaleString()}`
 *
 *   CreatorDashboardPage / CreatorOnboardingPage:
 *       (amount) => `₦${(amount || 0).toLocaleString()}`
 */

// Variant A — the most common implementation (App.jsx, ExplorePage, etc.)
const formatNaira = (amount) => `₦${amount.toLocaleString()}`;

// Variant B — ClientDashboardPage (absolute value)
const formatNairaAbs = (amount) => `₦${Math.abs(amount).toLocaleString()}`;

// Variant C — CreatorDashboard / Onboarding (null-safe)
const formatNairaSafe = (amount) => `₦${(amount || 0).toLocaleString()}`;

describe('formatNaira (standard variant)', () => {
  it('formats a whole number with ₦ prefix', () => {
    expect(formatNaira(5000)).toBe('₦5,000');
  });

  it('formats zero', () => {
    expect(formatNaira(0)).toBe('₦0');
  });

  it('formats large numbers with commas', () => {
    expect(formatNaira(1000000)).toBe('₦1,000,000');
  });

  it('formats decimal numbers', () => {
    const result = formatNaira(5000.5);
    expect(result).toContain('₦');
    expect(result).toContain('5,000');
  });

  it('formats small numbers without commas', () => {
    expect(formatNaira(999)).toBe('₦999');
  });

  it('formats negative numbers', () => {
    const result = formatNaira(-5000);
    expect(result).toContain('5,000');
  });
});

describe('formatNaira (absolute value variant — ClientDashboard)', () => {
  it('converts negative to positive', () => {
    expect(formatNairaAbs(-5000)).toBe('₦5,000');
  });

  it('keeps positive unchanged', () => {
    expect(formatNairaAbs(5000)).toBe('₦5,000');
  });

  it('handles zero', () => {
    expect(formatNairaAbs(0)).toBe('₦0');
  });

  it('handles large negative', () => {
    expect(formatNairaAbs(-1000000)).toBe('₦1,000,000');
  });
});

describe('formatNaira (null-safe variant — CreatorDashboard)', () => {
  it('handles null by defaulting to 0', () => {
    expect(formatNairaSafe(null)).toBe('₦0');
  });

  it('handles undefined by defaulting to 0', () => {
    expect(formatNairaSafe(undefined)).toBe('₦0');
  });

  it('handles 0 (falsy but valid)', () => {
    expect(formatNairaSafe(0)).toBe('₦0');
  });

  it('formats normal amounts correctly', () => {
    expect(formatNairaSafe(50000)).toBe('₦50,000');
  });
});
