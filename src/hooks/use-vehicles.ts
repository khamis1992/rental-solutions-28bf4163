
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Vehicle } from '@/types/vehicle';

// Mock data - would be replaced with actual API calls
const sampleVehicles: Vehicle[] = [
  {
    id: '1',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    licensePlate: 'ABC-123',
    status: 'available',
    imageUrl: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?q=80&w=2156&auto=format&fit=crop',
    location: 'Main Office',
    fuelLevel: 85,
    mileage: 12450,
    vin: 'JTDKARFU0L3092652',
    lastServiced: '2023-10-15',
    nextServiceDue: '2024-04-15',
    dailyRate: 65,
    color: 'Silver',
    transmission: 'automatic',
    fuelType: 'gasoline',
    category: 'midsize',
    features: ['Bluetooth', 'Backup Camera', 'Cruise Control']
  },
  {
    id: '2',
    make: 'Honda',
    model: 'Accord',
    year: 2021,
    licensePlate: 'DEF-456',
    status: 'rented',
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop',
    location: 'Downtown Branch',
    fuelLevel: 65,
    mileage: 28750,
    vin: '1HGCV1F18MA002352',
    lastServiced: '2023-09-05',
    nextServiceDue: '2024-03-05',
    dailyRate: 70,
    color: 'Blue',
    transmission: 'automatic',
    fuelType: 'gasoline',
    category: 'midsize',
    features: ['Apple CarPlay', 'Android Auto', 'Lane Assist']
  },
  {
    id: '3',
    make: 'Ford',
    model: 'Escape',
    year: 2023,
    licensePlate: 'GHI-789',
    status: 'available',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=2071&auto=format&fit=crop',
    location: 'Airport Location',
    fuelLevel: 92,
    mileage: 5230,
    vin: '1FMCU9G60NUA18745',
    lastServiced: '2023-11-20',
    nextServiceDue: '2024-05-20',
    dailyRate: 75,
    color: 'White',
    transmission: 'automatic',
    fuelType: 'hybrid',
    category: 'suv',
    features: ['Panoramic Roof', 'Heated Seats', 'Navigation']
  },
  {
    id: '4',
    make: 'Chevrolet',
    model: 'Malibu',
    year: 2022,
    licensePlate: 'JKL-012',
    status: 'maintenance',
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop',
    location: 'Service Center',
    fuelLevel: 45,
    mileage: 18650,
    vin: '1G1ZD5ST2LF035765',
    lastServiced: '2023-08-10',
    nextServiceDue: '2024-02-10',
    dailyRate: 60,
    color: 'Red',
    transmission: 'automatic',
    fuelType: 'gasoline',
    category: 'midsize',
    features: ['Bluetooth', 'Keyless Entry', 'Power Seats']
  },
  {
    id: '5',
    make: 'Nissan',
    model: 'Rogue',
    year: 2021,
    licensePlate: 'MNO-345',
    status: 'available',
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=2070&auto=format&fit=crop',
    location: 'North Branch',
    fuelLevel: 78,
    mileage: 31420,
    vin: 'JN8AT2MV3LW108975',
    lastServiced: '2023-07-15',
    nextServiceDue: '2024-01-15',
    dailyRate: 72,
    color: 'Black',
    transmission: 'automatic',
    fuelType: 'gasoline',
    category: 'suv',
    features: ['Third Row Seating', 'Roof Rack', 'AWD']
  },
  {
    id: '6',
    make: 'BMW',
    model: 'X3',
    year: 2023,
    licensePlate: 'PQR-678',
    status: 'rented',
    imageUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?q=80&w=1856&auto=format&fit=crop',
    location: 'City Center',
    fuelLevel: 55,
    mileage: 8790,
    vin: 'WBADW3C50DJ422365',
    lastServiced: '2023-12-01',
    nextServiceDue: '2024-06-01',
    dailyRate: 120,
    color: 'Gray',
    transmission: 'automatic',
    fuelType: 'gasoline',
    category: 'luxury',
    features: ['Premium Sound', 'Leather Seats', 'Advanced Safety Package']
  },
];

// In a real application, these would be API calls
const fetchVehicles = async () => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return sampleVehicles;
};

const fetchVehicleById = async (id: string) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  const vehicle = sampleVehicles.find(v => v.id === id);
  
  if (!vehicle) {
    throw new Error(`Vehicle with ID ${id} not found`);
  }
  
  return vehicle;
};

export const useVehicles = () => {
  const queryClient = useQueryClient();
  
  return {
    // Get all vehicles
    useList: (filters?: Partial<Vehicle>) => {
      return useQuery({
        queryKey: ['vehicles', filters],
        queryFn: async () => {
          const vehicles = await fetchVehicles();
          
          // Apply filters if provided
          if (filters) {
            return vehicles.filter(vehicle => {
              return Object.entries(filters).every(([key, value]) => {
                // @ts-ignore - Dynamic property access
                return vehicle[key] === value;
              });
            });
          }
          
          return vehicles;
        },
      });
    },
    
    // Get a single vehicle by ID
    useVehicle: (id: string) => {
      return useQuery({
        queryKey: ['vehicles', id],
        queryFn: () => fetchVehicleById(id),
        enabled: !!id, // Only run the query if id is provided
      });
    },
    
    // Create a new vehicle
    useCreate: () => {
      return useMutation({
        mutationFn: async (newVehicle: Omit<Vehicle, 'id'>) => {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // In a real app, this would be handled by the API
          const vehicle: Vehicle = {
            ...newVehicle,
            id: Math.random().toString(36).substring(2, 9), // Generate random ID
          };
          
          return vehicle;
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          toast.success('Vehicle added successfully');
        },
        onError: (error) => {
          toast.error('Failed to add vehicle', {
            description: error instanceof Error ? error.message : 'Unknown error occurred',
          });
        },
      });
    },
    
    // Update a vehicle
    useUpdate: () => {
      return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Vehicle> }) => {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // In a real app, this would be handled by the API
          const vehicleIndex = sampleVehicles.findIndex(v => v.id === id);
          if (vehicleIndex === -1) {
            throw new Error(`Vehicle with ID ${id} not found`);
          }
          
          // Update the vehicle
          const updatedVehicle = { ...sampleVehicles[vehicleIndex], ...data };
          return updatedVehicle;
        },
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          queryClient.invalidateQueries({ queryKey: ['vehicles', variables.id] });
          toast.success('Vehicle updated successfully');
        },
        onError: (error) => {
          toast.error('Failed to update vehicle', {
            description: error instanceof Error ? error.message : 'Unknown error occurred',
          });
        },
      });
    },
    
    // Delete a vehicle
    useDelete: () => {
      return useMutation({
        mutationFn: async (id: string) => {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // In a real app, this would be handled by the API
          const vehicleIndex = sampleVehicles.findIndex(v => v.id === id);
          if (vehicleIndex === -1) {
            throw new Error(`Vehicle with ID ${id} not found`);
          }
          
          return id;
        },
        onSuccess: (id) => {
          queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          toast.success('Vehicle deleted successfully');
        },
        onError: (error) => {
          toast.error('Failed to delete vehicle', {
            description: error instanceof Error ? error.message : 'Unknown error occurred',
          });
        },
      });
    },
  };
};
