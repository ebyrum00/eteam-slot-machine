import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Spin } from '../../types/api';

interface SpinningAnimationProps {
  spin: Spin;
}

// Lead source configuration with brand colors
const LEAD_SOURCES = [
  { name: 'Zillow', color: '#1277e1' },
  { name: 'Realtor', color: '#e61a39' },
  { name: 'Homes.com', color: '#ff6c2c' },
  { name: 'Google', color: '#34a853' },
  { name: 'Smart Sign', color: '#552448' },
];

// Timing constants
const SPIN_DURATION = 5000; // 5 seconds per reel (300 frames at 60fps)
const ANTICIPATION_DELAY = 800; // 800ms between reel starts
const SLOWDOWN_DURATION = 2000; // 2 seconds for dramatic slow finish

// Value tiers with colors
const VALUE_TIERS = {
  low: { values: [200000, 250000, 300000], color: 'text-gray-400' },
  medium: { values: [375000, 450000, 550000], color: 'text-blue-400' },
  high: { values: [750000, 1000000], color: 'text-purple-400' },
  premium: { values: [1500000, 3000000], color: 'text-amber-400' },
  special: { value: 3000000, display: '🍌', color: 'text-yellow-400' },
};

// Generate all possible values for spinning display
const ALL_VALUES = [
  ...VALUE_TIERS.low.values,
  ...VALUE_TIERS.medium.values,
  ...VALUE_TIERS.high.values,
  ...VALUE_TIERS.premium.values,
  VALUE_TIERS.special.value,
];

export function SpinningAnimation({ spin }: SpinningAnimationProps) {
  const [revealedReels, setRevealedReels] = useState<number[]>([]);
  const [spinningReels, setSpinningReels] = useState<number[]>([]);
  const [slowingReels, setSlowingReels] = useState<number[]>([]);
  const [stoppedReels, setStoppedReels] = useState<number[]>([]);

  const reelValues = [
    spin.zillow_value,
    spin.realtor_value,
    spin.homes_value,
    spin.google_value,
    spin.smart_sign_value,
  ];

  // Determine value tier and color
  const getValueColor = (value: number): string => {
    if (value === VALUE_TIERS.special.value) return VALUE_TIERS.special.color;
    if (VALUE_TIERS.premium.values.includes(value)) return VALUE_TIERS.premium.color;
    if (VALUE_TIERS.high.values.includes(value)) return VALUE_TIERS.high.color;
    if (VALUE_TIERS.medium.values.includes(value)) return VALUE_TIERS.medium.color;
    return VALUE_TIERS.low.color;
  };

  const formatValue = (value: number) => {
    if (value === VALUE_TIERS.special.value) return '🍌';
    const thousands = value / 1000;
    return `$${thousands}K`;
  };

  // Orchestrate the sequential reel animation
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    LEAD_SOURCES.forEach((_, index) => {
      const baseDelay = index * ANTICIPATION_DELAY;

      // Reveal reel (slide up logo cover)
      const revealTimer = setTimeout(() => {
        setRevealedReels((prev) => [...prev, index]);
      }, baseDelay);
      timers.push(revealTimer);

      // Start spinning
      const spinTimer = setTimeout(() => {
        setSpinningReels((prev) => [...prev, index]);
      }, baseDelay + 300); // 300ms after reveal
      timers.push(spinTimer);

      // Start slowing down
      const slowTimer = setTimeout(() => {
        setSlowingReels((prev) => [...prev, index]);
      }, baseDelay + SPIN_DURATION - SLOWDOWN_DURATION);
      timers.push(slowTimer);

      // Stop completely
      const stopTimer = setTimeout(() => {
        setStoppedReels((prev) => [...prev, index]);
      }, baseDelay + SPIN_DURATION);
      timers.push(stopTimer);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  // Determine if reel is currently active (spinning but not yet slowing)
  const isActiveReel = (index: number) => {
    return spinningReels.includes(index) && !stoppedReels.includes(index);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="w-full max-w-7xl space-y-8">
        {/* Animated gradient background effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(239, 68, 68, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 80%, rgba(239, 68, 68, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(239, 68, 68, 0.15) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />

        {/* Reels Container */}
        <div className="relative">
          <div className="grid grid-cols-5 gap-6">
            {LEAD_SOURCES.map((source, index) => {
              const isActive = isActiveReel(index);
              const isSlowing = slowingReels.includes(index);
              const isStopped = stoppedReels.includes(index);
              const isRevealed = revealedReels.includes(index);
              const finalValue = reelValues[index];

              return (
                <div key={source.name} className="relative">
                  {/* Lead source logo/name */}
                  <motion.div
                    className="text-center mb-4"
                    animate={{
                      scale: isActive ? [1, 1.1, 1] : 1,
                    }}
                    transition={{ duration: 0.6, repeat: isActive ? Infinity : 0 }}
                  >
                    <div
                      className="text-2xl font-bold uppercase tracking-wider"
                      style={{ color: source.color }}
                    >
                      {source.name}
                    </div>
                  </motion.div>

                  {/* Reel container */}
                  <motion.div
                    className="relative bg-gray-900/80 backdrop-blur rounded-2xl overflow-hidden"
                    style={{
                      boxShadow: isActive
                        ? `0 0 30px ${source.color}80, 0 0 60px ${source.color}40`
                        : '0 10px 30px rgba(0,0,0,0.5)',
                    }}
                    animate={{
                      borderColor: isActive ? source.color : 'rgba(239, 68, 68, 0.5)',
                      borderWidth: isActive ? '4px' : '2px',
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Logo cover (slides up to reveal) */}
                    <AnimatePresence>
                      {!isRevealed && (
                        <motion.div
                          className="absolute inset-0 z-20 flex items-center justify-center"
                          style={{ backgroundColor: source.color }}
                          exit={{
                            y: '-100%',
                            transition: { duration: 0.5, ease: 'easeInOut' },
                          }}
                        >
                          <div className="text-white text-4xl font-bold opacity-20">
                            {source.name}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Shimmer effect on payline */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-x-0 top-1/2 h-24 -translate-y-1/2 z-10 pointer-events-none"
                        style={{
                          background: `linear-gradient(to bottom, transparent, ${source.color}20, transparent)`,
                        }}
                        animate={{
                          opacity: [0.3, 0.7, 0.3],
                        }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}

                    {/* Reel content */}
                    <div className="relative h-80 overflow-hidden">
                      {/* Gradient overlays for depth */}
                      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-gray-900 to-transparent z-10 pointer-events-none" />
                      <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-gray-900 to-transparent z-10 pointer-events-none" />

                      {/* Spinning values or final result */}
                      <AnimatePresence mode="wait">
                        {!isStopped ? (
                          <motion.div
                            key="spinning"
                            className="absolute inset-0 flex flex-col items-center justify-start pt-32"
                            animate={{
                              y: [0, -1000],
                            }}
                            transition={{
                              duration: isSlowing ? 3 : 0.6,
                              repeat: Infinity,
                              ease: isSlowing ? [0.25, 0.46, 0.45, 0.94] : 'linear', // 3-phase easing
                            }}
                          >
                            {/* Display 7 values (5 visible + 2 for smooth loop) */}
                            {[...ALL_VALUES, ...ALL_VALUES.slice(0, 2)].map((value, i) => (
                              <div
                                key={`${value}-${i}`}
                                className={`text-5xl font-bold py-8 ${getValueColor(value)}`}
                                style={{
                                  textShadow: `0 0 20px ${source.color}60`,
                                }}
                              >
                                {formatValue(value)}
                              </div>
                            ))}
                          </motion.div>
                        ) : (
                          <motion.div
                            key="stopped"
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ scale: 0, rotate: 180, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            transition={{
                              type: 'spring',
                              stiffness: 200,
                              damping: 15,
                            }}
                          >
                            <div
                              className={`text-7xl font-bold ${getValueColor(finalValue)}`}
                              style={{
                                textShadow: `0 0 30px ${source.color}80, 0 0 60px ${source.color}40`,
                              }}
                            >
                              {formatValue(finalValue)}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  {/* Glow effect behind reel */}
                  <motion.div
                    className="absolute inset-0 -z-10 rounded-2xl blur-2xl"
                    style={{ backgroundColor: source.color }}
                    animate={{
                      opacity: isActive ? [0.2, 0.4, 0.2] : isStopped ? [0.3, 0.5, 0.3] : 0.1,
                    }}
                    transition={{
                      duration: isActive ? 0.8 : 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
