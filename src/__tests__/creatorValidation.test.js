import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════
// Physical Step Validation (extracted from AuthPage CreatorPhysicalStep)
// ═══════════════════════════════════════════════════════════

function validatePhysicalStep(data) {
  const errors = {};
  if (!data.bodyType) errors.bodyType = 'Please select your body type';
  if (!data.age) {
    errors.age = 'Please enter your age';
  } else {
    const ageNum = parseInt(data.age, 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 60) {
      errors.age = 'Age must be between 18 and 60';
    }
  }
  return errors;
}

// ═══════════════════════════════════════════════════════════
// Pricing Validation (extracted from CreatorOnboardingPage)
// ═══════════════════════════════════════════════════════════

function validatePricing(pricingData) {
  return (
    pricingData.unlockContact > 0 &&
    pricingData.unlockPhotos > 0 &&
    pricingData.meetupIncall1 > 0 &&
    pricingData.meetupIncall2 > 0 &&
    pricingData.meetupIncallOvernight > 0
  );
}

function getMissingPricingFields(pricingData) {
  const missing = [];
  if (!pricingData.unlockContact || pricingData.unlockContact <= 0) missing.push('Contact Unlock');
  if (!pricingData.unlockPhotos || pricingData.unlockPhotos <= 0) missing.push('Photos Unlock');
  if (!pricingData.meetupIncall1 || pricingData.meetupIncall1 <= 0) missing.push('Incall 1hr');
  if (!pricingData.meetupIncall2 || pricingData.meetupIncall2 <= 0) missing.push('Incall 2hr');
  if (!pricingData.meetupIncallOvernight || pricingData.meetupIncallOvernight <= 0) missing.push('Incall Overnight');
  return missing;
}

// ═══════════════════════════════════════════════════════════
// Basic Info Validation (extracted from AuthPage CreatorBasicInfoStep)
// ═══════════════════════════════════════════════════════════

function validateBasicInfo(data) {
  const errors = {};
  if (data.name.trim().length < 2) errors.name = 'Name is required';
  if (data.username.trim().length < 3) errors.username = 'Username must be at least 3 characters';
  if (!/^[a-z0-9_]+$/.test(data.username)) errors.username = 'Only lowercase letters, numbers, and underscores';
  if (!data.location) errors.location = 'Please select your location';
  if (data.areas.length === 0) errors.areas = 'Please select at least one area';
  return errors;
}

// ═══════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════

describe('CreatorPhysicalStep validation', () => {
  describe('body type validation', () => {
    it('requires body type selection', () => {
      const errors = validatePhysicalStep({ bodyType: '', age: '24' });
      expect(errors.bodyType).toBe('Please select your body type');
    });

    it('accepts valid body type', () => {
      const errors = validatePhysicalStep({ bodyType: 'Slim', age: '24' });
      expect(errors.bodyType).toBeUndefined();
    });

    it('rejects null body type', () => {
      const errors = validatePhysicalStep({ bodyType: null, age: '24' });
      expect(errors.bodyType).toBeDefined();
    });
  });

  describe('age validation', () => {
    it('requires age to be provided', () => {
      const errors = validatePhysicalStep({ bodyType: 'Slim', age: '' });
      expect(errors.age).toBe('Please enter your age');
    });

    it('rejects age below 18', () => {
      const errors = validatePhysicalStep({ bodyType: 'Slim', age: '17' });
      expect(errors.age).toBe('Age must be between 18 and 60');
    });

    it('rejects age above 60', () => {
      const errors = validatePhysicalStep({ bodyType: 'Slim', age: '61' });
      expect(errors.age).toBe('Age must be between 18 and 60');
    });

    it('accepts age at lower boundary (18)', () => {
      const errors = validatePhysicalStep({ bodyType: 'Slim', age: '18' });
      expect(errors.age).toBeUndefined();
    });

    it('accepts age at upper boundary (60)', () => {
      const errors = validatePhysicalStep({ bodyType: 'Slim', age: '60' });
      expect(errors.age).toBeUndefined();
    });

    it('accepts typical age (24)', () => {
      const errors = validatePhysicalStep({ bodyType: 'Athletic', age: '24' });
      expect(errors.age).toBeUndefined();
    });

    it('rejects non-numeric age', () => {
      const errors = validatePhysicalStep({ bodyType: 'Slim', age: 'abc' });
      expect(errors.age).toBe('Age must be between 18 and 60');
    });

    it('rejects null age', () => {
      const errors = validatePhysicalStep({ bodyType: 'Slim', age: null });
      expect(errors.age).toBe('Please enter your age');
    });
  });

  describe('combined validation', () => {
    it('returns no errors for fully valid data', () => {
      const errors = validatePhysicalStep({ bodyType: 'Curvy', age: '25' });
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('returns multiple errors when both fields missing', () => {
      const errors = validatePhysicalStep({ bodyType: '', age: '' });
      expect(errors.bodyType).toBeDefined();
      expect(errors.age).toBeDefined();
      expect(Object.keys(errors)).toHaveLength(2);
    });
  });
});

describe('pricing validation', () => {
  const VALID_PRICING = {
    unlockContact: 1000, unlockPhotos: 5000,
    meetupIncall1: 50000, meetupIncall2: 80000, meetupIncallOvernight: 150000,
  };

  describe('validatePricing', () => {
    it('returns true when all required fields are filled', () => {
      expect(validatePricing(VALID_PRICING)).toBe(true);
    });

    it('returns false when unlockContact is 0', () => {
      expect(validatePricing({ ...VALID_PRICING, unlockContact: 0 })).toBe(false);
    });

    it('returns false when unlockPhotos is 0', () => {
      expect(validatePricing({ ...VALID_PRICING, unlockPhotos: 0 })).toBe(false);
    });

    it('returns false when meetupIncall1 is 0', () => {
      expect(validatePricing({ ...VALID_PRICING, meetupIncall1: 0 })).toBe(false);
    });

    it('returns false when meetupIncall2 is 0', () => {
      expect(validatePricing({ ...VALID_PRICING, meetupIncall2: 0 })).toBe(false);
    });

    it('returns false when meetupIncallOvernight is 0', () => {
      expect(validatePricing({ ...VALID_PRICING, meetupIncallOvernight: 0 })).toBe(false);
    });

    it('returns false when all fields are 0', () => {
      expect(validatePricing({
        unlockContact: 0, unlockPhotos: 0,
        meetupIncall1: 0, meetupIncall2: 0, meetupIncallOvernight: 0,
      })).toBe(false);
    });

    it('returns false for negative values', () => {
      expect(validatePricing({ ...VALID_PRICING, meetupIncall1: -5000 })).toBe(false);
    });
  });

  describe('getMissingPricingFields', () => {
    it('returns empty array when all fields are valid', () => {
      expect(getMissingPricingFields(VALID_PRICING)).toEqual([]);
    });

    it('identifies single missing field', () => {
      const missing = getMissingPricingFields({ ...VALID_PRICING, unlockContact: 0 });
      expect(missing).toEqual(['Contact Unlock']);
    });

    it('identifies multiple missing fields', () => {
      const missing = getMissingPricingFields({
        unlockContact: 0, unlockPhotos: 0,
        meetupIncall1: 50000, meetupIncall2: 0, meetupIncallOvernight: 150000,
      });
      expect(missing).toContain('Contact Unlock');
      expect(missing).toContain('Photos Unlock');
      expect(missing).toContain('Incall 2hr');
      expect(missing).toHaveLength(3);
    });

    it('lists all 5 fields when everything is 0', () => {
      const missing = getMissingPricingFields({
        unlockContact: 0, unlockPhotos: 0,
        meetupIncall1: 0, meetupIncall2: 0, meetupIncallOvernight: 0,
      });
      expect(missing).toHaveLength(5);
    });

    it('handles undefined fields as missing', () => {
      const missing = getMissingPricingFields({});
      expect(missing).toHaveLength(5);
    });
  });
});

describe('CreatorBasicInfoStep validation', () => {
  const VALID_DATA = {
    name: 'Destiny', username: 'destiny_x',
    location: 'Lagos', areas: ['Lekki'],
  };

  it('returns no errors for valid data', () => {
    const errors = validateBasicInfo(VALID_DATA);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('requires display name of at least 2 characters', () => {
    const errors = validateBasicInfo({ ...VALID_DATA, name: 'D' });
    expect(errors.name).toBe('Name is required');
  });

  it('rejects whitespace-only name', () => {
    const errors = validateBasicInfo({ ...VALID_DATA, name: '   ' });
    expect(errors.name).toBeDefined();
  });

  it('requires username of at least 3 characters', () => {
    const errors = validateBasicInfo({ ...VALID_DATA, username: 'ab' });
    expect(errors.username).toBeDefined();
  });

  it('rejects uppercase in username', () => {
    const errors = validateBasicInfo({ ...VALID_DATA, username: 'Destiny' });
    expect(errors.username).toBe('Only lowercase letters, numbers, and underscores');
  });

  it('rejects special characters in username', () => {
    const errors = validateBasicInfo({ ...VALID_DATA, username: 'dest!ny' });
    expect(errors.username).toBeDefined();
  });

  it('allows underscores and numbers in username', () => {
    const errors = validateBasicInfo({ ...VALID_DATA, username: 'destiny_123' });
    expect(errors.username).toBeUndefined();
  });

  it('requires location', () => {
    const errors = validateBasicInfo({ ...VALID_DATA, location: '' });
    expect(errors.location).toBe('Please select your location');
  });

  it('requires at least one area', () => {
    const errors = validateBasicInfo({ ...VALID_DATA, areas: [] });
    expect(errors.areas).toBe('Please select at least one area');
  });
});
