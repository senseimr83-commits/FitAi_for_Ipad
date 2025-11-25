import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  delay?: number;
  disableFloating?: boolean;
}

export function GlassCard({ children, className, title, subtitle, delay = 0, disableFloating = false }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
      }}
      transition={{ 
        type: "spring",
        stiffness: 100,
        damping: 20,
        mass: 1,
        delay: delay,
      }}
      whileHover={{ 
        scale: 1.02,
        y: -4,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      className={cn(
        "glass rounded-3xl p-6 flex flex-col relative overflow-hidden group perspective-1000",
        className
      )}
    >
      {/* Subtle Floating Animation (Breathing) */}
      {!disableFloating && (
        <motion.div
           className="absolute inset-0 -z-10"
           animate={{ y: [0, -5, 0] }}
           transition={{ 
             duration: 6, 
             repeat: Infinity, 
             ease: "easeInOut",
             delay: Math.random() * 2 // Randomize start time so cards don't float in sync
           }}
        />
      )}

      {/* Liquid Hover Effect Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Animated Glow Border on Hover */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
        style={{
          background: "linear-gradient(90deg, transparent, rgba(132,204,22,0.3), transparent)",
          backgroundSize: "200% 100%",
          animation: "shimmer 3s linear infinite"
        }}
      />
      
      {/* Top Highlight Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-20 group-hover:opacity-50 transition-opacity duration-500" />
      
      {(title || subtitle) && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.3, duration: 0.5 }}
          className="mb-6 z-10 relative"
        >
          {title && (
            <h3 className="text-lg font-display font-medium tracking-wide text-white/90 flex items-center gap-2">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs font-sans text-white/50 mt-1 uppercase tracking-wider">
              {subtitle}
            </p>
          )}
        </motion.div>
      )}
      
      <div className="relative z-10 flex-1">
        {children}
      </div>
    </motion.div>
  );
}
