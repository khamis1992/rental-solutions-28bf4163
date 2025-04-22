import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { loadImage, ResourcePriority } from '@/utils/resource-queue';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string;
  priority?: boolean;
  loadingPriority?: ResourcePriority;
}

export function OptimizedImage({ 
  src, 
  alt, 
  className, 
  placeholderSrc = '/placeholder.svg',
  priority = false,
  loadingPriority = ResourcePriority.MEDIUM,
  ...props 
}: OptimizedImageProps) {
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!src) return;

    // If priority is true, use HIGH priority, otherwise use provided loadingPriority
    const imagePriority = priority ? ResourcePriority.HIGH : loadingPriority;

    loadImage(src, imagePriority)
      .then(() => {
        setCurrentSrc(src);
        setIsLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load image:', err);
        setError(err);
        setIsLoading(false);
      });
  }, [src, priority, loadingPriority]);

  return (
    <div className={cn(
      'relative overflow-hidden bg-muted',
      error && 'bg-destructive/10',
      className
    )}>
      <img
        src={currentSrc}
        alt={alt}
        className={cn(
          'transition-all duration-300',
          isLoading && 'scale-110 blur-sm',
          !isLoading && 'scale-100 blur-0',
          error && 'opacity-50'
        )}
        loading={priority ? 'eager' : 'lazy'}
        {...props}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-destructive">
          Failed to load image
        </div>
      )}
    </div>
  );
}