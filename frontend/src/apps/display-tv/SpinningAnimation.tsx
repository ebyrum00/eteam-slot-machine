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
import { audioManager, SOUNDS } from '../../utils/audioManager';
import { apiClient } from '../../lib/api/client';
import { REEL_ANIMATION, BRAND_COLORS, PORTRAIT_LAYOUT } from '../../config';

interface SpinningAnimationProps {
  spin: Spin;
}

type ReelState = 'idle' | 'spinning' | 'stopping' | 'stopped';

interface ReelStateData {
  state: ReelState;
  startTime: number;
}

// Styles extracted to avoid object creation on every render
const REEL_STYLES = {
  spinningText: { textShadow: '0 0 20px rgba(239, 68, 68, 0.3)' },
  stoppingText: { textShadow: '0 0 30px rgba(239, 68, 68, 0.6)' },
} as const;

export function SpinningAnimation({ spin }: SpinningAnimationProps) {
  const [reelStates, setReelStates] = useState<ReelStateData[]>(
    REEL_NAMES.map(() => ({ state: 'idle', startTime: 0 }))
  );
  const [allReelsComplete, setAllReelsComplete] = useState(false);

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

    REEL_NAMES.forEach((_, index) => {
      // Calculate start time: each reel starts after previous completes + pause
      const startDelay = index * (totalReelDuration + pauseBetweenReels);

      // Start spinning
      const startTimer = setTimeout(() => {
        setReelStates((prev) =>
          prev.map((item, i) =>
            i === index
              ? { state: 'spinning', startTime: Date.now() }
              : item
          )
        );
      }, startDelay);

      // Mark as fully stopped (for pop animation) - happens when animation completes
      const completeTimer = setTimeout(() => {
        setReelStates((prev) =>
          prev.map((item, i) =>
            i === index ? { ...item, state: 'stopped' } : item
          )
        );
        // Play landing sound
        audioManager.play(SOUNDS.REEL_STOP, 0.5);
      }, startDelay + totalReelDuration);

      timers.push(startTimer, completeTimer);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  // Check if all reels are complete and transition to results
  useEffect(() => {
    const allStopped = reelStates.every(reel => reel.state === 'stopped');
    if (allStopped && !allReelsComplete) {
      setAllReelsComplete(true);
      // Wait a moment to show the final state, then trigger results transition
      setTimeout(() => {
        // Update game state to results via API
        apiClient.transitionToResults().catch(err =>
          console.error('Failed to transition to results:', err)
        );
      }, 1000); // 1 second delay to appreciate the final stopped state
    }
  }, [reelStates, allReelsComplete]);

  // Sub-component: Reel with logo cover that slides away
  const IdleReel = memo(({ reelName, brandColor }: { reelName: string; brandColor: string }) => (
    <motion.div
      className="absolute inset-0 flex items-center justify-center px-4 rounded-lg"
      exit={{ y: -600, opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        backgroundColor: brandColor,
      }}
    >
      <div
        className="text-[48px] font-bold text-center break-words text-white"
        style={{
          maxWidth: '100%',
          wordWrap: 'break-word',
          textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
        }}
      >
        {reelName}
      </div>
    </motion.div>
  ));

  // Sub-component: Spinning reel (scrolls through random values and lands on final value)
  const SpinningReel = memo(({ index, finalValue, isStopped }: { index: number; finalValue: number; isStopped: boolean }) => {
    // Generate values once and store in ref to prevent regeneration
    const valuesRef = useRef<{ values: number[]; centerIndex: number } | null>(null);

    if (valuesRef.current === null) {
      console.log(`Reel ${index} INITIALIZING with finalValue:`, finalValue);

      // Generate random values for the spinning effect
      const randomValues = generateRandomReelValues(REEL_ANIMATION.valuesPerCycle);

      // Place the final value at the LAST position
      const finalValueIndex = randomValues.length - 1;
      randomValues[finalValueIndex] = finalValue;

      valuesRef.current = { values: randomValues, centerIndex: finalValueIndex };
    }

    const { values, centerIndex } = valuesRef.current;

    // Calculate scroll distance
    const itemHeight = 96;
    const gapBetween = 64;
    const totalItemHeight = itemHeight + gapBetween;
    const viewportHeight = 720;
    const viewportCenter = viewportHeight / 2;
    const lastItemCenterPosition = (centerIndex * totalItemHeight) + (itemHeight / 2);
    const scrollDistance = viewportCenter - lastItemCenterPosition;

    return (
      <motion.div
        className="absolute inset-0 flex flex-col items-center gap-16 justify-start"
        initial={{ y: 0 }}
        animate={{ y: scrollDistance }}
        transition={{
          duration: REEL_ANIMATION.spinDuration / 1000,
          ease: [0.33, 1, 0.68, 1],
        }}
      >
        {values.map((value, i) => {
          // Highlight the final value when stopped
          const isCentered = isStopped && (i === centerIndex);

          return (
            <div
              key={`${index}-${i}`}
              className={`rounded-lg transition-all duration-100 ${isCentered ? 'py-6 px-8' : 'py-4 px-6'}`}
              style={{
                backgroundColor: isCentered
                  ? getValueTierBgWithOpacity(value, 0.5)
                  : getValueTierBgWithOpacity(value, 0.15),
                border: isCentered ? `3px solid ${getValueTierBgWithOpacity(value, 0.9)}` : 'none',
                boxShadow: isCentered ? `0 0 30px ${getValueTierBgWithOpacity(value, 0.6)}` : 'none',
              }}
            >
              <div
                className={`font-bold whitespace-nowrap transition-all duration-100 ${
                  isCentered
                    ? `text-[64px] ${getValueTierColor(value)} ${getValueTierGlow(value)}`
                    : 'text-[32px] text-gray-300 opacity-70'
                }`}
                style={isCentered ? {} : REEL_STYLES.spinningText}
              >
                {formatReelValue(value)}
              </div>
            </div>
          );
        })}
      </motion.div>
    );
  });

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
          <h1 className={`${PORTRAIT_LAYOUT.typography.title} font-bold text-primary-500`}>
            Spinning...
          </h1>
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
                        flex items-center justify-center relative
                        transition-all duration-300
                        ${isActive ? 'border-primary-500' : 'border-gray-700'}
                        ${reelState.state === 'stopped' ? 'border-yellow-400' : ''}
                      `}>
                        {/* Soft white fade masks for depth - stronger effect */}
                        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-gray-900 via-gray-900/80 to-transparent pointer-events-none z-10" />
                        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent pointer-events-none z-10" />

                        {reelState.state === 'idle' && (
                          <AnimatePresence>
                            <IdleReel
                              key="idle"
                              reelName={name}
                              brandColor={getBrandColor(index)}
                            />
                          </AnimatePresence>
                        )}
                        {(reelState.state === 'spinning' || reelState.state === 'stopped') && (
                          <SpinningReel
                            key={`spin-${spin.id}-${index}`}
                            index={index}
                            finalValue={reelValues[index]}
                            isStopped={reelState.state === 'stopped'}
                          />
                        )}
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
      </div>
    </div>
  );
}
