import { cn } from "@/lib/utils";

// Responsive grid classes
export const responsiveGridCols = {
  // For list pages with cards
  cards: "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  // For dashboard stats
  stats: "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  // For forms
  forms: "grid gap-4 grid-cols-1 md:grid-cols-2",
  // For two column layouts
  twoColumn: "grid gap-4 grid-cols-1 lg:grid-cols-2",
  // For three column layouts
  threeColumn: "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
};

// Responsive padding classes
export const responsivePadding = {
  page: "p-4 sm:p-6 lg:p-8",
  card: "p-4 sm:p-6",
  section: "py-4 sm:py-6 lg:py-8",
  compact: "p-3 sm:p-4"
};

// Responsive text sizes
export const responsiveText = {
  pageTitle: "text-2xl sm:text-3xl lg:text-4xl",
  sectionTitle: "text-xl sm:text-2xl",
  cardTitle: "text-lg sm:text-xl",
  body: "text-sm sm:text-base",
  small: "text-xs sm:text-sm"
};

// Responsive spacing
export const responsiveSpacing = {
  stack: "space-y-4 sm:space-y-6",
  inline: "space-x-2 sm:space-x-4",
  inlineReverse: "space-x-reverse space-x-2 sm:space-x-4"
};

// Responsive flex layouts
export const responsiveFlex = {
  // Stack on mobile, row on desktop
  stackToRow: "flex flex-col sm:flex-row gap-4",
  // Stack on mobile, row on desktop with RTL support
  stackToRowRTL: "flex flex-col sm:flex-row-reverse gap-4",
  // Responsive justify
  betweenCenter: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
  // Wrap when needed
  wrap: "flex flex-wrap gap-2 sm:gap-4"
};

// Responsive width classes
export const responsiveWidth = {
  modal: "w-full max-w-sm sm:max-w-md lg:max-w-lg",
  form: "w-full max-w-md sm:max-w-lg lg:max-w-2xl",
  content: "w-full max-w-7xl mx-auto"
};

// Responsive table wrapper
export const ResponsiveTable = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn("w-full overflow-x-auto -mx-4 sm:mx-0", className)}>
      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
        {children}
      </div>
    </div>
  );
};

// Mobile-first card layout
export const MobileCard = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700",
      responsivePadding.card,
      className
    )}>
      {children}
    </div>
  );
};

// Responsive button group
export const responsiveButtonGroup = {
  // Stack on mobile, inline on desktop
  stackToInline: "flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto",
  // Always inline but wrap on mobile
  inlineWrap: "flex flex-wrap gap-2"
};

// Hide/show utilities
export const responsive = {
  hideOnMobile: "hidden sm:block",
  showOnMobile: "block sm:hidden",
  hideOnTablet: "hidden md:block",
  showOnTablet: "block md:hidden"
};

// Responsive dialog sizes
export const responsiveDialog = {
  small: "w-[95vw] max-w-sm",
  medium: "w-[95vw] max-w-md sm:max-w-lg",
  large: "w-[95vw] max-w-lg sm:max-w-xl lg:max-w-2xl",
  full: "w-[95vw] h-[90vh] max-w-6xl"
};