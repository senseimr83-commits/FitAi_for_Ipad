import { useRef, useState, useEffect } from 'react';

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enabled?: boolean;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  enabled = true,
}: UseSwipeGestureOptions) {
  const [swipeDistance, setSwipeDistance] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchCurrentX = useRef(0);
  const isSwiping = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isSwiping.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchCurrentX.current = e.touches[0].clientX;
      const deltaX = touchCurrentX.current - touchStartX.current;
      const deltaY = e.touches[0].clientY - touchStartY.current;

      // Determine if this is a horizontal swipe (not vertical scroll)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isSwiping.current = true;
        setSwipeDistance(deltaX);
      }
    };

    const handleTouchEnd = () => {
      if (!isSwiping.current) {
        setSwipeDistance(0);
        return;
      }

      const distance = touchCurrentX.current - touchStartX.current;

      if (distance > threshold && onSwipeRight) {
        onSwipeRight();
      } else if (distance < -threshold && onSwipeLeft) {
        onSwipeLeft();
      }

      setSwipeDistance(0);
      isSwiping.current = false;
      touchStartX.current = 0;
      touchCurrentX.current = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, onSwipeLeft, onSwipeRight]);

  return {
    containerRef,
    swipeDistance,
    isSwiping: isSwiping.current,
  };
}
