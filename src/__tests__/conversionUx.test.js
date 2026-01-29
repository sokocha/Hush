import { describe, it, expect } from 'vitest';

/**
 * Conversion UX logic tests.
 *
 * Tests the behavioral rules for the registration prompt modal,
 * guarded actions, and browse-prompt triggers — extracted as pure
 * functions matching ExplorePage.jsx and ClientDashboardPage.jsx.
 */

// ─── Registration guard logic (ExplorePage) ──────────────────

/**
 * Determines whether toggling a favorite should show the registration
 * prompt instead of actually toggling. Mirrors guardedToggleFavorite
 * in ExplorePage.jsx.
 */
const shouldShowRegistrationPrompt = (isAuthenticated) => {
  return !isAuthenticated;
};

/**
 * Determines registration prompt message based on the action attempted.
 */
const getRegistrationPromptMessage = (action) => {
  const messages = {
    favorite: 'Create a free account to save models to your favorites.',
    contact: 'Create a free account to contact this model.',
    book: 'Create a free account to book a meetup.',
    photos: 'Create a free account to unlock photos.',
  };
  return messages[action] || 'Create a free account to continue.';
};

// ─── Browse nudge logic ──────────────────────────────────────

/**
 * Determines whether a post-browse nudge should appear.
 * In the actual UI this triggers after viewing N profiles without
 * being authenticated.
 */
const shouldShowBrowseNudge = (profilesViewed, isAuthenticated, nudgeDismissed) => {
  if (isAuthenticated) return false;
  if (nudgeDismissed) return false;
  return profilesViewed >= 3;
};

// ─── Skip button logic ──────────────────────────────────────

/**
 * Skip buttons appear in onboarding flows. They should be available
 * for optional steps but not for required steps.
 */
const isStepSkippable = (step, requiredSteps) => {
  return !requiredSteps.includes(step);
};

// ─── Tier upgrade prompt logic ───────────────────────────────

/**
 * Determines whether to show a tier upgrade prompt based on
 * user's current tier and attempted action.
 */
const shouldPromptTierUpgrade = (currentTier, requiredTier) => {
  const tierOrder = ['visitor', 'verified', 'baller', 'bossman'];
  const currentIdx = tierOrder.indexOf(currentTier);
  const requiredIdx = tierOrder.indexOf(requiredTier);
  return currentIdx < requiredIdx;
};

// ─── Tests ───────────────────────────────────────────────────

describe('shouldShowRegistrationPrompt', () => {
  it('returns true when user is NOT authenticated', () => {
    expect(shouldShowRegistrationPrompt(false)).toBe(true);
  });

  it('returns false when user IS authenticated', () => {
    expect(shouldShowRegistrationPrompt(true)).toBe(false);
  });
});

describe('getRegistrationPromptMessage', () => {
  it('returns favorite message for favorite action', () => {
    const msg = getRegistrationPromptMessage('favorite');
    expect(msg).toContain('save models');
    expect(msg).toContain('free account');
  });

  it('returns contact message for contact action', () => {
    const msg = getRegistrationPromptMessage('contact');
    expect(msg).toContain('contact');
  });

  it('returns book message for book action', () => {
    const msg = getRegistrationPromptMessage('book');
    expect(msg).toContain('book');
  });

  it('returns photos message for photos action', () => {
    const msg = getRegistrationPromptMessage('photos');
    expect(msg).toContain('unlock photos');
  });

  it('returns generic message for unknown action', () => {
    const msg = getRegistrationPromptMessage('unknown');
    expect(msg).toContain('free account');
    expect(msg).toContain('continue');
  });
});

describe('shouldShowBrowseNudge', () => {
  it('shows nudge after 3 profiles when not authenticated', () => {
    expect(shouldShowBrowseNudge(3, false, false)).toBe(true);
  });

  it('shows nudge after more than 3 profiles', () => {
    expect(shouldShowBrowseNudge(5, false, false)).toBe(true);
  });

  it('does NOT show nudge before 3 profiles', () => {
    expect(shouldShowBrowseNudge(2, false, false)).toBe(false);
  });

  it('does NOT show nudge for authenticated users', () => {
    expect(shouldShowBrowseNudge(10, true, false)).toBe(false);
  });

  it('does NOT show nudge if already dismissed', () => {
    expect(shouldShowBrowseNudge(5, false, true)).toBe(false);
  });

  it('does NOT show for authenticated even after many views', () => {
    expect(shouldShowBrowseNudge(100, true, false)).toBe(false);
  });

  it('zero profiles viewed never triggers', () => {
    expect(shouldShowBrowseNudge(0, false, false)).toBe(false);
  });
});

describe('isStepSkippable', () => {
  const requiredSteps = ['phone', 'verify-otp', 'username'];

  it('required steps are NOT skippable', () => {
    expect(isStepSkippable('phone', requiredSteps)).toBe(false);
    expect(isStepSkippable('verify-otp', requiredSteps)).toBe(false);
    expect(isStepSkippable('username', requiredSteps)).toBe(false);
  });

  it('optional steps ARE skippable', () => {
    expect(isStepSkippable('preferences', requiredSteps)).toBe(true);
    expect(isStepSkippable('body-type', requiredSteps)).toBe(true);
    expect(isStepSkippable('services', requiredSteps)).toBe(true);
  });
});

describe('shouldPromptTierUpgrade', () => {
  it('visitor needs upgrade for verified actions', () => {
    expect(shouldPromptTierUpgrade('visitor', 'verified')).toBe(true);
  });

  it('visitor needs upgrade for baller actions', () => {
    expect(shouldPromptTierUpgrade('visitor', 'baller')).toBe(true);
  });

  it('verified does NOT need upgrade for verified actions', () => {
    expect(shouldPromptTierUpgrade('verified', 'verified')).toBe(false);
  });

  it('verified needs upgrade for baller actions', () => {
    expect(shouldPromptTierUpgrade('verified', 'baller')).toBe(true);
  });

  it('baller does NOT need upgrade for verified actions', () => {
    expect(shouldPromptTierUpgrade('baller', 'verified')).toBe(false);
  });

  it('bossman never needs upgrade', () => {
    expect(shouldPromptTierUpgrade('bossman', 'visitor')).toBe(false);
    expect(shouldPromptTierUpgrade('bossman', 'verified')).toBe(false);
    expect(shouldPromptTierUpgrade('bossman', 'baller')).toBe(false);
    expect(shouldPromptTierUpgrade('bossman', 'bossman')).toBe(false);
  });

  it('same tier does not need upgrade', () => {
    expect(shouldPromptTierUpgrade('visitor', 'visitor')).toBe(false);
    expect(shouldPromptTierUpgrade('baller', 'baller')).toBe(false);
  });
});
