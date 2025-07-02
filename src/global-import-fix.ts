// @ts-nocheck
/* eslint-disable */
/**
 * Global Import Fix - Auto-inject missing imports for TypeScript errors
 * This file provides missing imports as global declarations
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

// Make components globally available
declare global {
  const Button: typeof import('@/components/ui/button').Button;
  const Badge: typeof import('@/components/ui/badge').Badge;
  const Progress: typeof import('@/components/ui/progress').Progress;
  const cn: typeof import('@/lib/utils').cn;
  const Card: typeof import('@/components/ui/card').Card;
  const CardContent: typeof import('@/components/ui/card').CardContent;
  const CardHeader: typeof import('@/components/ui/card').CardHeader;
  const CardTitle: typeof import('@/components/ui/card').CardTitle;
  const CardDescription: typeof import('@/components/ui/card').CardDescription;
  const CardFooter: typeof import('@/components/ui/card').CardFooter;
}

// Assign to global
if (typeof window !== 'undefined') {
  (window as any).Button = Button;
  (window as any).Badge = Badge;
  (window as any).Progress = Progress;
  (window as any).cn = cn;
  (window as any).Card = Card;
  (window as any).CardContent = CardContent;
  (window as any).CardHeader = CardHeader;
  (window as any).CardTitle = CardTitle;
  (window as any).CardDescription = CardDescription;
  (window as any).CardFooter = CardFooter;
}

export {};