import { motion } from "framer-motion";

interface CircularProgressProps {
  value: number;
  max?: number;
  color?: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
  delay?: number;
}

export function CircularProgress({ 
  value, 
  max = 100, 
  color = "currentColor", 
  size = 80, 
  strokeWidth = 8,
  label,
  delay = 0
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const targetOffset = circumference - (value / max) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90 overflow-visible">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        
        {/* Fluid Filling Stroke */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={{ 
            duration: 2, 
            ease: [0.22, 1, 0.36, 1], // Custom cubic bezier for "liquid" feel
            delay: delay + 0.2 
          }}
          strokeLinecap="round"
          className="drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        />
        
        {/* Optional: Glow Effect Layer behind */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth + 4}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference, opacity: 0 }}
          animate={{ strokeDashoffset: targetOffset, opacity: 0.2 }}
          transition={{ 
            duration: 2, 
            ease: [0.22, 1, 0.36, 1], 
            delay: delay + 0.2 
          }}
          strokeLinecap="round"
          className="blur-md"
        />
      </svg>
      
      {/* Animated Value Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.5, duration: 0.5 }}
          className="text-lg font-display font-bold text-white"
        >
          {value}
        </motion.span>
        {label && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.8 }}
            className="text-[8px] font-mono text-white/50"
          >
            {label}
          </motion.span>
        )}
      </div>
    </div>
  );
}
