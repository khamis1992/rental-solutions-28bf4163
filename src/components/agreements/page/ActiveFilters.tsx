
import { X } from 'lucide-react';

interface ActiveFiltersProps {
  activeFilters: [string, string][];
  setSearchParams: (params: Record<string, any>) => void;
}

export function ActiveFilters({ activeFilters, setSearchParams }: ActiveFiltersProps) {
  if (!activeFilters.length) return null;

  const handleRemoveFilter = (key: string) => {
    setSearchParams({ [key]: undefined });
  };

  const handleClearAllFilters = () => {
    const clearedParams: Record<string, undefined> = {};
    activeFilters.forEach(([key]) => {
      clearedParams[key] = undefined;
    });
    setSearchParams(clearedParams);
  };

  const getLabelForFilter = (key: string, value: string): string => {
    switch (key) {
      case 'agreement_number':
        return `رقم العقد: ${value}`;
      case 'status':
        return `الحالة: ${value.charAt(0).toUpperCase() + value.slice(1)}`;
      case 'start_date_after':
        return `بداية العقد بعد: ${new Date(value).toLocaleDateString('ar-QA')}`;
      case 'start_date_before':
        return `بداية العقد قبل: ${new Date(value).toLocaleDateString('ar-QA')}`;
      case 'end_date_after':
        return `نهاية العقد بعد: ${new Date(value).toLocaleDateString('ar-QA')}`;
      case 'end_date_before':
        return `نهاية العقد قبل: ${new Date(value).toLocaleDateString('ar-QA')}`;
      case 'created_date_after':
        return `أُنشِئ بعد: ${new Date(value).toLocaleDateString('ar-QA')}`;
      case 'created_date_before':
        return `أُنشِئ قبل: ${new Date(value).toLocaleDateString('ar-QA')}`;
      case 'rent_min':
        return `الحد الأدنى: ${value} ر.ق`;
      case 'rent_max':
        return `الحد الأعلى: ${value} ر.ق`;
      case 'license_plate':
        return `اللوحة: ${value}`;
      case 'searchTerm':
        return `البحث: ${value || ''}`;
      default:
        return `${key}: ${value}`;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 mt-1" dir="rtl">
      <span className="text-sm text-muted-foreground text-right">المرشحات النشطة:</span>
      {activeFilters.map(([key, value]) => (
        <Badge key={key} variant="outline" className="flex items-center gap-1 py-1 flex-row-reverse">
          <span className="text-right">{getLabelForFilter(key, value)}</span>
          <button
            onClick={() => handleRemoveFilter(key)}
            className="mr-1 rounded-full hover:bg-muted p-0.5"
            aria-label={`إزالة مرشح ${key}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {activeFilters.length > 1 && (
        <button
          onClick={handleClearAllFilters}
          className="text-xs text-muted-foreground hover:text-destructive underline"
        >
          مسح الكل
        </button>
      )}
    </div>
  );
}
