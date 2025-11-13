// frontend/src/utils/reelTiers.ts

import { TIER_STYLES } from '../config/theme';

export const getValueTierColor = (value: number): string => {
  if (value === 3_000_000) return TIER_STYLES.legendary.text;
  if (value >= 2_000_000) return TIER_STYLES.gold.text;
  if (value >= 1_000_000) return TIER_STYLES.hot.text;
  if (value >= 500_000) return TIER_STYLES.medium.text;
  return TIER_STYLES.cool.text;
};

export const getValueTierBorder = (value: number): string => {
  if (value === 3_000_000) return TIER_STYLES.legendary.border;
  if (value >= 2_000_000) return TIER_STYLES.gold.border;
  if (value >= 1_000_000) return TIER_STYLES.hot.border;
  if (value >= 500_000) return TIER_STYLES.medium.border;
  return TIER_STYLES.cool.border;
};

export const getValueTierGlow = (value: number): string => {
  if (value === 3_000_000) return TIER_STYLES.legendary.glow;
  if (value >= 2_000_000) return TIER_STYLES.gold.glow;
  if (value >= 1_000_000) return TIER_STYLES.hot.glow;
  if (value >= 500_000) return TIER_STYLES.medium.glow;
  return TIER_STYLES.cool.glow;
};

export const getValueTierBg = (value: number): string => {
  if (value === 3_000_000) return TIER_STYLES.legendary.bg;
  if (value >= 2_000_000) return TIER_STYLES.gold.bg;
  if (value >= 1_000_000) return TIER_STYLES.hot.bg;
  if (value >= 500_000) return TIER_STYLES.medium.bg;
  return TIER_STYLES.cool.bg;
};

// Get background with opacity for spinning values
export const getValueTierBgWithOpacity = (value: number, opacity: number = 0.2): string => {
  if (value === 3_000_000) return `rgba(251, 191, 36, ${opacity})`; // yellow-400
  if (value >= 2_000_000) return `rgba(245, 158, 11, ${opacity})`; // yellow-500
  if (value >= 1_000_000) return `rgba(249, 115, 22, ${opacity})`; // orange-500
  if (value >= 500_000) return `rgba(168, 85, 247, ${opacity})`; // purple-500
  return `rgba(96, 165, 250, ${opacity})`; // blue-400
};

export const generateRandomReelValues = (count: number): number[] => {
  const possibleValues = [
    200_000,
    300_000,
    450_000,
    500_000,
    750_000,
    1_000_000,
    1_500_000,
    2_000_000,
    2_500_000,
    3_000_000,
  ];

  return Array(count)
    .fill(0)
    .map(() => possibleValues[Math.floor(Math.random() * possibleValues.length)]);
};

export const formatReelValue = (value: number): string => {
  if (value === 3_000_000) return '🍌';

  // Format as $450K, $1.2M, etc.
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `$${millions % 1 === 0 ? millions : millions.toFixed(1)}M`;
  }

  const thousands = value / 1_000;
  return `$${thousands}K`;
};

export const REEL_NAMES = ['Zillow', 'Realtor', 'Homes.com', 'Google', 'Smart Sign'] as const;
export type ReelName = typeof REEL_NAMES[number];
