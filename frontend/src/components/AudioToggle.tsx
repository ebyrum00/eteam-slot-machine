// frontend/src/components/AudioToggle.tsx

import { useState } from 'react';
import { motion } from 'framer-motion';
import { audioManager } from '../utils/audioManager';

export function AudioToggle() {
  const [muted, setMuted] = useState(audioManager.isMuted());

  const handleToggle = async () => {
    // Resume AudioContext on first user interaction
    await audioManager.resume();
    const newMutedState = audioManager.toggleMute();
    setMuted(newMutedState);
  };

  return (
    <motion.button
      onClick={handleToggle}
      className="fixed bottom-8 right-8 w-16 h-16 bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl hover:bg-gray-700/80 transition-colors z-50"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {muted ? '🔇' : '🔊'}
    </motion.button>
  );
}
