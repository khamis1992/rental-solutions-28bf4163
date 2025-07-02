
// Hook مخصص للتحقق من الوضع المحمول
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

interface MobileCustomerOptimizationProps {
  children: React.ReactNode;
}

export const MobileCustomerOptimization: React.FC<MobileCustomerOptimizationProps> = ({
  children
}) => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  // إضافة كلاسات CSS خاصة بالوضع المحمول
  React.useEffect(() => {
    if (isMobile) {
      document.body.classList.add('mobile-customer-view');
    } else {
      document.body.classList.remove('mobile-customer-view');
    }
    
    return () => {
      document.body.classList.remove('mobile-customer-view');
    };
  }, [isMobile]);

  return (
    <div 
      className={`customer-page-container ${isMobile ? 'mobile-layout' : 'desktop-layout'}`}
      style={{
        '--mobile-padding': isMobile ? '0.75rem' : '1.5rem',
        '--mobile-gap': isMobile ? '0.75rem' : '1.5rem',
        '--mobile-card-padding': isMobile ? '1rem' : '1.5rem',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

// Hook مخصص للتحقق من الوضع المحمول
export const useMobileCustomerView = () => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen: isMobile || isTablet,
    gridCols: isMobile ? 1 : isTablet ? 2 : 3,
    cardSize: isMobile ? 'sm' : 'md' as 'sm' | 'md' | 'lg'
  };
}; 