
export { AgreementService, agreementService } from './AgreementService';
export { PaymentService, paymentService } from './PaymentService';
export { CustomerService, customerService } from './CustomerService';
export { VehicleService, vehicleService } from './VehicleService';
export { MaintenanceService, maintenanceService } from './MaintenanceService';
export { UserService, userService } from './UserService';
export { DocumentService, documentService } from './DocumentService';

// Re-export base service types without conflict
export type { ServiceResponse } from './base/BaseService';
