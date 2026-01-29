import { describe, it, expect } from 'vitest';
import { PLATFORM_CONFIG } from '../data/models';

/**
 * Tier logic from ClientDashboardPage.jsx — extracted here as pure functions
 * to test deposit thresholds, tier lookups, and color mappings.
 */

const getTierData = (tierId) => PLATFORM_CONFIG.verificationTiers[tierId];

const getTierColor = (tier) => {
  const colors = {
    visitor: { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-300", accent: "text-gray-400", solid: "bg-gray-500" },
    verified: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-300", accent: "text-blue-400", solid: "bg-blue-500" },
    baller: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-300", accent: "text-purple-400", solid: "bg-purple-500" },
    bossman: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-300", accent: "text-amber-400", solid: "bg-amber-500" },
  };
  return colors[tier] || colors.visitor;
};

// Helper: determine tier from deposit balance
const getTierFromBalance = (balance) => {
  const tiers = PLATFORM_CONFIG.verificationTiers;
  if (balance >= tiers.bossman.deposit) return 'bossman';
  if (balance >= tiers.baller.deposit) return 'baller';
  if (balance >= tiers.verified.deposit) return 'verified';
  if (balance >= tiers.visitor.deposit) return 'visitor';
  return null;
};

describe('getTierData', () => {
  it('returns visitor tier data', () => {
    const tier = getTierData('visitor');
    expect(tier).toBeDefined();
    expect(tier.name).toBe('Registered User');
    expect(tier.deposit).toBe(15000);
  });

  it('returns verified tier data', () => {
    const tier = getTierData('verified');
    expect(tier.name).toBe('Verified');
    expect(tier.deposit).toBe(30000);
  });

  it('returns baller tier data', () => {
    const tier = getTierData('baller');
    expect(tier.name).toBe('Baller');
    expect(tier.deposit).toBe(100000);
  });

  it('returns bossman tier data', () => {
    const tier = getTierData('bossman');
    expect(tier.name).toBe('Bossman');
    expect(tier.deposit).toBe(1000000);
  });

  it('returns undefined for unknown tier', () => {
    expect(getTierData('diamond')).toBeUndefined();
  });

  it('returns undefined for null/empty', () => {
    expect(getTierData(null)).toBeUndefined();
    expect(getTierData('')).toBeUndefined();
  });

  it('each tier has required fields', () => {
    const requiredFields = ['id', 'name', 'deposit', 'tagline', 'color', 'benefits'];
    for (const tierId of ['visitor', 'verified', 'baller', 'bossman']) {
      const tier = getTierData(tierId);
      for (const field of requiredFields) {
        expect(tier).toHaveProperty(field);
      }
      expect(tier.benefits.length).toBeGreaterThan(0);
    }
  });
});

describe('getTierColor', () => {
  it('returns gray colors for visitor', () => {
    const colors = getTierColor('visitor');
    expect(colors.bg).toContain('gray');
    expect(colors.border).toContain('gray');
    expect(colors.text).toContain('gray');
    expect(colors.solid).toContain('gray');
  });

  it('returns blue colors for verified', () => {
    const colors = getTierColor('verified');
    expect(colors.bg).toContain('blue');
    expect(colors.border).toContain('blue');
  });

  it('returns purple colors for baller', () => {
    const colors = getTierColor('baller');
    expect(colors.bg).toContain('purple');
    expect(colors.border).toContain('purple');
  });

  it('returns amber colors for bossman', () => {
    const colors = getTierColor('bossman');
    expect(colors.bg).toContain('amber');
    expect(colors.border).toContain('amber');
  });

  it('falls back to visitor colors for unknown tier', () => {
    const unknown = getTierColor('diamond');
    const visitor = getTierColor('visitor');
    expect(unknown).toEqual(visitor);
  });

  it('falls back to visitor for null', () => {
    const result = getTierColor(null);
    expect(result.bg).toContain('gray');
  });

  it('each color set has all required keys', () => {
    const requiredKeys = ['bg', 'border', 'text', 'accent', 'solid'];
    for (const tier of ['visitor', 'verified', 'baller', 'bossman']) {
      const colors = getTierColor(tier);
      for (const key of requiredKeys) {
        expect(colors).toHaveProperty(key);
      }
    }
  });
});

describe('tier deposit thresholds', () => {
  it('tiers are ordered by ascending deposit', () => {
    const tiers = PLATFORM_CONFIG.verificationTiers;
    expect(tiers.visitor.deposit).toBeLessThan(tiers.verified.deposit);
    expect(tiers.verified.deposit).toBeLessThan(tiers.baller.deposit);
    expect(tiers.baller.deposit).toBeLessThan(tiers.bossman.deposit);
  });

  it('visitor deposit is 15,000', () => {
    expect(PLATFORM_CONFIG.verificationTiers.visitor.deposit).toBe(15000);
  });

  it('verified deposit is 30,000', () => {
    expect(PLATFORM_CONFIG.verificationTiers.verified.deposit).toBe(30000);
  });

  it('baller deposit is 100,000', () => {
    expect(PLATFORM_CONFIG.verificationTiers.baller.deposit).toBe(100000);
  });

  it('bossman deposit is 1,000,000', () => {
    expect(PLATFORM_CONFIG.verificationTiers.bossman.deposit).toBe(1000000);
  });
});

describe('getTierFromBalance', () => {
  it('returns null for zero balance', () => {
    expect(getTierFromBalance(0)).toBeNull();
  });

  it('returns null for balance below visitor threshold', () => {
    expect(getTierFromBalance(14999)).toBeNull();
  });

  it('returns visitor at exact threshold', () => {
    expect(getTierFromBalance(15000)).toBe('visitor');
  });

  it('returns visitor between visitor and verified', () => {
    expect(getTierFromBalance(20000)).toBe('visitor');
  });

  it('returns verified at exact threshold', () => {
    expect(getTierFromBalance(30000)).toBe('verified');
  });

  it('returns verified between verified and baller', () => {
    expect(getTierFromBalance(75000)).toBe('verified');
  });

  it('returns baller at exact threshold', () => {
    expect(getTierFromBalance(100000)).toBe('baller');
  });

  it('returns baller between baller and bossman', () => {
    expect(getTierFromBalance(500000)).toBe('baller');
  });

  it('returns bossman at exact threshold', () => {
    expect(getTierFromBalance(1000000)).toBe('bossman');
  });

  it('returns bossman for very large balance', () => {
    expect(getTierFromBalance(10000000)).toBe('bossman');
  });
});
