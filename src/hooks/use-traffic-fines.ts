
/**
 * This file is maintained for backward compatibility.
 * Please use the new modular hooks from the traffic-fines directory.
 */
export {
  useTrafficFines,
  type TrafficFineStatusType,
  type TrafficFinePayload,
  type TrafficFineCreatePayload
} from './traffic-fines';

// Export the TrafficFine type directly from the query file
// This ensures components that import it directly will get the correct type
export type { TrafficFine } from './traffic-fines/use-traffic-fines-query';
