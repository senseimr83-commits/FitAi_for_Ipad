import { useRef, useCallback } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  duration?: number;
  enabled?: boolean;
}

export function useLongPress({
  onLongPress,
  duration = 500,
  enabled = true,
}: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout>();
  const isLongPressRef = useRef(false);

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!enabled) return;

    isLongPressRef.current = false;
    
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, duration);
  }, [enabled, duration, onLongPress]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    isLongPressRef.current = false;
  }, []);

  const handlers = {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: cancel,
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
  };

  return {
    handlers,
    isLongPress: isLongPressRef.current,
  };
}
