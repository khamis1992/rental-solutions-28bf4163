
import { formatCurrency } from '@/lib/utils';

export interface VehicleUtilizationData {
  id: string;
  name: string;
  totalRentDays: number;
  maintenanceCosts: number;
  revenue: number;
  profit: number;
  utilization: string | number;
  agreementCount: number;
  maintenanceCount: number;
  vehicleType: string;
  status: string;
}

export interface MonthlyTrendData {
  month: string;
  monthKey: string;
  revenue: number;
  maintenanceCosts: number;
  profit: number;
  agreementCount: number;
  maintenanceCount: number;
}

export interface VehicleTypeData {
  vehicleType: string;
  count: number;
  totalRevenue: number;
  totalMaintenance: number;
  totalProfit: number;
  averageUtilization: number;
}

export const processVehicleUtilizationData = (
  vehicles: any[],
  agreements: any[],
  maintenanceData: any[]
): VehicleUtilizationData[] => {
  const vehiclesList = Array.isArray(vehicles) ? vehicles : [];
  const agreementsList = Array.isArray(agreements) ? agreements : [];
  
  return vehiclesList.map(vehicle => {
    const vehicleAgreements = agreementsList.filter(a => a.vehicle_id === vehicle.id);
    const totalRentDays = vehicleAgreements.reduce((sum, agreement) => {
      const startDate = new Date(agreement.start_date);
      const endDate = agreement.end_date ? new Date(agreement.end_date) : new Date();
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    
    const maintenanceCosts = maintenanceData
      .filter(record => record.vehicle_id === vehicle.id)
      .reduce((sum, record) => sum + (record.cost || 0), 0);
    
    const revenue = vehicleAgreements.reduce((sum, agreement) => 
      sum + (agreement.total_amount || 0), 0);
    
    return {
      id: vehicle.id,
      name: `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
      totalRentDays,
      maintenanceCosts,
      revenue,
      profit: revenue - maintenanceCosts,
      utilization: totalRentDays > 0 ? (totalRentDays / 365 * 100).toFixed(2) : 0,
      agreementCount: vehicleAgreements.length,
      maintenanceCount: maintenanceData.filter(record => record.vehicle_id === vehicle.id).length,
      vehicleType: vehicle.vehicle_type || 'Unknown',
      status: vehicle.status
    };
  });
};

export const processMonthlyTrendData = (
  agreements: any[],
  maintenanceData: any[]
): MonthlyTrendData[] => {
  const agreementsList = Array.isArray(agreements) ? agreements : [];
  
  const last12Months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
      monthKey: `${date.getFullYear()}-${date.getMonth() + 1}`,
      revenue: 0,
      maintenanceCosts: 0,
      profit: 0,
      agreementCount: 0,
      maintenanceCount: 0
    };
  }).reverse();
  
  agreementsList.forEach(agreement => {
    const startDate = new Date(agreement.start_date);
    const monthKey = `${startDate.getFullYear()}-${startDate.getMonth() + 1}`;
    const monthData = last12Months.find(m => m.monthKey === monthKey);
    if (monthData) {
      monthData.revenue += agreement.total_amount || 0;
      monthData.agreementCount += 1;
      monthData.profit = monthData.revenue - monthData.maintenanceCosts;
    }
  });
  
  maintenanceData.forEach(record => {
    if (!record.completed_date) return;
    
    const completionDate = new Date(record.completed_date);
    const monthKey = `${completionDate.getFullYear()}-${completionDate.getMonth() + 1}`;
    const monthData = last12Months.find(m => m.monthKey === monthKey);
    if (monthData) {
      monthData.maintenanceCosts += record.cost || 0;
      monthData.maintenanceCount += 1;
      monthData.profit = monthData.revenue - monthData.maintenanceCosts;
    }
  });
  
  return last12Months;
};

export const processVehicleTypeData = (
  vehicleUtilizationData: VehicleUtilizationData[]
): VehicleTypeData[] => {
  return Object.entries(
    vehicleUtilizationData.reduce((acc, vehicle) => {
      const type = vehicle.vehicleType;
      if (!acc[type]) {
        acc[type] = {
          vehicleType: type,
          count: 0,
          totalRevenue: 0,
          totalMaintenance: 0,
          totalProfit: 0,
          averageUtilization: 0
        };
      }
      
      acc[type].count += 1;
      acc[type].totalRevenue += vehicle.revenue;
      acc[type].totalMaintenance += vehicle.maintenanceCosts;
      acc[type].totalProfit += vehicle.profit;
      acc[type].averageUtilization += parseFloat(vehicle.utilization as string);
      
      return acc;
    }, {} as Record<string, any>)
  ).map(([_, data]) => ({
    ...data,
    averageUtilization: (data as any).averageUtilization / (data as any).count
  }));
};
