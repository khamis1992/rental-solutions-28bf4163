
import React from 'react';
import { VehicleCard } from '@/components/ui/vehicle-card';
import { VehicleFilterParams } from '@/types/vehicle';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useTranslation as useContextTranslation } from '@/contexts/TranslationContext';
import { useVehiclesList } from '@/hooks/use-vehicles-pagination';
import { usePagination } from '@/hooks/use-pagination';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { useIsMobile } from '@/hooks/use-mobile';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationLink } from '@/components/ui/pagination';

interface VehicleGridProps {
  onSelectVehicle?: (id: string) => void;
  filter?: VehicleFilterParams;
  showAdd?: boolean;
}

const VehicleGrid: React.FC<VehicleGridProps> = ({ onSelectVehicle, filter, showAdd = true }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isRTL } = useContextTranslation();
  const isMobile = useIsMobile();
  
  // Get pagination state and controls
  const { pagination, setPage, nextPage, prevPage, canNextPage, canPrevPage, totalPages } = usePagination({ 
    initialPage: 1,
    initialPageSize: 12  // Show more items per page for the grid view
  });
  
  // Fetch vehicles with pagination
  const { data, isLoading, error, refetch } = useVehiclesList({ 
    filters: filter,
    pagination
  });
  
  const vehicles = data?.data || [];
  const totalCount = data?.count || 0;
  
  // Setup infinite scrolling for mobile
  const { loadMoreRef, isFetchingMore } = useInfiniteScroll({
    fetchMore: nextPage,
    isLoading,
    hasMore: canNextPage,
    enabled: isMobile
  });
  
  // Handle navigation to vehicle details
  const handleSelect = (id: string) => {
    if (onSelectVehicle) {
      onSelectVehicle(id);
    } else {
      navigate(`/vehicles/${id}`);
    }
  };

  // Loading state
  if (isLoading && !isFetchingMore) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 section-transition">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="overflow-hidden border border-border/60 rounded-lg">
            <Skeleton className="h-48 w-full" />
            <div className="p-5">
              <Skeleton className="h-6 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <div className="px-5 pb-5 pt-0">
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="flex items-center space-x-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{t('common.error')}</h3>
        </div>
        <p className="mt-2">{error instanceof Error ? error.message : t('common.unknownError')}</p>
      </Card>
    );
  }

  // No vehicles found
  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="bg-muted/50 border border-border text-muted-foreground p-8 rounded-md text-center">
        <h3 className="text-lg font-semibold mb-2">{t('vehicles.noVehicles')}</h3>
        <p className="mb-4">{t('vehicles.noVehiclesMatch')}</p>
        {showAdd && (
          <button 
            onClick={() => navigate('/vehicles/add')}
            className={cn(
              "inline-flex items-center justify-center rounded-md text-sm font-medium",
              "bg-primary text-primary-foreground shadow hover:bg-primary/90",
              "h-9 px-4 py-2"
            )}
          >
            {t('vehicles.add')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 section-transition">
        {vehicles.map(vehicle => (
          <VehicleCard
            key={vehicle.id}
            id={vehicle.id}
            make={vehicle.make}
            model={vehicle.model}
            year={vehicle.year}
            licensePlate={vehicle.license_plate}
            status={vehicle.status || 'available'}
            imageUrl={vehicle.image_url || ''}
            location={vehicle.location || t('common.notProvided')}
            fuelLevel={undefined}
            mileage={vehicle.mileage || 0}
            onSelect={() => handleSelect(vehicle.id)}
          />
        ))}
      </div>
      
      {/* Show pagination on desktop */}
      {!isMobile && totalCount > 0 && (
        <Pagination className="my-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => prevPage()} 
                disabled={!canPrevPage}
                className={!canPrevPage ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            
            {/* Show page numbers */}
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = pagination.page <= 3
                ? i + 1 // Show first 5 pages if current page is <= 3
                : pagination.page >= totalPages - 2
                  ? totalPages - 4 + i // Show last 5 pages if current page is near end
                  : pagination.page - 2 + i; // Show current page and 2 before/after
              
              // Only show page numbers that are within range
              if (pageNum > 0 && pageNum <= totalPages) {
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setPage(pageNum)}
                      isActive={pagination.page === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              return null;
            })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => nextPage()} 
                disabled={!canNextPage}
                className={!canNextPage ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      {/* Show loading indicator for infinite scroll */}
      {isMobile && (
        <div ref={loadMoreRef} className="py-4 text-center">
          {isFetchingMore && (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2">{t('common.loading')}</span>
            </div>
          )}
          {!canNextPage && vehicles.length > 0 && (
            <p className="text-muted-foreground text-sm py-4">{t('common.noMoreItems')}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default VehicleGrid;
