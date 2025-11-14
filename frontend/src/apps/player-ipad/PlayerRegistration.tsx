import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { Card, CardHeader, CardBody, CardFooter, Input, Button } from '../../components';
import { motion } from 'framer-motion';
import type { Player } from '../../types/api';
import { audioManager } from '../../utils/audioManager';

interface PlayerRegistrationProps {
  onComplete: (player: Player) => void;
}

export function PlayerRegistration({ onComplete }: PlayerRegistrationProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if form is valid (all fields filled with valid data)
  const isFormValid = name.trim() !== '' &&
                      email.trim() !== '' &&
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
                      phone.trim() !== '';

  const createPlayerMutation = useMutation({
    mutationFn: apiClient.createPlayer.bind(apiClient),
    onSuccess: (player: Player) => {
      onComplete(player);
    },
    onError: (error) => {
      console.error('Failed to create player:', error);
      setErrors({ form: error.message });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Resume AudioContext on user interaction
    await audioManager.resume();

    createPlayerMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Ambient background shimmer - matching leaderboard */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-500/5 to-transparent pointer-events-none"
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

      {/* Moving gold light rays */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: 'linear-gradient(45deg, transparent 40%, rgba(245, 158, 11, 0.15) 50%, transparent 60%)',
        }}
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Floating emojis */}
      {['🎰', '💰', '🏆', '⭐', '🎲', '💎'].map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-6xl pointer-events-none"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            opacity: 0.15,
          }}
          animate={{
            y: [-20, 20, -20],
            rotate: [-10, 10, -10],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        >
          {emoji}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10"
      >
        <Card className="border-4 border-yellow-400/30 shadow-2xl">
          <CardHeader className="bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-amber-600/10 relative overflow-hidden">
            {/* Header shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent"
              animate={{
                x: ['-200%', '200%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            <div className="text-center relative z-10">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* Floating crown emoji */}
                <motion.div
                  className="text-6xl mb-2"
                  animate={{
                    y: [-5, 5, -5],
                    rotate: [-5, 5, -5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  👑
                </motion.div>

                <motion.h1
                  className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 mb-3"
                  animate={{
                    opacity: [0.95, 1, 0.95],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  Lead Lottery
                </motion.h1>
                <p className="text-xl text-gray-300 font-semibold">
                  Spin for Your Daily Deal Flow!
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Discover what a day of lead opportunities feels like on Chattanooga’s top real estate team.
                </p>
              </motion.div>
            </div>
          </CardHeader>

          <CardBody className="pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                  required
                  autoFocus
                  className="text-lg"
                />
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Input
                  label="Email"
                  type="email"
                  placeholder="jane@realestate.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  required
                  className="text-lg"
                />
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="423-555-1234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={errors.phone}
                  required
                  className="text-lg"
                />
              </motion.div>

              {errors.form && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500 rounded-lg"
                >
                  <p className="text-red-500 text-sm">{errors.form}</p>
                </motion.div>
              )}
            </form>
          </CardBody>

          <CardFooter className="bg-gradient-to-br from-amber-900/10 to-gray-900/50 relative overflow-hidden">
            {/* Footer shimmer */}
            {isFormValid && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent"
                animate={{
                  x: ['-200%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            )}

            <motion.div
              animate={isFormValid ? {
                scale: [1, 1.02, 1],
              } : {}}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-full relative z-10"
            >
              <motion.div
                animate={isFormValid ? {
                  boxShadow: [
                    '0 0 30px rgba(245, 158, 11, 0.6)',
                    '0 0 50px rgba(251, 191, 36, 0.9)',
                    '0 0 30px rgba(245, 158, 11, 0.6)',
                  ]
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="rounded-xl"
              >
                <Button
                  variant="primary"
                  size="lg"
                  color="grey"
                  fullWidth
                  loading={createPlayerMutation.isPending}
                  onClick={handleSubmit}
                  className={`${
                    isFormValid
                      ? 'relative overflow-hidden bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:via-yellow-400 hover:to-amber-500 border-2 border-yellow-400'
                      : 'bg-gray-700'
                  } text-xl py-6 font-bold transition-all duration-300`}
                >
                  {isFormValid && (
                    <>
                      {/* Gold shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{
                          x: ['-200%', '200%'],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-yellow-300/0 via-yellow-300/30 to-yellow-300/0"
                        animate={{
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                    </>
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <motion.span
                      className="text-3xl inline-block"
                      animate={isFormValid ? {
                        y: [-5, 5, -5],
                        rotate: [-10, 10, -10],
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      🎰
                    </motion.span>
                    <span>Let's Play!</span>
                    <motion.span
                      className="text-3xl inline-block"
                      animate={isFormValid ? {
                        y: [-5, 5, -5],
                        rotate: [10, -10, 10],
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.5,
                      }}
                    >
                      🎰
                    </motion.span>
                  </span>
                </Button>
              </motion.div>
            </motion.div>

            <motion.p
              className="text-center text-amber-400/70 text-sm mt-4 font-semibold relative z-10"
              animate={{
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
            </motion.p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
