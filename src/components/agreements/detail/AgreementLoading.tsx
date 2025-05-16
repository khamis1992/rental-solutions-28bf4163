
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function AgreementLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-2/3" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full md:col-span-2" />
      </div>
    </div>
  );
}
