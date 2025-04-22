
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { preloadImage } from '@/utils/resource-queue';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: boolean;
  fallbackSrc?: string;
  className?: string;
  placeholderClassName?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  priority = false,
  fallbackSrc,
  className,
  placeholderClassName,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (priority && src) {
      // Preload high priority images
      preloadImage(src).catch(() => setError(true));
    }
  }, [src, priority]);

  const handleLoad = () => {
    setLoaded(true);
  };

  const handleError = () => {
    setError(true);
  };

  return (
    <>
      {!loaded && !error && (
        <div
          className={cn(
            "bg-muted animate-pulse rounded",
            placeholderClassName,
            className
          )}
          style={{ aspectRatio: props.width && props.height ? `${props.width}/${props.height}` : undefined }}
        />
      )}
      <img
        src={error && fallbackSrc ? fallbackSrc : src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          className,
          !loaded && "hidden"
        )}
        {...props}
      />
    </>
  );
};
