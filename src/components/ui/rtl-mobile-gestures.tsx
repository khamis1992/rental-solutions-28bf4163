import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { setupRTLGestures, rtlMobileGestures } from '@/utils/rtl-advanced-features';

/**
 * RTL Mobile Gesture Hook
 */
interface UseRTLGesturesOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeNext?: () => void;      // RTL-aware next (swipe left in RTL)
  onSwipePrevious?: () => void;  // RTL-aware previous (swipe right in RTL)
  threshold?: number;
  restraint?: number;
  allowedTime?: number;
  enabled?: boolean;
}

export const useRTLGestures = (options: UseRTLGesturesOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipeNext,
    onSwipePrevious,
    threshold = 50,
    restraint = 100,
    allowedTime = 300,
    enabled = true,
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    const element = elementRef.current;
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;

      if (deltaTime <= allowedTime) {
        if (Math.abs(deltaX) >= threshold && Math.abs(deltaY) <= restraint) {
          // Horizontal swipe
          if (deltaX > 0) {
            // Swipe right
            onSwipeRight?.();
            onSwipePrevious?.(); // In RTL, swipe right = previous
          } else {
            // Swipe left
            onSwipeLeft?.();
            onSwipeNext?.(); // In RTL, swipe left = next
          }
        } else if (Math.abs(deltaY) >= threshold && Math.abs(deltaX) <= restraint) {
          // Vertical swipe
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    cleanupRef.current = () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };

    return cleanupRef.current;
  }, [
    enabled,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipeNext,
    onSwipePrevious,
    threshold,
    restraint,
    allowedTime,
  ]);

  return elementRef;
};

/**
 * RTL Swipeable Container Component
 */
interface RTLSwipeableProps {
  children: React.ReactNode;
  onSwipeNext?: () => void;
  onSwipePrevious?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
  disabled?: boolean;
  showIndicators?: boolean;
  threshold?: number;
}

export const RTLSwipeable: React.FC<RTLSwipeableProps> = ({
  children,
  onSwipeNext,
  onSwipePrevious,
  onSwipeUp,
  onSwipeDown,
  className,
  disabled = false,
  showIndicators = false,
  threshold = 50,
}) => {
  const [isActive, setIsActive] = useState(false);
  
  const gestureRef = useRTLGestures({
    onSwipeNext,
    onSwipePrevious,
    onSwipeUp,
    onSwipeDown,
    threshold,
    enabled: !disabled,
  });

  const handleTouchStart = () => {
    setIsActive(true);
  };

  const handleTouchEnd = () => {
    setIsActive(false);
  };

  return (
    <div
      ref={gestureRef}
      className={cn(
        'relative select-none touch-pan-y',
        isActive && 'scale-[0.98] transition-transform duration-100',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      dir="rtl"
    >
      {children}
      
      {showIndicators && !disabled && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2 rtl:space-x-reverse">
          <div className="w-2 h-2 bg-white/50 rounded-full" />
          <div className="w-2 h-2 bg-white/50 rounded-full" />
          <div className="w-2 h-2 bg-white/50 rounded-full" />
        </div>
      )}
    </div>
  );
};

/**
 * RTL Carousel Component with Gesture Support
 */
interface RTLCarouselProps {
  items: React.ReactNode[];
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  className?: string;
  itemClassName?: string;
  showDots?: boolean;
  showArrows?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  loop?: boolean;
}

export const RTLCarousel: React.FC<RTLCarouselProps> = ({
  items,
  currentIndex = 0,
  onIndexChange,
  className,
  itemClassName,
  showDots = true,
  showArrows = false,
  autoPlay = false,
  autoPlayInterval = 3000,
  loop = true,
}) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const autoPlayRef = useRef<NodeJS.Timeout>();

  const totalItems = items.length;

  const goToNext = useCallback(() => {
    const nextIndex = loop 
      ? (activeIndex + 1) % totalItems 
      : Math.min(activeIndex + 1, totalItems - 1);
    setActiveIndex(nextIndex);
    onIndexChange?.(nextIndex);
  }, [activeIndex, totalItems, loop, onIndexChange]);

  const goToPrevious = useCallback(() => {
    const prevIndex = loop 
      ? (activeIndex - 1 + totalItems) % totalItems 
      : Math.max(activeIndex - 1, 0);
    setActiveIndex(prevIndex);
    onIndexChange?.(prevIndex);
  }, [activeIndex, totalItems, loop, onIndexChange]);

  const goToIndex = useCallback((index: number) => {
    setActiveIndex(index);
    onIndexChange?.(index);
  }, [onIndexChange]);

  // Auto play functionality
  useEffect(() => {
    if (autoPlay) {
      autoPlayRef.current = setInterval(goToNext, autoPlayInterval);
      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    }
  }, [autoPlay, autoPlayInterval, goToNext]);

  // Pause auto play on user interaction
  const handleUserInteraction = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const gestureRef = useRTLGestures({
    onSwipeNext: () => {
      handleUserInteraction();
      goToNext();
    },
    onSwipePrevious: () => {
      handleUserInteraction();
      goToPrevious();
    },
  });

  return (
    <div className={cn('relative overflow-hidden', className)} dir="rtl">
      <div
        ref={gestureRef}
        className="flex transition-transform duration-300 ease-out touch-pan-y"
        style={{
          transform: `translateX(${activeIndex * -100}%)`,
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className={cn('w-full flex-shrink-0', itemClassName)}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showArrows && (
        <>
          <button
            onClick={() => {
              handleUserInteraction();
              goToPrevious();
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
            disabled={!loop && activeIndex === 0}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => {
              handleUserInteraction();
              goToNext();
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200"
            disabled={!loop && activeIndex === totalItems - 1}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 rtl:space-x-reverse">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                handleUserInteraction();
                goToIndex(index);
              }}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                index === activeIndex
                  ? 'bg-white scale-125'
                  : 'bg-white/50 hover:bg-white/75'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * RTL Drawer Component with Gesture Support
 */
interface RTLDrawerProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  position?: 'right' | 'left' | 'top' | 'bottom';
  className?: string;
  overlayClassName?: string;
  closeOnOverlayClick?: boolean;
  closeOnSwipe?: boolean;
}

export const RTLDrawer: React.FC<RTLDrawerProps> = ({
  children,
  isOpen,
  onClose,
  position = 'right', // Default to right for RTL
  className,
  overlayClassName,
  closeOnOverlayClick = true,
  closeOnSwipe = true,
}) => {
  const gestureRef = useRTLGestures({
    onSwipeRight: position === 'right' && closeOnSwipe ? onClose : undefined,
    onSwipeLeft: position === 'left' && closeOnSwipe ? onClose : undefined,
    onSwipeUp: position === 'bottom' && closeOnSwipe ? onClose : undefined,
    onSwipeDown: position === 'top' && closeOnSwipe ? onClose : undefined,
    enabled: closeOnSwipe,
  });

  const getDrawerClasses = () => {
    const baseClasses = 'fixed bg-white shadow-xl transition-transform duration-300 ease-out z-50';
    
    switch (position) {
      case 'right':
        return cn(
          baseClasses,
          'top-0 right-0 h-full w-80 max-w-[90vw]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        );
      case 'left':
        return cn(
          baseClasses,
          'top-0 left-0 h-full w-80 max-w-[90vw]',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        );
      case 'top':
        return cn(
          baseClasses,
          'top-0 left-0 right-0 h-80 max-h-[90vh]',
          isOpen ? 'translate-y-0' : '-translate-y-full'
        );
      case 'bottom':
        return cn(
          baseClasses,
          'bottom-0 left-0 right-0 h-80 max-h-[90vh]',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        );
      default:
        return baseClasses;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 transition-opacity duration-300 z-40',
          overlayClassName
        )}
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Drawer */}
      <div
        ref={gestureRef}
        className={cn(getDrawerClasses(), className)}
        dir="rtl"
      >
        {children}
      </div>
    </>
  );
};

/**
 * RTL Pull to Refresh Component
 */
interface RTLPullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshThreshold?: number;
  className?: string;
  disabled?: boolean;
}

export const RTLPullToRefresh: React.FC<RTLPullToRefreshProps> = ({
  children,
  onRefresh,
  refreshThreshold = 80,
  className,
  disabled = false,
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;
    
    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      e.preventDefault();
      setIsPulling(true);
      setPullDistance(Math.min(distance, refreshThreshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return;
    
    if (pullDistance >= refreshThreshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, refreshThreshold, disabled, isRefreshing]);

  const pullProgress = Math.min(pullDistance / refreshThreshold, 1);
  const shouldRefresh = pullDistance >= refreshThreshold;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-auto', className)}
      style={{
        transform: isPulling ? `translateY(${pullDistance * 0.5}px)` : undefined,
        transition: isPulling ? 'none' : 'transform 0.3s ease-out',
      }}
      dir="rtl"
    >
      {/* Pull to Refresh Indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 bg-blue-50 text-blue-600 text-sm font-medium z-10"
          style={{
            transform: `translateY(-100%) translateY(${pullDistance * 0.5}px)`,
            opacity: pullProgress,
          }}
        >
          {isRefreshing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent ml-2" />
              جاري التحديث...
            </>
          ) : shouldRefresh ? (
            'اتركه للتحديث'
          ) : (
            'اسحب للتحديث'
          )}
        </div>
      )}
      
      {children}
    </div>
  );
};

/**
 * Export all RTL mobile gesture components
 */
export {
  useRTLGestures,
  RTLSwipeable as Swipeable,
  RTLCarousel as Carousel,
  RTLDrawer as Drawer,
  RTLPullToRefresh as PullToRefresh,
}; 