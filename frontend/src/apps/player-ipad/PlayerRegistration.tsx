import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../lib/api/client';
import { Card, CardHeader, CardBody, CardFooter, Input, Button } from '../../components';
import { motion } from 'framer-motion';
import type { Player } from '../../types/api';

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    createPlayerMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card>
          <CardHeader>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-primary-500 mb-2">
                Welcome to the Slot Machine!
              </h1>
              <p className="text-gray-400">
                Enter your information to play
              </p>
            </div>
          </CardHeader>

          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Full Name"
                type="text"
                placeholder="John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                required
                autoFocus
              />

              <Input
                label="Email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="423-555-1234"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
                required
              />

              {errors.form && (
                <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
                  <p className="text-red-500 text-sm">{errors.form}</p>
                </div>
              )}
            </form>
          </CardBody>

          <CardFooter>
            <motion.div
              animate={isFormValid ? {
                boxShadow: [
                  '0 0 20px rgba(59, 130, 246, 0.5)',
                  '0 0 40px rgba(59, 130, 246, 0.8)',
                  '0 0 20px rgba(59, 130, 246, 0.5)',
                ]
              } : {}}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="rounded-lg"
            >
              <Button
                variant="primary"
                size="lg"
                color="grey"
                fullWidth
                loading={createPlayerMutation.isPending}
                onClick={handleSubmit}
                className={isFormValid ? 'relative overflow-hidden' : ''}
              >
                {isFormValid && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: ['-200%', '200%'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                )}
                <span className="relative z-10">Let's Play!</span>
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
