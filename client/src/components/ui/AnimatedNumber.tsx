import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
}

export function AnimatedNumber({ 
  value, 
  className = "", 
  suffix = "", 
  prefix = "",
  decimals = 0,
  duration = 1.5
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState("0");
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { 
    damping: 30, 
    stiffness: 100
  });

  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasAnimated.current) {
      motionValue.set(value);
      hasAnimated.current = true;
    } else {
      motionValue.set(value);
    }
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(latest.toFixed(decimals));
    });
    return () => unsubscribe();
  }, [springValue, decimals]);

  return (
    <motion.span className={className}>
      {prefix}{displayValue}{suffix}
    </motion.span>
  );
}
