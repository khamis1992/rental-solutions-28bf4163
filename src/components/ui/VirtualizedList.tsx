import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Loader2, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSmartCache } from '@/hooks/use-advanced-state-sync';

// ===============================
// Virtual List Types
// ===============================

interface VirtualListProps<T = any> {
  items: T[];
  itemHeight?: number;
  renderItem: (props: {
    index: number;
    item: T;
    style: React.CSSProperties;
    isSelected: boolean;
    onSelect: (item: T) => void;
  }) => React.ReactNode;
  onSelectionChange?: (selectedItems: T[]) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: string[];
  multiSelect?: boolean;
  className?: string;
  loadingMessage?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  onItemClick?: (item: T, index: number) => void;
  showStats?: boolean;
  cacheKey?: string;
  containerHeight?: number;
}

// ===============================
// Virtualized List Component (Simplified)
// ===============================

export const VirtualizedList = <T extends any>({
  items = [],
  itemHeight = 80,
  renderItem,
  onSelectionChange,
  searchable = true,
  searchPlaceholder = 'البحث...',
  searchFields = [],
  multiSelect = false,
  className = '',
  loadingMessage = 'جاري التحميل...',
  emptyMessage = 'لا توجد عناصر',
  isLoading = false,
  onItemClick,
  showStats = true,
  cacheKey = 'virtualized-list',
  containerHeight = 400
}: VirtualListProps<T>) => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());
  const [scrollTop, setScrollTop] = useState(0);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Smart caching
  const cache = useSmartCache(`filtered`, {
    maxAge: 2 * 60 * 1000, // 2 minutes
    maxSize: 50
  });

  // Filter and search items
  const filteredItems = useMemo(() => {
    const cacheKey = searchTerm;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached as T[];
    }

    let result = [...items];

    // Apply search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(item => {
        if (searchFields.length > 0) {
          return searchFields.some(field => {
            const value = (item as any)[field];
            return value && value.toString().toLowerCase().includes(searchLower);
          });
        } else {
          // Search all string properties
          return Object.values(item).some(value => 
            value && value.toString().toLowerCase().includes(searchLower)
          );
        }
      });
    }

    // Cache the result
    cache.set(cacheKey, result);
    
    return result;
  }, [items, searchTerm, searchFields, cache]);

  // Virtual scrolling calculations
  const visibleItemsCount = Math.ceil(containerHeight / itemHeight) + 2;
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItemsCount, filteredItems.length);
  const visibleItems = filteredItems.slice(startIndex, endIndex);

  // Handle item selection
  const handleItemSelect = useCallback((item: T, index: number) => {
    const itemId = (item as any).id || index;
    
    if (multiSelect) {
      const newSelected = new Set(selectedItems);
      if (newSelected.has(itemId)) {
        newSelected.delete(itemId);
      } else {
        newSelected.add(itemId);
      }
      setSelectedItems(newSelected);
      
      if (onSelectionChange) {
        const selectedItemsList = filteredItems.filter((_, idx) => 
          newSelected.has(((filteredItems[idx] as any).id || idx))
        );
        onSelectionChange(selectedItemsList);
      }
    } else {
      const newSelected = new Set([itemId]);
      setSelectedItems(newSelected);
      
      if (onSelectionChange) {
        onSelectionChange([item]);
      }
    }

    if (onItemClick) {
      onItemClick(item, index);
    }
  }, [selectedItems, multiSelect, onSelectionChange, onItemClick, filteredItems]);

  // Handle scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  }, [onSelectionChange]);

  // Statistics
  const stats = useMemo(() => ({
    total: items.length,
    filtered: filteredItems.length,
    selected: selectedItems.size,
    filteredPercentage: items.length > 0 ? Math.round((filteredItems.length / items.length) * 100) : 0
  }), [items.length, filteredItems.length, selectedItems.size]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-500">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <p className="text-gray-500 text-lg">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col rtl ${className}`}>
      {/* Header with search */}
      <div className="flex-shrink-0 p-4 border-b bg-gray-50">
        <div className="flex flex-col gap-4">
          {/* Search */}
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-10"
              />
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedItems.size > 0 && (
              <Button variant="outline" size="sm" onClick={clearSelection}>
                مسح الاختيار ({selectedItems.size})
              </Button>
            )}

            {searchTerm && (
              <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
                مسح البحث
              </Button>
            )}
          </div>

          {/* Statistics */}
          {showStats && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>المجموع: {stats.total}</span>
              <span>المعروض: {stats.filtered}</span>
              {stats.selected > 0 && <span>المحدد: {stats.selected}</span>}
              <span>نسبة الفلترة: {stats.filteredPercentage}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Virtual list container */}
      <div className="flex-1 min-h-0">
        {filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">لا توجد نتائج تطابق البحث</p>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="overflow-auto"
            style={{ height: containerHeight }}
            onScroll={handleScroll}
          >
            {/* Virtual spacer before visible items */}
            <div style={{ height: startIndex * itemHeight }} />
            
            {/* Visible items */}
            {visibleItems.map((item, index) => {
              const actualIndex = startIndex + index;
              const itemId = (item as any).id || actualIndex;
              const isSelected = selectedItems.has(itemId);

              return (
                <div
                  key={itemId}
                  style={{
                    height: itemHeight,
                    position: 'relative'
                  }}
                >
                  {renderItem({
                    index: actualIndex,
                    item,
                    style: { height: itemHeight },
                    isSelected,
                    onSelect: () => handleItemSelect(item, actualIndex)
                  })}
                </div>
              );
            })}
            
            {/* Virtual spacer after visible items */}
            <div style={{ height: (filteredItems.length - endIndex) * itemHeight }} />
          </div>
        )}
      </div>
    </div>
  );
};

export type { VirtualListProps };
