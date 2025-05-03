
/**
 * This file is maintained for backward compatibility.
 * Please use the new modular hooks from the traffic-fines directory.
 */
export {
  useTrafficFines,
  type TrafficFine,
  type TrafficFineStatusType,
  type TrafficFinePayload,
  type TrafficFineCreatePayload
} from './traffic-fines';

// Re-export the TrafficFine type directly from the query file for components that import it directly
export type { TrafficFine } from './traffic-fines/use-traffic-fines-query';
