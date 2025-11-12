// frontend/src/apps/display-tv/SpinningAnimation.tsx

import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBody } from '../../components';
import type { Spin } from '../../types/api';
import {
  REEL_NAMES,
  getValueTierColor,
  getValueTierBorder,
  getValueTierGlow,
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

      // Start deceleration phase (after acceleration + constant)
      const stopTimer = setTimeout(() => {
        setReelStates((prev) =>
          prev.map((item, i) =>
            i === index ? { ...item, state: 'stopping' } : item
          )
        );
      }, startDelay + REEL_ANIMATION.phases.acceleration + REEL_ANIMATION.phases.constant);

      // Mark as fully stopped (for pop animation)
      const completeTimer = setTimeout(() => {
        setReelStates((prev) =>
          prev.map((item, i) =>
            i === index ? { ...item, state: 'stopped' } : item
          )
        );
        // Play landing sound
        audioManager.play(SOUNDS.REEL_STOP, 0.5);
      }, startDelay + totalReelDuration);

      timers.push(startTimer, stopTimer, completeTimer);
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
      className="absolute inset-0 flex items-center justify-center px-4 bg-gray-800 rounded-lg"
      exit={{ y: -600, opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        border: `2px solid ${brandColor}40`,
      }}
    >
      <div
        className="text-[72px] font-bold text-center break-words"
        style={{
          color: brandColor,
          textShadow: `0 0 40px ${brandColor}80, 0 0 20px ${brandColor}60`,
          maxWidth: '100%',
          wordWrap: 'break-word',
        }}
      >
        {reelName}
      </div>
    </motion.div>
  ));

  // Sub-component: Spinning reel (infinite scroll with acceleration)
  const SpinningReel = memo(({ index }: { index: number }) => {
    const randomValues = useMemo(
      () => generateRandomReelValues(REEL_ANIMATION.valuesPerCycle),
      [index]
    );

    return (
      <motion.div
        className="absolute inset-0 flex flex-col items-center gap-16 justify-start pt-32 px-4"
        animate={{ y: [0, REEL_ANIMATION.scrollDistance] }}
        transition={{
          duration: (REEL_ANIMATION.phases.acceleration + REEL_ANIMATION.phases.constant) / 1000,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        {randomValues.map((value, i) => (
          <div
            key={`${index}-${i}`}
            className="text-[48px] font-bold text-gray-400 opacity-60 whitespace-nowrap"
            style={REEL_STYLES.spinningText}
          >
            {formatReelValue(value)}
          </div>
        ))}
      </motion.div>
    );
  });

  // Sub-component: Stopping reel (deceleration to final value)
  const StoppingReel = memo(({ value }: { value: number }) => {
    return (
      <motion.div
        className="absolute inset-0 flex items-center justify-center px-4"
        initial={{ y: -500, opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: REEL_ANIMATION.phases.deceleration / 1000,
          ease: REEL_ANIMATION.easing.deceleration,
        }}
      >
        <div
          className={`text-[80px] font-bold whitespace-nowrap ${getValueTierColor(value)}`}
          style={REEL_STYLES.stoppingText}
        >
          {formatReelValue(value)}
        </div>
      </motion.div>
    );
  });

  // Sub-component: Stopped reel (pop animation with glow)
  const StoppedReel = memo(({ value }: { value: number }) => {
    return (
      <motion.div className="absolute inset-0 flex items-center justify-center">
        {/* Value with pop animation */}
        <motion.div
          initial={{ scale: REEL_ANIMATION.popAnimation.scaleKeyframes[0] }}
          animate={{
            scale: [...REEL_ANIMATION.popAnimation.scaleKeyframes],
            filter: REEL_ANIMATION.popAnimation.brightnessKeyframes.map(
              (b) => `brightness(${b})`
            ),
          }}
          transition={{
            duration: REEL_ANIMATION.popAnimation.duration / 1000,
            times: [...REEL_ANIMATION.popAnimation.times],
            ease: 'easeOut',
          }}
          className={`text-[96px] font-bold whitespace-nowrap ${getValueTierColor(value)} ${getValueTierGlow(value)}`}
        >
          {formatReelValue(value)}
        </motion.div>

        {/* Glow pulse ring */}
        <motion.div
          className={`absolute inset-0 rounded-lg border-4 ${getValueTierBorder(value)}`}
          animate={{
            scale: [...REEL_ANIMATION.glowPulse.scaleKeyframes],
            opacity: [...REEL_ANIMATION.glowPulse.opacityKeyframes],
          }}
          transition={{
            duration: REEL_ANIMATION.glowPulse.duration / 1000,
            ease: 'easeOut'
          }}
        />
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
                    <div className={`
                      bg-gray-900 rounded-xl ${PORTRAIT_LAYOUT.components.reels.padding} border-4 shadow-2xl overflow-hidden
                      transition-all duration-300
                      ${isActive ? 'border-primary-500' : 'border-gray-700'}
                      ${reelState.state === 'stopped' ? 'border-yellow-400' : ''}
                    `}>
                      {/* Reel label */}
                      <div className="text-center mb-8">
                        <p
                          className={`${PORTRAIT_LAYOUT.components.reels.labelSize} font-bold uppercase tracking-wider`}
                          style={{ color: getBrandColor(index) }}
                        >
                          {name}
                        </p>
                      </div>

                      {/* Reel viewport with state-based rendering */}
                      <div className={`${PORTRAIT_LAYOUT.components.reels.height} flex items-center justify-center relative overflow-hidden`}>
                        {/* Soft white fade masks for depth - stronger effect */}
                        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-gray-900 via-gray-900/80 to-transparent pointer-events-none z-10" />
                        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent pointer-events-none z-10" />

                        <AnimatePresence mode="wait">
                          {reelState.state === 'idle' && (
                            <IdleReel
                              key="idle"
                              reelName={name}
                              brandColor={getBrandColor(index)}
                            />
                          )}
                          {reelState.state === 'spinning' && (
                            <SpinningReel key="spinning" index={index} />
                          )}
                          {reelState.state === 'stopping' && (
                            <StoppingReel
                              key="stopping"
                              value={reelValues[index]}
                            />
                          )}
                          {reelState.state === 'stopped' && (
                            <StoppedReel
                              key="stopped"
                              value={reelValues[index]}
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
      </div>
    </div>
  );
}
