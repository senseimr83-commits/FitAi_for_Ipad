import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface MetricTooltipProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string | number;
  description: string;
  trend?: string;
  details?: Array<{ label: string; value: string }>;
}

export function MetricTooltip({
  isOpen,
  onClose,
  title,
  value,
  description,
  trend,
  details,
}: MetricTooltipProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Tooltip Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
          >
            <div className="glass rounded-3xl p-6 border-primary/20 shadow-2xl">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-display font-bold text-white">
                    {title}
                  </h3>
                  <p className="text-4xl font-display font-bold text-primary mt-2">
                    {value}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  data-testid="button-close-tooltip"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Description */}
              <p className="text-white/70 text-sm leading-relaxed mb-4">
                {description}
              </p>

              {/* Trend */}
              {trend && (
                <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-xs font-mono text-primary uppercase tracking-wider mb-1">
                    Trend
                  </p>
                  <p className="text-sm text-white/80">{trend}</p>
                </div>
              )}

              {/* Additional Details */}
              {details && details.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-mono text-white/40 uppercase tracking-wider">
                    Details
                  </p>
                  {details.map((detail, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2 rounded-lg bg-white/5"
                    >
                      <span className="text-sm text-white/60">{detail.label}</span>
                      <span className="text-sm font-medium text-white">
                        {detail.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tap to Close Hint */}
              <p className="text-xs text-white/40 text-center mt-6 font-mono uppercase tracking-wider">
                Tap anywhere to close
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
