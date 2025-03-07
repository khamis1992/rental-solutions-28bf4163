
import { z } from 'zod';

// Common validation patterns
export const validationPatterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^\+?[0-9]{10,15}$/,
  licensePlate: /^[A-Z0-9-]{2,10}$/,
  vinNumber: /^[A-HJ-NPR-Z0-9]{17}$/,
};

// Common validation schemas
export const commonSchemas = {
  id: z.string().min(1),
  email: z.string().email(),
  phone: z.string().regex(validationPatterns.phone, 'Invalid phone number format'),
  date: z.string().or(z.date()),
  price: z.number().positive(),
  percentage: z.number().min(0).max(100),
};

// Vehicle related schemas
export const vehicleSchemas = {
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  licensePlate: z.string().regex(validationPatterns.licensePlate, 'Invalid license plate format'),
  status: z.enum(['available', 'rented', 'maintenance']),
  fuelLevel: z.number().min(0).max(100),
  mileage: z.number().nonnegative(),
  vin: z.string().regex(validationPatterns.vinNumber, 'Invalid VIN number').optional(),
};

// Customer related schemas
export const customerSchemas = {
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: commonSchemas.email,
  phone: commonSchemas.phone,
  drivingLicense: z.string().min(5),
  address: z.string().optional(),
};

// Rental agreement schemas
export const rentalSchemas = {
  startDate: commonSchemas.date,
  endDate: commonSchemas.date,
  vehicleId: commonSchemas.id,
  customerId: commonSchemas.id,
  status: z.enum(['draft', 'active', 'completed', 'cancelled']),
  dailyRate: commonSchemas.price,
  deposit: z.number().nonnegative(),
  notes: z.string().optional(),
};

// Helper function to validate data against a schema
export function validateData<T>(schema: z.ZodType<T>, data: unknown): { 
  success: true; 
  data: T; 
} | { 
  success: false; 
  errors: z.ZodError<T>; 
} {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

// Format validation error messages for display
export function formatValidationErrors(errors: z.ZodError): Record<string, string> {
  const formattedErrors: Record<string, string> = {};
  
  errors.errors.forEach((error) => {
    const path = error.path.join('.');
    formattedErrors[path] = error.message;
  });
  
  return formattedErrors;
}

// Create a full schema for a specific entity
export function createVehicleSchema() {
  return z.object({
    id: commonSchemas.id,
    make: vehicleSchemas.make,
    model: vehicleSchemas.model,
    year: vehicleSchemas.year,
    licensePlate: vehicleSchemas.licensePlate,
    status: vehicleSchemas.status,
    fuelLevel: vehicleSchemas.fuelLevel,
    mileage: vehicleSchemas.mileage,
    imageUrl: z.string().url().optional(),
    location: z.string().optional(),
  });
}

export function createCustomerSchema() {
  return z.object({
    id: commonSchemas.id,
    firstName: customerSchemas.firstName,
    lastName: customerSchemas.lastName,
    email: customerSchemas.email,
    phone: customerSchemas.phone,
    drivingLicense: customerSchemas.drivingLicense,
    address: customerSchemas.address,
    joinDate: commonSchemas.date,
  });
}

export function createRentalSchema() {
  return z.object({
    id: commonSchemas.id,
    vehicleId: rentalSchemas.vehicleId,
    customerId: rentalSchemas.customerId,
    startDate: rentalSchemas.startDate,
    endDate: rentalSchemas.endDate,
    status: rentalSchemas.status,
    dailyRate: rentalSchemas.dailyRate,
    deposit: rentalSchemas.deposit,
    notes: rentalSchemas.notes,
  });
}
