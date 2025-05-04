
/**
 * This file is maintained for backward compatibility.
 * Please use the new modular hooks from the traffic-fines directory.
 */
export { useTrafficFines } from './traffic-fines';

// Export all types from the types file
export type {
  TrafficFine,
  TrafficFineStatusType,
  TrafficFinePayload,
  TrafficFineCreatePayload
} from './traffic-fines/types';
