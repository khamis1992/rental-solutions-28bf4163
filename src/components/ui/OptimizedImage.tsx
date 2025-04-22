import React, { useEffect, useState, useRef } from 'react';
import { preloadImage, ResourcePriority } from '../../utils/resource-queue';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: ResourcePriority;
  loadingPlaceholder?: React.ReactNode;
  errorPlaceholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  lazyLoad?: boolean;
  sizes?: string;
  widths?: number[];
  formats?: Array<'webp' | 'avif' | 'jpg' | 'png' | 'jpeg'>;
  blurDataUrl?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  priority = ResourcePriority.MEDIUM,
  loadingPlaceholder,
  errorPlaceholder,
  onLoad,
  onError,
  lazyLoad = true,
  sizes,
  widths,
  formats,
  blurDataUrl,
  className,
  style,
  ...imgProps
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate srcSet if widths are provided
  const srcSet = widths 
    ? widths
      .map(width => {
        // For each format, generate a srcset entry
        if (formats && formats.length) {
          return formats.map(format => {
            // Simple conversion - in production you'd use actual image transformation
            // This is just a placeholder for the concept
            const formatSrc = src.replace(/\.\w+$/, `.${format}`);
            return `${formatSrc}?width=${width} ${width}w`;
          }).join(', ');
        }
        return `${src}?width=${width} ${width}w`;
      })
      .join(', ')
    : undefined;
  
  useEffect(() => {
    let isMounted = true;
    setIsLoaded(false);
    setHasError(false);

    const loadImage = () => {
      // Use the resource queue to load the image with proper prioritization
      preloadImage(src, priority)
        .then(() => {
          if (isMounted) {
            setIsLoaded(true);
            onLoad?.();
          }
        })
        .catch((error) => {
          console.error('Failed to load image:', error);
          if (isMounted) {
            setHasError(true);
            onError?.();
          }
        });
    };

    // If using lazy loading, set up intersection observer
    if (lazyLoad) {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries.some(entry => entry.isIntersecting)) {
          loadImage();
          if (observerRef.current && imgRef.current) {
            observerRef.current.unobserve(imgRef.current);
          }
        }
      }, {
        rootMargin: '200px', // Start loading when image gets within 200px of viewport
      });

      if (imgRef.current) {
        observerRef.current.observe(imgRef.current);
      }
    } else {
      // Load immediately if not lazy loading
      loadImage();
    }

    return () => {
      isMounted = false;
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [src, priority, lazyLoad]);

  // If there's an error, show error placeholder
  if (hasError) {
    return (
      <div className={className} style={{ ...style, position: 'relative' }}>
        {errorPlaceholder || (
          <div 
            style={{ 
              backgroundColor: '#f1f1f1', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              minHeight: '100px'
            }}
          >
            <span>Failed to load image</span>
          </div>
        )}
      </div>
    );
  }

  // Define blur data URL style for placeholder
  const blurStyle = blurDataUrl 
    ? {
        backgroundImage: `url(${blurDataUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(20px)',
        transform: 'scale(1.2)', // Slightly larger to prevent edges from showing
      }
    : undefined;

  return (
    <div className={className} style={{ ...style, position: 'relative', overflow: 'hidden' }}>
      {/* Show placeholder until image is loaded */}
      {!isLoaded && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, ...blurStyle }}>
          {loadingPlaceholder}
        </div>
      )}
      
      {/* The actual image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        srcSet={srcSet}
        sizes={sizes}
        loading={lazyLoad ? 'lazy' : 'eager'}
        onLoad={() => {
          setIsLoaded(true);
          onLoad?.();
        }}
        onError={() => {
          setHasError(true);
          onError?.();
        }}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          width: '100%',
          height: 'auto'
        }}
        {...imgProps}
      />
    </div>
  );
};

// Simple preloader function to use outside of the component
export function preloadImageSrc(src: string, priority = ResourcePriority.LOW): void {
  preloadImage(src, priority).catch(error => {
    console.error('Failed to preload image:', error);
  });
}

export default OptimizedImage;