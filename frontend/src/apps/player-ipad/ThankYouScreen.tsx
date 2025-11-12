import { motion } from 'framer-motion';
import { Card, CardBody } from '../../components';
import type { Player } from '../../types/api';

interface ThankYouScreenProps {
  player: Player;
}

export function ThankYouScreen({ player }: ThankYouScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <Card>
          <CardBody className="text-center py-16 space-y-8">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-8xl"
            >
              ✅
            </motion.div>

            <div>
              <h1 className="text-5xl font-bold text-primary-500 mb-4">
                Thanks, {player.name.split(' ')[0]}!
              </h1>
              <p className="text-2xl text-gray-300">
                Now go press the big red button!
              </p>
            </div>

            <p className="text-gray-400 text-lg">
              Watch the TV screen for your results
            </p>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
