import { motion } from 'framer-motion';
import { RefreshCw, Loader2 } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const isVisible = pullDistance > 0 || isRefreshing;

  return (
    <motion.div
      initial={{ opacity: 0, y: -60 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        y: isVisible ? 0 : -60,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      style={{
        transform: `translateX(-50%) translateY(${Math.min(pullDistance * 0.5, 40)}px)`,
      }}
    >
      <div className="glass rounded-full p-4 shadow-2xl border-primary/30" data-testid="indicator-pull-to-refresh">
        {isRefreshing ? (
          <Loader2 className="w-6 h-6 text-primary animate-spin" data-testid="icon-refreshing" />
        ) : (
          <motion.div
            animate={{
              rotate: progress * 360,
              scale: 0.8 + progress * 0.2,
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <RefreshCw
              className="w-6 h-6 transition-colors"
              style={{
                color: progress >= 1 ? 'hsl(84 100% 50%)' : 'rgba(255, 255, 255, 0.5)',
              }}
            />
          </motion.div>
        )}
      </div>
      
      {!isRefreshing && pullDistance > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-white/60 text-center mt-2 font-mono uppercase tracking-wider"
        >
          {progress >= 1 ? 'Release to sync' : 'Pull to sync'}
        </motion.p>
      )}
    </motion.div>
  );
}
