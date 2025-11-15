// frontend/src/apps/display-tv/SpinningAnimation.tsx

import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBody } from '../../components';
import type { Spin } from '../../types/api';
import {
  REEL_NAMES,
  getValueTierColor,
  getValueTierGlow,
  getValueTierBgWithOpacity,
  formatReelValue,
  generateRandomReelValues,
} from '../../utils/reelTiers';
import { audioManager, SOUNDS, getHitSoundForValue } from '../../utils/audioManager';
import { apiClient } from '../../lib/api/client';
import { REEL_ANIMATION, BRAND_COLORS, PORTRAIT_LAYOUT } from '../../config';

interface SpinningAnimationProps {
  spin: Spin;
}

type ReelState = 'idle' | 'revealing' | 'spinning' | 'stopping' | 'stopped';

interface ReelStateData {
  state: ReelState;
  startTime: number;
}

// Styles extracted to avoid object creation on every render
const REEL_STYLES = {
  spinningText: { textShadow: '0 0 20px rgba(239, 68, 68, 0.3)' },
  stoppingText: { textShadow: '0 0 30px rgba(239, 68, 68, 0.6)' },
} as const;

// Sub-component: Reel with brand logo/name cover that slides down to reveal
const IdleReel = memo(({ reelName, brandColor }: { reelName: string; brandColor: string }) => {
  // Brand logo image mapping
  const getLogoImage = (name: string) => {
    const logoMap: { [key: string]: string } = {
      'Zillow': '/images/zillow-logo.png',
      'Realtor': '/images/realtor-logo.png',
      'Homes.com': '/images/homes-logo.png',
      'Google': '/images/google-logo.png',
      'Smart Sign': '/images/agentfinder.png',
    };
    return logoMap[name];
  };

  const logoSrc = getLogoImage(reelName);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center p-8 rounded-lg"
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 600, opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeIn' }}
      style={{
        backgroundColor: brandColor,
      }}
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={reelName}
          className="w-full h-full object-contain"
          style={{
            filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4))',
          }}
        />
      ) : (
        <div className="text-[56px] font-black text-center tracking-wider text-white">
          {reelName}
        </div>
      )}
    </motion.div>
  );
});

// Sub-component: Spinning reel (scrolls through random values and lands on final value)
const SpinningReel = ({ index, finalValue, isStopped }: { index: number; finalValue: number; isStopped: boolean }) => {
  // Generate values once and store in ref to prevent regeneration
  const valuesRef = useRef<{ values: number[]; centerIndex: number; scrollDistance: number } | null>(null);
  const [currentY, setCurrentY] = useState(0);
  const lastUpdateTimeRef = useRef(0);
  const lastCenteredIndexRef = useRef(-1); // Track which value was last centered for tick sound

  if (valuesRef.current === null) {

    // Generate random values for the spinning effect
    const randomValues = generateRandomReelValues(REEL_ANIMATION.valuesPerCycle);

    // Place the final value in the middle-ish position (not at the end)
    const finalValueIndex = randomValues.length - 1;
    randomValues[finalValueIndex] = finalValue;

    // Add extra values after the final value to create infinite wheel illusion
    // This ensures there's content visible below the final value
    const extraValuesCount = 5; // Add 5 more values after the target
    for (let i = 0; i < extraValuesCount; i++) {
      randomValues.push(generateRandomReelValues(1)[0]);
    }

    // Calculate scroll distance to center the final value
    // NOTE: The final value will be LARGER when centered due to py-6 (48px) vs py-4 (32px)
    // Regular items: text-[32px] + py-4 (32px padding) = 80px total (measured from DOM)
    // Centered item: text-[64px] + py-6 (48px padding) + border (6px) = 150px total (measured from DOM)
    // Gap between items: gap-16 = 64px

    const regularItemHeight = 80; // Regular items during spin (measured from DOM)
    const centeredItemHeight = 150; // Final item when centered and stopped (measured from DOM)
    const gapBetween = 64;
    const viewportHeight = 720;
    const viewportCenter = viewportHeight / 2;

    // Calculate position: all regular items up to (but not including) the final value
    // Each regular item + gap = regularItemHeight + gapBetween
    const regularItemsBeforeFinal = finalValueIndex;
    const positionBeforeFinalValue = regularItemsBeforeFinal * (regularItemHeight + gapBetween);

    // Position where the final value's center would be (using its centered height)
    const finalValueCenterPosition = positionBeforeFinalValue + (centeredItemHeight / 2);

    // How far we need to scroll to align the final value's center with viewport center
    // Positive y moves content down, negative moves content up
    const scrollDistance = viewportCenter - finalValueCenterPosition;

    valuesRef.current = { values: randomValues, centerIndex: finalValueIndex, scrollDistance };
  }

  const { values, centerIndex, scrollDistance } = valuesRef.current;

  // Constants for centering calculation (must match initialization values)
  const regularItemHeight = 80; // Measured from DOM
  const gapBetween = 64;
  const viewportHeight = 720;
  const viewportCenter = viewportHeight / 2;

  // Determine which value is currently centered based on scroll position
  const getCurrentCenteredIndex = (y: number) => {
    // y is the current transform position (can be positive or negative)
    // When y = 0, first item is at top of viewport
    // When y is positive, content moves down (earlier items visible)
    // When y is negative, content moves up (later items visible)

    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < values.length; i++) {
      // Position of this item's top edge at y=0 (all items are regular height during spin)
      const itemTopPosition = i * (regularItemHeight + gapBetween);
      // Center of this item at y=0
      const itemCenterAtZero = itemTopPosition + (regularItemHeight / 2);
      // Center of this item after applying current transform
      const itemCurrentCenter = itemCenterAtZero + y;
      // Distance from viewport center
      const distanceFromCenter = Math.abs(itemCurrentCenter - viewportCenter);

      if (distanceFromCenter < minDistance) {
        minDistance = distanceFromCenter;
        closestIndex = i;
      }
    }

    return closestIndex;
  };

  const currentCenteredIndex = getCurrentCenteredIndex(currentY);

  // Play tick sound when a new value becomes centered (only during spinning, not when stopped)
  useEffect(() => {
    if (!isStopped && currentCenteredIndex !== lastCenteredIndexRef.current && lastCenteredIndexRef.current !== -1) {
      // Play tick sound at low volume
      audioManager.play(SOUNDS.TICK, 0.3);
    }
    lastCenteredIndexRef.current = currentCenteredIndex;
  }, [currentCenteredIndex, isStopped]);

  return (
    <motion.div
      className="absolute flex flex-col items-center gap-16"
      style={{ top: 0, left: 0, right: 0 }}
      initial={{ y: 0 }}
      animate={{ y: scrollDistance }}
      transition={{
        duration: REEL_ANIMATION.spinDuration / 1000,
        ease: [0.33, 1, 0.68, 1],
      }}
      onUpdate={(latest: any) => {
        if (latest.y !== undefined) {
          // Throttle updates to every 100ms to reduce re-renders
          const now = Date.now();
          if (now - lastUpdateTimeRef.current > 100) {
            lastUpdateTimeRef.current = now;
            setCurrentY(latest.y);
          }
        }
      }}
    >
      {values.map((value, i) => {
        // Highlight the value that's currently centered during spin
        // When stopped, keep the final value highlighted
        const isCentered = isStopped ? (i === centerIndex) : (i === currentCenteredIndex);

        return (
          <div
            key={`${index}-${i}`}
            className={`rounded-lg ${isCentered ? 'py-6 px-4' : 'py-4 px-4'} flex items-center justify-center`}
            style={{
              backgroundColor: isCentered
                ? getValueTierBgWithOpacity(value, 0.5)
                : getValueTierBgWithOpacity(value, 0.15),
              border: isCentered ? `3px solid ${getValueTierBgWithOpacity(value, 0.9)}` : 'none',
              boxShadow: isCentered ? `0 0 30px ${getValueTierBgWithOpacity(value, 0.6)}` : 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth easing
            }}
          >
            <div
              className={`font-bold text-center ${
                isCentered
                  ? `text-[52px] ${getValueTierColor(value)} ${getValueTierGlow(value)}`
                  : 'text-[32px] text-gray-300 opacity-70'
              }`}
              style={{
                ...(isCentered ? {} : REEL_STYLES.spinningText),
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth easing
              }}
            >
              {formatReelValue(value)}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
};

export function SpinningAnimation({ spin }: SpinningAnimationProps) {
  const [reelStates, setReelStates] = useState<ReelStateData[]>(
    REEL_NAMES.map(() => ({ state: 'idle', startTime: 0 }))
  );
  const [allReelsComplete, setAllReelsComplete] = useState(false);
  const [bananasLanded, setBananasLanded] = useState(0);

  const reelValues = [
    spin.zillow_value,
    spin.realtor_value,
    spin.homes_value,
    spin.google_value,
    spin.smart_sign_value,
  ];

  // Sequential reel start - each reel waits for previous to complete + pause
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const totalReelDuration = REEL_ANIMATION.spinDuration; // 5000ms per reel
    const pauseBetweenReels = 800; // 800ms pause between reels
    const revealDuration = 600; // 600ms for cover slide-down animation

    REEL_NAMES.forEach((_, index) => {
      // Calculate start time: each reel starts after previous completes + pause
      const startDelay = index * (totalReelDuration + pauseBetweenReels + revealDuration);

      // Start revealing (cover slides down)
      const revealTimer = setTimeout(() => {
        setReelStates((prev) =>
          prev.map((item, i) =>
            i === index
              ? { state: 'revealing', startTime: Date.now() }
              : item
          )
        );
      }, startDelay);

      // Start spinning (after reveal completes)
      const spinTimer = setTimeout(() => {
        setReelStates((prev) =>
          prev.map((item, i) =>
            i === index
              ? { state: 'spinning', startTime: Date.now() }
              : item
          )
        );
      }, startDelay + revealDuration);

      // Mark as fully stopped (for pop animation) - happens when animation completes
      const completeTimer = setTimeout(() => {
        setReelStates((prev) =>
          prev.map((item, i) =>
            i === index ? { ...item, state: 'stopped' } : item
          )
        );

        const finalValue = reelValues[index];

        // Handle banana sounds
        if (finalValue === 3_000_000) {
          setBananasLanded(prev => {
            const newCount = prev + 1;
            // Play feature hit sound based on banana count
            if (newCount === 1) {
              audioManager.play(SOUNDS.FEATURE_HIT_1, 0.7);
            } else if (newCount === 2) {
              audioManager.play(SOUNDS.FEATURE_HIT_2, 0.7);
            } else if (newCount === 3) {
              audioManager.play(SOUNDS.FEATURE_HIT_3, 0.7);
            }
            return newCount;
          });
        } else {
          // Play hit sound based on value tier
          const hitSound = getHitSoundForValue(finalValue);
          if (hitSound) {
            audioManager.play(hitSound, 0.6);
          }
        }
      }, startDelay + revealDuration + totalReelDuration);

      timers.push(revealTimer, spinTimer, completeTimer);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  // Check if all reels are complete and transition to bonus or results
  useEffect(() => {
    const allStopped = reelStates.every(reel => reel.state === 'stopped');
    if (allStopped && !allReelsComplete) {
      setAllReelsComplete(true);
      // Wait a moment to show the final state, then check for bonus or go to results
      setTimeout(() => {
        // Check if bonus was triggered (3+ bananas)
        if (spin.bonus_triggered) {
          // Play feature unlocked sound
          audioManager.play(SOUNDS.FEATURE_UNLOCKED, 0.8);
          // Transition to bonus wheel
          apiClient.updateGameState({ state: 'bonus_wheel', spin_id: spin.id }).catch(err =>
            console.error('Failed to transition to bonus wheel:', err)
          );
        } else {
          // No bonus, go straight to results
          apiClient.transitionToResults().catch(err =>
            console.error('Failed to transition to results:', err)
          );
        }
      }, 1000); // 1 second delay to appreciate the final stopped state
    }
  }, [reelStates, allReelsComplete, spin.id, spin.bonus_triggered]);

  // Get brand color for each reel
  const getBrandColor = (index: number): string => {
    const brandKeys = ['zillow', 'realtor', 'homes', 'google', 'smartSign'] as const;
    return BRAND_COLORS[brandKeys[index]];
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${PORTRAIT_LAYOUT.padding.screen} bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900`}>
      {/* Ambient background shimmer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-500/5 to-transparent pointer-events-none"
        animate={{
          x: ['-100%', '100%'],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <div className={`w-full max-w-7xl ${PORTRAIT_LAYOUT.spacing.section} relative z-10`}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
        </motion.div>

        {/* Reels */}
        <Card>
          <CardBody className={PORTRAIT_LAYOUT.padding.card}>
            <div className={`grid grid-cols-5 ${PORTRAIT_LAYOUT.components.reels.gap}`}>
              {REEL_NAMES.map((name, index) => {
                const reelState = reelStates[index];
                const isActive = reelState.state === 'spinning' || reelState.state === 'stopping';

                return (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: reelState.state === 'idle' ? 0.6 : 1,
                      scale: 1,
                    }}
                    transition={{
                      opacity: { duration: 0.3 },
                      scale: { delay: index * 0.1 }
                    }}
                    className="relative"
                  >
                    {/* Reel container */}
                    <div className="flex flex-col">
                      {/* Reel label - outside the scrolling container */}
                      <div className="text-center mb-2 px-2">
                        <p
                          className={`${PORTRAIT_LAYOUT.components.reels.labelSize} font-bold uppercase tracking-wider`}
                          style={{ color: getBrandColor(index) }}
                        >
                          {name}
                        </p>
                      </div>

                      {/* Reel viewport with state-based rendering - no padding */}
                      <div className={`
                        ${PORTRAIT_LAYOUT.components.reels.height}
                        bg-gray-900 rounded-xl border-4 shadow-2xl overflow-hidden
                        relative
                        transition-all duration-300
                        ${isActive ? 'border-primary-500' : 'border-gray-700'}
                        ${reelState.state === 'stopped' ? 'border-yellow-400' : ''}
                      `}>
                        {/* Soft white fade masks for depth - stronger effect */}
                        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-gray-900 via-gray-900/80 to-transparent pointer-events-none z-10" />
                        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent pointer-events-none z-10" />

                        {/* Show SpinningReel behind cover during reveal/spin/stopped */}
                        {(reelState.state === 'revealing' || reelState.state === 'spinning' || reelState.state === 'stopped') && (
                          <SpinningReel
                            key={`spin-${spin.id}-${index}`}
                            index={index}
                            finalValue={reelValues[index]}
                            isStopped={reelState.state === 'stopped'}
                          />
                        )}

                        {/* AnimatePresence allows exit animation when state changes from idle/revealing */}
                        <AnimatePresence>
                          {(reelState.state === 'idle' || reelState.state === 'revealing') && (
                            <IdleReel
                              key="idle"
                              reelName={name}
                              brandColor={getBrandColor(index)}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Glow effect - brighter when active or stopped */}
                    <motion.div
                      animate={{
                        opacity: reelState.state === 'stopped'
                          ? [0.6, 1, 0.6]
                          : isActive
                          ? [0.4, 0.7, 0.4]
                          : [0.1, 0.2, 0.1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="absolute inset-0 rounded-xl blur-xl -z-10"
                      style={{
                        backgroundColor: reelState.state === 'stopped'
                          ? '#F59E0B'
                          : getBrandColor(index),
                        opacity: 0.3,
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Banana Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center mt-8 space-y-2"
        >
          <p className={`${PORTRAIT_LAYOUT.typography.medium} text-gray-400`}>
            🍌 = $3,000,000
          </p>
          <p className={`${PORTRAIT_LAYOUT.typography.medium} text-gray-400`}>
            🍌🍌🍌 = bonus feature
          </p>
        </motion.div>
      </div>
    </div>
  );
}
