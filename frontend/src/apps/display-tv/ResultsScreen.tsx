// frontend/src/apps/display-tv/ResultsScreen.tsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, ScoreDisplay, ReelValueDisplay, ScreenShake, Confetti } from '../../components';
import type { Spin } from '../../types/api';
import {
  getWinTier,
  getWinMessage,
  shouldPlayBigWinEffects,
  getShakeIntensity,
  getConfettiCount,
  WinTier
} from '../../utils/winTiers';
import { audioManager, SOUNDS } from '../../utils/audioManager';
import { RESULTS_ANIMATION, PORTRAIT_LAYOUT } from '../../config';
import { useGameStore } from '../../lib/stores/gameStore';
import { apiClient } from '../../lib/api/client';

interface ResultsScreenProps {
  spin: Spin;
}

export function ResultsScreen({ spin }: ResultsScreenProps) {
  const gameState = useGameStore((state) => state.gameState);
  const playerName = gameState?.current_player_name?.split(' ')[0] || 'PLAYER';

  const hasBonus = spin.bonus_triggered;
  const [displayScore, setDisplayScore] = useState(0);
  const [countUpComplete, setCountUpComplete] = useState(false);
  const winTier = getWinTier(spin.total_score);
  const showBigWinEffects = shouldPlayBigWinEffects(spin.total_score);
  const [shake, setShake] = useState(false);

  // Animated count-up for total score with easing
  useEffect(() => {
    const duration = RESULTS_ANIMATION.countUpDuration;
    const steps = RESULTS_ANIMATION.countUpSteps;
    let current = 0;
    let step = 0;

    // Play payout sound during count-up
    audioManager.play(SOUNDS.PAYOUT, 0.5);

    const interval = setInterval(() => {
      step++;
      // Ease-out curve for count-up
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
      current = spin.total_score * eased;

      if (step >= steps) {
        setDisplayScore(spin.total_score);
        setCountUpComplete(true);
        clearInterval(interval);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [spin.total_score]);

  // Play win sound effect based on tier (at 70% volume)
  useEffect(() => {
    switch (winTier) {
      case WinTier.Legendary:
        audioManager.play(SOUNDS.WIN_LEGENDARY, 0.7);
        break;
      case WinTier.Epic:
        audioManager.play(SOUNDS.WIN_EPIC, 0.7);
        break;
      case WinTier.Big:
        audioManager.play(SOUNDS.WIN_BIG, 0.7);
        break;
      default:
        audioManager.play(SOUNDS.WIN_NORMAL, 0.7);
    }
  }, [winTier]);

  // Trigger screen shake for big wins with scaled intensity
  useEffect(() => {
    if (showBigWinEffects) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), RESULTS_ANIMATION.screenShakeDuration);
      return () => clearTimeout(timer);
    }
  }, [showBigWinEffects]);

  // Auto-transition to idle after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      apiClient.updateGameState({ state: 'idle' }).catch((err) =>
        console.error('Failed to transition to idle:', err)
      );
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  const confettiCount = getConfettiCount(winTier);
  const shakeIntensity = getShakeIntensity(winTier);
  const screenShakeIntensity = shakeIntensity === 'low' ? undefined : shakeIntensity;

  return (
    <ScreenShake shake={shake} intensity={screenShakeIntensity}>
      <div className={`min-h-screen flex items-center justify-center ${PORTRAIT_LAYOUT.padding.screen} bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden`}>
        {/* Ambient background shimmer matching other screens */}
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
        {/* Simplified win effects - performance optimized */}
        {showBigWinEffects && (
          <>
            {/* Confetti explosion - reduced count for performance */}
            <Confetti
              count={Math.min(confettiCount, 50)}
              colors={
                winTier === WinTier.Legendary
                  ? ['#FCD34D', '#F59E0B', '#FBBF24', '#F97316']
                  : ['#F59E0B', '#FCD34D', '#F97316', '#EF4444']
              }
              duration={RESULTS_ANIMATION.confettiDuration / 1000}
            />
          </>
        )}

        <div className={`w-full max-w-7xl ${PORTRAIT_LAYOUT.spacing.section} relative z-10`}>
          {/* Celebration header with player name */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className={`text-center ${PORTRAIT_LAYOUT.spacing.content}`}
          >
            {/* Player name + Total label */}
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`${PORTRAIT_LAYOUT.typography.large} font-bold uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r ${
                winTier === WinTier.Legendary ? 'from-yellow-300 via-yellow-400 to-amber-500' :
                winTier === WinTier.Epic ? 'from-orange-400 via-orange-500 to-red-500' :
                winTier === WinTier.Big ? 'from-blue-400 via-blue-500 to-purple-500' :
                'from-gray-300 via-gray-200 to-gray-300'
              }`}
            >
              {playerName.toUpperCase()}'S TOTAL
            </motion.p>

            {hasBonus ? (
              <>
                <h1 className={`${PORTRAIT_LAYOUT.typography.hero} font-bold text-yellow-400`}>
                  🍌 BONUS! 🍌
                </h1>
                <p className={`${PORTRAIT_LAYOUT.typography.large} text-gray-300`}>
                  {spin.banana_count} Bananas! Bonus wheel activated!
                </p>
              </>
            ) : (
              <h1
                className={`${PORTRAIT_LAYOUT.typography.hero} font-bold ${
                  winTier === WinTier.Legendary ? 'text-yellow-400' :
                  winTier === WinTier.Epic ? 'text-orange-500' :
                  winTier === WinTier.Big ? 'text-blue-500' :
                  'text-blue-500'
                }`}
              >
                {getWinMessage(spin.total_score)}
              </h1>
            )}
          </motion.div>

          {/* Total Score with dramatic reveal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <Card className={`${
              winTier === WinTier.Legendary ? 'border-2 border-yellow-400/50' :
              winTier === WinTier.Epic ? 'border-2 border-orange-500/50' :
              winTier === WinTier.Big ? 'border-2 border-blue-500/50' :
              ''
            }`}>
              <CardBody className={`${PORTRAIT_LAYOUT.padding.cardBody} bg-gradient-to-br ${
                winTier === WinTier.Legendary ? 'from-yellow-900/20 via-gray-800 to-amber-900/20' :
                winTier === WinTier.Epic ? 'from-orange-900/20 via-gray-800 to-red-900/20' :
                winTier === WinTier.Big ? 'from-blue-900/20 via-gray-800 to-purple-900/20' :
                'from-gray-800 to-gray-900'
              } relative overflow-hidden`}>
                {/* Removed shimmer and scale animations for performance */}
                <div>
                  <ScoreDisplay
                    score={displayScore}
                    label=""
                    size="lg"
                  />
                </div>
                {spin.bonus_multiplier && spin.bonus_multiplier > 1 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className={`text-center mt-4 ${PORTRAIT_LAYOUT.typography.medium} text-green-500 font-bold`}
                  >
                    {spin.bonus_multiplier}x Multiplier Applied!
                  </motion.p>
                )}
              </CardBody>
            </Card>
          </motion.div>

          {/* Reel Values Breakdown */}
          <Card className="border border-gray-700/50">
            <CardBody className={`${PORTRAIT_LAYOUT.padding.cardCompact} bg-gradient-to-br from-gray-800/80 to-gray-900/80`}>
              <ReelValueDisplay
                values={{
                  zillow: spin.zillow_value,
                  realtor: spin.realtor_value,
                  homes: spin.homes_value,
                  google: spin.google_value,
                  smartSign: spin.smart_sign_value,
                }}
              />

              {/* Banana indicators */}
              {spin.banana_count > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-10 flex justify-center gap-8"
                >
                  {[...Array(spin.banana_count)].map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.6 + i * 0.1,
                        type: 'spring',
                        stiffness: 200,
                      }}
                      className="text-[120px]"
                    >
                      🍌
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </CardBody>
          </Card>

          {/* Auto-return message - only show after count-up completes */}
          {countUpComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <p className={`${PORTRAIT_LAYOUT.typography.medium} text-gray-400`}>
                Returning to leaderboard...
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </ScreenShake>
  );
}
