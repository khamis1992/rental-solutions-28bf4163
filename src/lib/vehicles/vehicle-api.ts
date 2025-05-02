
import { 
  fetchVehicles 
} from './api/fetch-vehicles';

import { 
  fetchVehicleById, 
  fetchVehicleWithTypes 
} from './api/fetch-vehicle-by-id';

import { 
  fetchVehicleTypes 
} from './api/vehicle-types';

import { 
  insertVehicle,
  updateVehicle,
  deleteVehicle
} from './api/vehicle-mutations';

// Re-export everything for backwards compatibility
export {
  fetchVehicles,
  fetchVehicleById,
  fetchVehicleTypes,
  insertVehicle,
  updateVehicle,
  deleteVehicle,
  fetchVehicleWithTypes
};
