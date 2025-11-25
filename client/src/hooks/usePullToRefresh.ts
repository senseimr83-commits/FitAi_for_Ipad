import { useEffect, useRef, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
  enabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  enabled = true,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return;
      
      // Find the actual scrollable container (main element in layout)
      const scrollableElement = document.querySelector('main');
      const scrollTop = scrollableElement ? scrollableElement.scrollTop : 0;
      
      // Only allow pull-to-refresh when scrolled to the top
      if (scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY;
        setCanPull(true);
      } else {
        setCanPull(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canPull || isRefreshing) return;

      touchCurrentY.current = e.touches[0].clientY;
      const diff = touchCurrentY.current - touchStartY.current;

      if (diff > 0) {
        // Prevent default scrolling when pulling down
        e.preventDefault();
        
        // Apply resistance to make it feel natural
        const distance = Math.min(diff / resistance, threshold * 1.5);
        setPullDistance(distance);
      }
    };

    const handleTouchEnd = async () => {
      if (!canPull || isRefreshing) return;

      setCanPull(false);

      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        setPullDistance(threshold);

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        // Bounce back if threshold not met
        setPullDistance(0);
      }

      touchStartY.current = 0;
      touchCurrentY.current = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, isRefreshing, canPull, pullDistance, threshold, resistance, onRefresh]);

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    isThresholdMet: pullDistance >= threshold,
  };
}
