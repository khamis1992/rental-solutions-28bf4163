
// This file is kept for backward compatibility
// This file is now a wrapper around the adapter for backward compatibility
import { useTrafficFinesAdapter } from './adapters/use-traffic-fine-adapter';
import { TrafficFine } from '@/types/traffic-fine.types';

// Re-export the adapter as the legacy hook
export const useTrafficFines = useTrafficFinesAdapter;
export type { TrafficFine };
