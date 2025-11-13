// frontend/src/config/theme.ts

/**
 * Visual theme configuration: colors, typography, brand colors
 */

export const THEME_CONFIG = {
  // Brand colors per reel
  brands: {
    zillow: '#1277e1',
    realtor: '#e61a39',
    homes: '#ff6c2c',
    google: '#34a853',
    smartSign: '#552448',
  },

  // Value tier colors (for heat map)
  tiers: {
    legendary: {
      text: 'text-yellow-400',
      border: 'border-yellow-400',
      glow: 'drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]',
      bg: 'bg-yellow-400',
    },
    gold: {
      text: 'text-yellow-500',
      border: 'border-yellow-500',
      glow: 'drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]',
      bg: 'bg-yellow-500',
    },
    hot: {
      text: 'text-orange-500',
      border: 'border-orange-500',
      glow: 'drop-shadow-[0_0_20px_rgba(249,115,22,0.6)]',
      bg: 'bg-orange-500',
    },
    medium: {
      text: 'text-purple-500',
      border: 'border-purple-500',
      glow: 'drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]',
      bg: 'bg-purple-500',
    },
    cool: {
      text: 'text-blue-400',
      border: 'border-blue-400',
      glow: 'drop-shadow-[0_0_20px_rgba(96,165,250,0.4)]',
      bg: 'bg-blue-400',
    },
  },

  // Podium colors
  podium: {
    first: {
      bg: 'bg-yellow-500',
      text: 'text-gray-900',
      gradient: 'from-yellow-400 to-yellow-600',
    },
    second: {
      bg: 'bg-gray-400',
      text: 'text-gray-900',
      gradient: 'from-gray-300 to-gray-500',
    },
    third: {
      bg: 'bg-orange-600',
      text: 'text-white',
      gradient: 'from-orange-500 to-orange-700',
    },
  },

  // Typography scale (for 10-foot displays)
  typography: {
    hero: 'text-9xl',          // Massive celebration text
    title: 'text-7xl',         // Main titles
    large: 'text-5xl',         // Large text
    medium: 'text-3xl',        // Medium text
    small: 'text-xl',          // Small text
  },

  // Spacing scale
  spacing: {
    section: 'space-y-12',
    card: 'p-12',
    content: 'space-y-8',
  },

  // HD Portrait-optimized layout (1080x1920)
  // Perfect for Full HD vertical displays
  portrait: {
    // Balanced padding for 1080 width
    padding: {
      screen: 'p-8',           // Outer screen padding (32px)
      card: 'p-10',            // Card padding (40px)
      cardCompact: 'p-8',      // Compact card padding (32px)
      cardBody: 'py-16',       // Card body vertical padding (64px)
      cardBodyCompact: 'py-12',// Compact card body (48px)
    },

    // Well-proportioned spacing
    spacing: {
      section: 'space-y-6',    // Section spacing (24px) - reduced for tighter layout
      sectionCompact: 'space-y-4', // Compact sections (16px)
      content: 'space-y-4',    // Content spacing (16px) - reduced
      contentCompact: 'space-y-4', // Compact content (16px) - reduced for leaderboard
    },

    // Typography scaled for 1920 height
    typography: {
      hero: 'text-[128px]',    // 128px - hero text
      title: 'text-[80px]',    // 80px - main titles
      subtitle: 'text-3xl',    // 32px - subtitles
      large: 'text-[64px]',    // 64px - large text
      medium: 'text-5xl',      // 48px - medium text
      body: 'text-2xl',        // 24px - body text
      small: 'text-xl',        // 20px - small text
    },

    // Component-specific sizes
    components: {
      // Reel configuration
      reels: {
        gap: 'gap-2',          // Gap between reels (8px) - tighter spacing
        padding: 'p-6',        // Internal reel padding (24px) - reduced
        height: 'h-[720px]',   // Reel viewport height (720px) - 50% taller
        labelSize: 'text-xl',  // Reel label size (20px) - slightly smaller
      },

      // Leaderboard configuration
      leaderboard: {
        rowPadding: 'py-3',    // Row padding (12px) - reduced for more compact layout
        rankSize: 'w-20 h-20', // Rank badge size (80px)
        maxEntries: 12,        // Good number for 1920 height
      },

      // Button configuration
      button: {
        ready: 'w-[300px] h-[300px]', // Ready button size (300px)
      },
    },
  },
} as const;

export const BRAND_COLORS = THEME_CONFIG.brands;
export const TIER_STYLES = THEME_CONFIG.tiers;
export const PODIUM_STYLES = THEME_CONFIG.podium;
export const PORTRAIT_LAYOUT = THEME_CONFIG.portrait;
