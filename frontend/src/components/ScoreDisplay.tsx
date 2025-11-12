import { motion } from 'framer-motion';

interface ScoreDisplayProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const sizeClasses = {
  sm: 'text-3xl',      // 30px
  md: 'text-5xl',      // 48px
  lg: 'text-[80px]',   // 80px - for 1080x1920
};

export function ScoreDisplay({
  score,
  label,
  size = 'md',
  animated = true,
}: ScoreDisplayProps) {
  const formattedScore = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(score);

  const Component = animated ? motion.div : 'div';

  return (
    <div className="flex flex-col items-center gap-4">
      {label && (
        <span className="text-gray-400 text-2xl uppercase tracking-wider font-semibold">
          {label}
        </span>
      )}
      <Component
        {...(animated && {
          initial: { scale: 0 },
          animate: { scale: 1 },
          transition: { type: 'spring', stiffness: 200, damping: 15 },
        })}
        className={`${sizeClasses[size]} font-bold text-primary-500 tracking-tight`}
      >
        {formattedScore}
      </Component>
    </div>
  );
}

interface ReelValueDisplayProps {
  values: {
    zillow: number;
    realtor: number;
    homes: number;
    google: number;
    smartSign: number;
  };
}

export function ReelValueDisplay({ values }: ReelValueDisplayProps) {
  const reels = [
    { name: 'Zillow', value: values.zillow },
    { name: 'Realtor', value: values.realtor },
    { name: 'Homes', value: values.homes },
    { name: 'Google', value: values.google },
    { name: 'Smart Sign', value: values.smartSign },
  ];

  return (
    <div className="grid grid-cols-5 gap-6">
      {reels.map((reel, index) => (
        <motion.div
          key={reel.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-700 rounded-lg p-6 text-center"
        >
          <div className="text-xl text-gray-400 mb-3">{reel.name}</div>
          <div className="text-2xl font-bold text-white">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
            }).format(reel.value)}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
