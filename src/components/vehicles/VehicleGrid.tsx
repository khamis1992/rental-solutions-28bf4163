import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Vehicle, VehicleFilterParams } from '@/types/vehicle';
import { useVehiclesPagination } from '@/hooks/use-vehicles-pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { usePagination } from '@/hooks/use-pagination';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useTranslation } from '@/contexts/TranslationContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { CustomPaginationLink } from '@/components/ui/custom-pagination-link';

export function VehicleGrid() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { isRTL } = useTranslation();
  const isMobile = useIsMobile();

  const { 
    pagination, 
    setPage, 
    nextPage, 
    prevPage, 
    canNextPage, 
    canPrevPage, 
    totalPages 
  } = usePagination({ initialPage: 1, initialPageSize: 12 });
  
  const filters: VehicleFilterParams = {
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    search: searchQuery || undefined
  };
  
  const { 
    data,
    isLoading,
    error
  } = useVehiclesPagination({
    filters,
    pagination
  });
  
  const vehicles = data?.data || [];
  const totalCount = data?.count || 0;
  
  const { loadMoreRef, isFetchingMore } = useInfiniteScroll({
    fetchMore: async () => {
      nextPage();
      return null;
    },
    isLoading,
    hasMore: canNextPage,
    enabled: isMobile
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="success">Available</Badge>;
      case 'rented':
        return <Badge variant="default">Rented</Badge>;
      case 'reserved':
      case 'reserve':
        return <Badge variant="warning">Reserved</Badge>;
      case 'maintenance':
        return <Badge variant="outline">Maintenance</Badge>;
      case 'police_station':
        return <Badge variant="destructive">Police Station</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative w-[250px]">
            <Search className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-2.5 h-4 w-4 opacity-50`} />
            <Input
              placeholder="Search vehicles..."
              className={isRTL ? 'pr-8' : 'pl-8'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="rented">Rented</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="police_station">Police Station</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button asChild>
          <Link to="/vehicles/new">Add Vehicle</Link>
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={`skeleton-${i}`} className="overflow-hidden">
              <div className="aspect-video w-full bg-muted">
                <Skeleton className="h-full w-full" />
              </div>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vehicles.map((vehicle) => (
              <Link to={`/vehicles/${vehicle.id}`} key={vehicle.id}>
                <Card className="overflow-hidden h-full hover:border-primary transition-colors">
                  <div className="aspect-video w-full bg-muted relative">
                    {vehicle.image_url ? (
                      <img 
                        src={vehicle.image_url} 
                        alt={`${vehicle.make} ${vehicle.model}`} 
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
                        No Image
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(vehicle.status || 'unknown')}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg">{vehicle.make} {vehicle.model}</h3>
                    <p className="text-muted-foreground">{vehicle.year} • {vehicle.license_plate}</p>
                    {vehicle.vehicleType && (
                      <p className="text-sm font-medium mt-1">{vehicle.vehicleType.name}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          {vehicles.length === 0 && !isLoading && (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <h3 className="text-lg font-medium mb-2">No vehicles found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? "Try adjusting your filters"
                  : "Add your first vehicle using the button above"
                }
              </p>
              
              {(searchQuery || statusFilter !== 'all') && (
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
          
          {!isMobile && vehicles.length > 0 && (
            <div className={`flex items-center ${isRTL ? "justify-start" : "justify-end"} space-x-2 ${isRTL ? "space-x-reverse" : ""}`}>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => prevPage()}
                      className={!canPrevPage ? 'pointer-events-none opacity-50' : ''}
                      aria-disabled={!canPrevPage}
                    />
                  </PaginationItem>
                  
                  {pagination.page > 2 && (
                    <PaginationItem>
                      <CustomPaginationLink onClick={() => setPage(1)}>
                        1
                      </CustomPaginationLink>
                    </PaginationItem>
                  )}
                  
                  {pagination.page > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  {pagination.page > 1 && (
                    <PaginationItem>
                      <CustomPaginationLink onClick={() => setPage(pagination.page - 1)}>
                        {pagination.page - 1}
                      </CustomPaginationLink>
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <CustomPaginationLink isActive onClick={() => setPage(pagination.page)}>
                      {pagination.page}
                    </CustomPaginationLink>
                  </PaginationItem>
                  
                  {pagination.page < totalPages && (
                    <PaginationItem>
                      <CustomPaginationLink onClick={() => setPage(pagination.page + 1)}>
                        {pagination.page + 1}
                      </CustomPaginationLink>
                    </PaginationItem>
                  )}
                  
                  {pagination.page < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  {pagination.page < totalPages - 1 && totalPages > 1 && (
                    <PaginationItem>
                      <CustomPaginationLink onClick={() => setPage(totalPages)}>
                        {totalPages}
                      </CustomPaginationLink>
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => nextPage()}
                      className={!canNextPage ? 'pointer-events-none opacity-50' : ''}
                      aria-disabled={!canNextPage}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
          
          {isMobile && canNextPage && (
            <div ref={loadMoreRef} className="py-4 text-center">
              {isFetchingMore ? (
                <div className="flex justify-center items-center py-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <span className="ml-2">Loading more...</span>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { VehicleGrid };
