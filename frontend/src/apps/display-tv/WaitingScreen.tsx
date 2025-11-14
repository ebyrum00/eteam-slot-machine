// frontend/src/apps/display-tv/WaitingScreen.tsx

import { motion } from 'framer-motion';
import { Card, CardBody } from '../../components';
import { PORTRAIT_LAYOUT } from '../../config';

interface WaitingScreenProps {
  playerName: string;
}

export function WaitingScreen({ playerName }: WaitingScreenProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${PORTRAIT_LAYOUT.padding.screen} bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden`}>
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

      {/* Moving spotlight glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#f0c14b]/10 rounded-full blur-3xl pointer-events-none"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <Card className="w-full max-w-6xl relative z-10">
        <CardBody className={`text-center ${PORTRAIT_LAYOUT.padding.cardBody}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={PORTRAIT_LAYOUT.spacing.section}
          >
            {/* Player name greeting */}
            <motion.h2
              className={`${PORTRAIT_LAYOUT.typography.title} font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f5d372] via-[#f0c14b] to-[#d4af37] mb-12 text-center`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Ready, {playerName.split(' ')[0]}?
            </motion.h2>

            {/* Simplified Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-4xl mx-auto mb-12"
            >
              <div className="bg-gradient-to-br from-gray-800/80 via-gray-800/60 to-gray-800/80 rounded-2xl p-8 border-2 border-[#d4af37]/30 shadow-2xl relative overflow-hidden">
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f0c14b]/10 to-transparent"
                  animate={{
                    x: ['-200%', '200%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />

                <div className="relative z-10">
                  <p className={`${PORTRAIT_LAYOUT.typography.small} text-gray-300 text-center mb-8 leading-relaxed`}>
                    Every day on The Edrington Team, you receive leads from Zillow, Realtor.com, Homes.com, Google, and SmartSign.
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f5d372] via-[#f0c14b] to-[#d4af37] font-bold"> Spin to discover today's opportunity!</span>
                  </p>

                  <div className="flex justify-center gap-12 mb-8">
                    <motion.div
                      className="text-center bg-gray-900/50 rounded-xl p-6 border border-[#d4af37]/20"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <p className={`${PORTRAIT_LAYOUT.typography.small} text-gray-400 uppercase tracking-wider mb-2`}>Lead Values</p>
                      <p className={`${PORTRAIT_LAYOUT.typography.medium} text-transparent bg-clip-text bg-gradient-to-r from-[#f5d372] via-[#f0c14b] to-[#d4af37] font-bold`}>$25K - $500K</p>
                    </motion.div>
                    <motion.div
                      className="text-center bg-gray-900/50 rounded-xl p-6 border border-[#f0c14b]/20"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <p className={`${PORTRAIT_LAYOUT.typography.small} text-gray-400 uppercase tracking-wider mb-2`}>Banana Value</p>
                      <p className={`${PORTRAIT_LAYOUT.typography.medium} text-[#f0c14b] font-bold`}>🍌 $3,000,000</p>
                    </motion.div>
                  </div>

                  <motion.div
                    className="bg-gradient-to-r from-yellow-900/30 via-yellow-800/40 to-yellow-900/30 rounded-xl p-6 border-2 border-[#ffd700]/50 text-center shadow-lg relative overflow-hidden"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    {/* Pulsing glow effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffd700]/20 to-transparent"
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <p className={`${PORTRAIT_LAYOUT.typography.small} text-[#ffd700] font-bold relative z-10`}>
                      🍌 Get 3 Bananas = BONUS WHEEL! 🍌
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Premium Animated PRESS Button */}
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="flex justify-center py-8"
            >
              <div className="relative">
                {/* Outer glow rings - continuous smooth animation */}
                <motion.div
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.4, 0, 0.4],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400 to-red-600 blur-xl"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: 1,
                  }}
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-red-700 blur-lg"
                />

                {/* Main button */}
                <motion.div
                  className={`${PORTRAIT_LAYOUT.components.button.ready} rounded-full relative overflow-hidden shadow-[0_0_70px_rgba(239,68,68,0.7),0_0_110px_rgba(220,38,38,0.5)]`}
                  animate={{
                    filter: [
                      'brightness(1)',
                      'brightness(1.15)',
                      'brightness(1)',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-700" />

                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent"
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />

                  {/* Sweeping shimmer */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{
                      x: ['-200%', '200%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />

                  {/* Inner border/highlight */}
                  <div className="absolute inset-4 rounded-full border-4 border-white/20" />

                  {/* Text */}
                  <div className="relative z-10 h-full flex items-center justify-center px-4">
                    <motion.div
                      animate={{
                        textShadow: [
                          '0 0 20px rgba(255, 255, 255, 0.5)',
                          '0 0 30px rgba(255, 255, 255, 0.8)',
                          '0 0 20px rgba(255, 255, 255, 0.5)',
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="text-white text-[72px] font-black tracking-tight"
                    >
                      PRESS
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.p
              className={`text-[#f0c14b] ${PORTRAIT_LAYOUT.typography.medium} font-bold`}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Press the button to spin!
            </motion.p>
          </motion.div>
        </CardBody>
      </Card>
    </div>
  );
}
