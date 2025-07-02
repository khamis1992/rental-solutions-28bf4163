import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ArabicTextValidator, 
  ArabicSearchEngine, 
  ArabicSearchOptions, 
  ArabicSearchResult 
} from '../../utils/arabic-content-management';

/**
 * Arabic Search Props
 */
interface ArabicSearchProps<T> {
  data: T[];
  searchFields: (keyof T)[];
  onResults: (results: any[]) => void;
  placeholder?: string;
  showFilters?: boolean;
  showAdvancedOptions?: boolean;
  enableFuzzySearch?: boolean;
  enableDiacriticsToggle?: boolean;
  enableHighlighting?: boolean;
  debounceMs?: number;
  maxResults?: number;
  className?: string;
}

/**
 * Search Filter Options
 */
interface SearchFilters extends ArabicSearchOptions {
  // Additional UI-specific filters can be added here
}

/**
 * Advanced Search Query
 */
interface AdvancedSearchQuery {
  query: string;
  fields: string[];
  weight: number;
  operator: 'AND' | 'OR';
}

/**
 * Debounce utility function
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Arabic Search Component
 */
export function ArabicSearch<T>({
  data,
  searchFields,
  onResults,
  placeholder = 'البحث...',
  showFilters = true,
  showAdvancedOptions = false,
  enableFuzzySearch = true,
  enableDiacriticsToggle = true,
  enableHighlighting = true,
  debounceMs = 300,
  maxResults = 100,
  className = '',
}: ArabicSearchProps<T>) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    ignoreDiacritics: true,
    ignoreCase: true,
    fuzzyMatch: false,
    maxDistance: 2,
    highlightMatches: enableHighlighting,
  });
  const [advancedQueries, setAdvancedQueries] = useState<AdvancedSearchQuery[]>([]);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  /**
   * Perform the actual search
   */
  const performSearch = useCallback((searchQuery: string, searchFilters: SearchFilters) => {
    if (!searchQuery.trim()) {
      onResults(data.slice(0, maxResults));
      return;
    }

    let results: ArabicSearchResult<T>[];

    if (isAdvancedMode && advancedQueries.length > 0) {
      // Advanced search
      const queries = advancedQueries.map(aq => ({
        query: aq.query,
        fields: aq.fields as (keyof T)[],
        weight: aq.weight,
        operator: aq.operator,
      }));

      results = ArabicSearchEngine.advancedSearch(data, queries, searchFilters);
    } else {
      // Simple search
      results = ArabicSearchEngine.search(data, searchQuery, searchFields, searchFilters);
    }

    // Limit results
    const limitedResults = results.slice(0, maxResults);
    onResults(limitedResults);

    // Add to search history
    if (searchQuery.trim() && !searchHistory.includes(searchQuery)) {
      setSearchHistory(prev => [searchQuery, ...prev.slice(0, 9)]); // Keep last 10 searches
    }
  }, [data, searchFields, onResults, maxResults, isAdvancedMode, advancedQueries, searchHistory]);

  /**
   * Debounced search function
   */
  const debouncedSearch = useCallback(
    debounce((searchQuery: string, searchFilters: SearchFilters) => {
      performSearch(searchQuery, searchFilters);
    }, debounceMs),
    [performSearch]
  );

  /**
   * Handle search input change
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    debouncedSearch(newQuery, filters);
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (query.trim()) {
      debouncedSearch(query, newFilters);
    }
  };

  /**
   * Add advanced query
   */
  const addAdvancedQuery = () => {
    setAdvancedQueries(prev => [
      ...prev,
      {
        query: '',
        fields: [searchFields[0] as string],
        weight: 1,
        operator: 'OR' as const,
      },
    ]);
  };

  /**
   * Update advanced query
   */
  const updateAdvancedQuery = (index: number, updates: Partial<AdvancedSearchQuery>) => {
    setAdvancedQueries(prev =>
      prev.map((query, i) => (i === index ? { ...query, ...updates } : query))
    );
  };

  /**
   * Remove advanced query
   */
  const removeAdvancedQuery = (index: number) => {
    setAdvancedQueries(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Execute advanced search
   */
  const executeAdvancedSearch = () => {
    const validQueries = advancedQueries.filter(q => q.query.trim());
    if (validQueries.length > 0) {
      const queries = validQueries.map(aq => ({
        query: aq.query,
        fields: aq.fields as (keyof T)[],
        weight: aq.weight,
        operator: aq.operator,
      }));

      const results = ArabicSearchEngine.advancedSearch(data, queries, filters);
      onResults(results.slice(0, maxResults));
    }
  };

  /**
   * Clear search
   */
  const clearSearch = () => {
    setQuery('');
    setAdvancedQueries([]);
    onResults(data.slice(0, maxResults));
  };

  /**
   * Search suggestions based on history and common terms
   */
  const searchSuggestions = useMemo(() => {
    if (!query.trim()) return searchHistory;

    const filtered = searchHistory.filter(term =>
      term.toLowerCase().includes(query.toLowerCase()) ||
      ArabicTextValidator.normalizeArabicText(term).includes(
        ArabicTextValidator.normalizeArabicText(query)
      )
    );

    return filtered.slice(0, 5);
  }, [query, searchHistory]);

  /**
   * Initialize search with all data
   */
  useEffect(() => {
    onResults(data.slice(0, maxResults));
  }, [data, onResults, maxResults]);

  return (
    <div className={`arabic-search ${className}`}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleSearchChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
            dir="rtl"
            style={{ fontFamily: 'Cairo, Amiri, sans-serif' }}
          />
          
          {/* Search Icon */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Clear Button */}
          {query && (
            <button
              onClick={clearSearch}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Suggestions */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(suggestion);
                  setShowSuggestions(false);
                  debouncedSearch(suggestion, filters);
                }}
                className="w-full px-4 py-2 text-right hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                dir="rtl"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Options */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        {/* Mode Toggle */}
        {showAdvancedOptions && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdvancedMode(!isAdvancedMode)}
              className={`px-3 py-1 rounded text-sm ${
                isAdvancedMode
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isAdvancedMode ? 'بحث متقدم' : 'بحث بسيط'}
            </button>
          </div>
        )}

        {/* Search Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {enableDiacriticsToggle && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.ignoreDiacritics}
                  onChange={(e) => handleFilterChange('ignoreDiacritics', e.target.checked)}
                  className="rounded"
                />
                <span>تجاهل التشكيل</span>
              </label>
            )}

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.ignoreCase}
                onChange={(e) => handleFilterChange('ignoreCase', e.target.checked)}
                className="rounded"
              />
              <span>تجاهل حالة الأحرف</span>
            </label>

            {enableFuzzySearch && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.fuzzyMatch}
                  onChange={(e) => handleFilterChange('fuzzyMatch', e.target.checked)}
                  className="rounded"
                />
                <span>بحث تقريبي</span>
              </label>
            )}

            {filters.fuzzyMatch && (
              <div className="flex items-center gap-2">
                <span>المسافة:</span>
                <select
                  value={filters.maxDistance}
                  onChange={(e) => handleFilterChange('maxDistance', parseInt(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>
            )}

            {enableHighlighting && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.highlightMatches}
                  onChange={(e) => handleFilterChange('highlightMatches', e.target.checked)}
                  className="rounded"
                />
                <span>تمييز النتائج</span>
              </label>
            )}
          </div>
        )}
      </div>

      {/* Advanced Search Queries */}
      {isAdvancedMode && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">استعلامات البحث المتقدم</h3>
            <button
              onClick={addAdvancedQuery}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
            >
              إضافة استعلام
            </button>
          </div>

          {advancedQueries.map((advQuery, index) => (
            <div key={index} className="p-3 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={advQuery.query}
                  onChange={(e) => updateAdvancedQuery(index, { query: e.target.value })}
                  placeholder="نص البحث"
                  className="px-3 py-2 border border-gray-300 rounded text-right"
                  dir="rtl"
                />

                <select
                  multiple
                  value={advQuery.fields}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    updateAdvancedQuery(index, { fields: selected });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded"
                >
                  {searchFields.map(field => (
                    <option key={String(field)} value={String(field)}>
                      {String(field)}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <input
                    type="number"
                    value={advQuery.weight}
                    onChange={(e) => updateAdvancedQuery(index, { weight: parseFloat(e.target.value) || 1 })}
                    placeholder="الوزن"
                    min="0.1"
                    max="10"
                    step="0.1"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded"
                  />

                  <select
                    value={advQuery.operator}
                    onChange={(e) => updateAdvancedQuery(index, { operator: e.target.value as 'AND' | 'OR' })}
                    className="px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="OR">أو</option>
                    <option value="AND">و</option>
                  </select>
                </div>

                <button
                  onClick={() => removeAdvancedQuery(index)}
                  className="px-3 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}

          {advancedQueries.length > 0 && (
            <button
              onClick={executeAdvancedSearch}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              تنفيذ البحث المتقدم
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Arabic Search Results Component
 */
interface ArabicSearchResultsProps<T> {
  results: ArabicSearchResult<T>[];
  renderItem: (item: T, matches: ArabicSearchResult<T>['matches']) => React.ReactNode;
  showScore?: boolean;
  showMatches?: boolean;
  className?: string;
}

export function ArabicSearchResults<T>({
  results,
  renderItem,
  showScore = false,
  showMatches = false,
  className = '',
}: ArabicSearchResultsProps<T>) {
  if (results.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p>لا توجد نتائج</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {results.map((result, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          {/* Score */}
          {showScore && (
            <div className="mb-2 text-sm text-gray-500">
              النتيجة: {Math.round(result.score * 100)}%
            </div>
          )}

          {/* Item Content */}
          <div className="mb-3">
            {renderItem(result.item, result.matches)}
          </div>

          {/* Matches */}
          {showMatches && result.matches.length > 0 && (
            <div className="text-sm text-gray-600">
              <div className="font-medium mb-1">التطابقات:</div>
              <div className="space-y-1">
                {result.matches.map((match, matchIndex) => (
                  <div key={matchIndex} className="flex items-start gap-2">
                    <span className="font-medium min-w-0 flex-shrink-0">{match.field}:</span>
                    <span
                      className="flex-1 min-w-0"
                      dangerouslySetInnerHTML={{
                        __html: match.highlighted || match.value
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ArabicSearch; 