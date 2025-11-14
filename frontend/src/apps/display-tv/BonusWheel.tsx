// frontend/src/apps/display-tv/BonusWheel.tsx

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PORTRAIT_LAYOUT, BRAND_COLORS } from '../../config';
import { audioManager, SOUNDS } from '../../utils/audioManager';
import { apiClient } from '../../lib/api/client';
import type { Spin } from '../../types/api';

interface BonusWheelProps {
  spin: Spin;
}

// 8 sections alternating between [0, 1, 2]x multipliers
const WHEEL_SECTIONS = [0, 1, 2, 0, 1, 2, 0, 1];
const SECTION_COUNT = WHEEL_SECTIONS.length;
const DEGREES_PER_SECTION = 360 / SECTION_COUNT; // 45 degrees per section

// Colors for each multiplier value
const MULTIPLIER_COLORS = {
  0: '#EF4444', // red-500 (deal falls apart!)
  1: '#3B82F6', // blue-500 (single-sided)
  2: '#10B981', // green-500 (double-sided deal!)
};

const MULTIPLIER_LABELS = {
  0: '0x',
  1: '1x',
  2: '2x',
};

export function BonusWheel({ spin }: BonusWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [finalRotation, setFinalRotation] = useState(0);
  const [landedMultiplier, setLandedMultiplier] = useState<number | null>(null);

  useEffect(() => {
    // Start spinning after a brief delay
    const startDelay = setTimeout(() => {
      setSpinning(true);

      // Randomly select which section to land on
      const targetSectionIndex = Math.floor(Math.random() * SECTION_COUNT);
      const targetMultiplier = WHEEL_SECTIONS[targetSectionIndex];

      // Calculate rotation to land on target section
      // Sections are drawn starting from top (index 0 at 0°), going clockwise
      // When we rotate the wheel clockwise, sections move clockwise too
      // To get section N under the top pointer, we need to rotate backwards (counter-clockwise)
      // Which means negative rotation, or equivalently: 360 - angle
      const fullSpins = 5; // 5 full rotations for drama
      const sectionStartAngle = targetSectionIndex * DEGREES_PER_SECTION;
      const sectionCenterAngle = sectionStartAngle + (DEGREES_PER_SECTION / 2);

      // To bring a section from its position to the top, we rotate counter-clockwise by that amount
      // In CSS, positive rotation is clockwise, so we use (360 - angle) + fullSpins
      const finalAngle = (fullSpins * 360) + (360 - sectionCenterAngle);

      console.log('Bonus Wheel Debug:', {
        targetSectionIndex,
        targetMultiplier,
        sectionStartAngle,
        sectionCenterAngle,
        finalAngle: finalAngle % 360,
        fullRotation: finalAngle
      });

      setFinalRotation(finalAngle);

      // After spin completes, show the landed multiplier
      const spinDuration = 8000; // 8 seconds for more suspense
      setTimeout(() => {
        setSpinning(false);
        setLandedMultiplier(targetMultiplier);
        audioManager.play(SOUNDS.TICK, 0.7);

        // Apply the multiplier to the spin via API
        setTimeout(async () => {
          try {
            await apiClient.applyBonus(spin.id, { multiplier: targetMultiplier });
            // Transition to results after applying multiplier - wait 4 seconds after wheel stops
            setTimeout(() => {
              apiClient.transitionToResults().catch(err =>
                console.error('Failed to transition to results:', err)
              );
            }, 4000);
          } catch (err) {
            console.error('Failed to apply bonus multiplier:', err);
          }
        }, 1500);
      }, spinDuration);
    }, 500);

    return () => clearTimeout(startDelay);
  }, [spin.id]);

  return (
    <div className={`min-h-screen flex items-center justify-center ${PORTRAIT_LAYOUT.padding.screen} bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900`}>
      {/* Ambient background shimmer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-transparent via-green-500/10 to-transparent pointer-events-none"
        animate={{
          x: ['-100%', '100%'],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <div className="w-full max-w-7xl relative z-10 flex flex-col items-center gap-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className={`${PORTRAIT_LAYOUT.typography.title} font-bold text-yellow-400 mb-4`}>
            BONUS ROUND!
          </h1>
          <p className="text-3xl text-gray-300 font-semibold">
            Double-Sided Deal
          </p>
          <p className="text-xl text-gray-400 mt-2 mb-8">
            Will your deal hold together?
          </p>
        </motion.div>

        {/* Wheel Container */}
        <div className="relative">
          {/* Top pointer/indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 z-20"
          >
            <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[50px] border-t-yellow-400 drop-shadow-2xl" />
          </motion.div>

          {/* Wheel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            {/* Spinning wheel */}
            <motion.div
              animate={{ rotate: finalRotation }}
              transition={{
                duration: 8,
                ease: [0.2, 0.8, 0.2, 1], // Smooth deceleration
              }}
              className="relative w-[600px] h-[600px]"
            >
              {/* Outer ring decoration */}
              <div className="absolute inset-0 rounded-full border-8 border-yellow-400 shadow-2xl" />

              {/* SVG Wheel Sections */}
              <svg className="w-full h-full" viewBox="0 0 200 200">
                {WHEEL_SECTIONS.map((multiplier, index) => {
                  const startAngle = index * DEGREES_PER_SECTION;
                  const endAngle = startAngle + DEGREES_PER_SECTION;

                  // Convert to radians
                  const startRad = (startAngle - 90) * (Math.PI / 180);
                  const endRad = (endAngle - 90) * (Math.PI / 180);

                  // Calculate path for pie slice
                  const x1 = 100 + 95 * Math.cos(startRad);
                  const y1 = 100 + 95 * Math.sin(startRad);
                  const x2 = 100 + 95 * Math.cos(endRad);
                  const y2 = 100 + 95 * Math.sin(endRad);

                  const pathData = `
                    M 100 100
                    L ${x1} ${y1}
                    A 95 95 0 0 1 ${x2} ${y2}
                    Z
                  `;

                  // Calculate text position (middle of the slice, 2/3 out from center)
                  const midAngle = (startAngle + endAngle) / 2;
                  const midRad = (midAngle - 90) * (Math.PI / 180);
                  const textX = 100 + 60 * Math.cos(midRad);
                  const textY = 100 + 60 * Math.sin(midRad);

                  return (
                    <g key={index}>
                      {/* Pie slice */}
                      <path
                        d={pathData}
                        fill={MULTIPLIER_COLORS[multiplier as keyof typeof MULTIPLIER_COLORS]}
                        stroke="#1F2937"
                        strokeWidth="2"
                      />
                      {/* Text label */}
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-[20px] font-black fill-white"
                        style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)' }}
                      >
                        {MULTIPLIER_LABELS[multiplier as keyof typeof MULTIPLIER_LABELS]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Center circle decoration */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gray-800 border-4 border-yellow-400 shadow-xl" />
            </motion.div>

            {/* Glow effect */}
            <motion.div
              animate={{
                opacity: spinning ? [0.4, 0.8, 0.4] : [0.6, 1, 0.6],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 rounded-full blur-3xl -z-10"
              style={{
                backgroundColor: landedMultiplier !== null
                  ? MULTIPLIER_COLORS[landedMultiplier as keyof typeof MULTIPLIER_COLORS]
                  : '#F59E0B',
                opacity: 0.4,
              }}
            />
          </motion.div>
        </div>

        {/* Result Display */}
        {landedMultiplier !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <p className="text-4xl font-bold mb-2" style={{ color: MULTIPLIER_COLORS[landedMultiplier as keyof typeof MULTIPLIER_COLORS] }}>
              {landedMultiplier === 0 && "Deal Fell Apart!"}
              {landedMultiplier === 1 && "Single-Sided Deal!"}
              {landedMultiplier === 2 && "Double-Sided Deal!"}
            </p>
            <p className="text-6xl font-black text-white">
              {MULTIPLIER_LABELS[landedMultiplier as keyof typeof MULTIPLIER_LABELS]} Multiplier
            </p>
            <p className="text-2xl text-gray-400 mt-4">
              Base Score: ${spin.base_score.toLocaleString()}
            </p>
            <p className="text-3xl font-bold text-yellow-400 mt-2">
              Final Score: ${(spin.base_score * landedMultiplier).toLocaleString()}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
