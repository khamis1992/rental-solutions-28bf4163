import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import { supabase } from '@/lib/supabase';
import type { VehicleData } from '@/types/vehicle.types';

const ComplianceCalendar: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, year, license_plate, insurance_expiry, inspection_expiry');
      if (!error && data) setVehicles(data as VehicleData[]);
      setLoading(false);
    };
    fetchVehicles();
  }, []);

  // Build compliance items from vehicle data
  const complianceItems = vehicles.flatMap(vehicle => {
    const items = [];
    if (vehicle.insurance_expiry) {
      items.push({
        id: `${vehicle.id}-insurance`,
        title: `Insurance Expiry: ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
        dueDate: new Date(vehicle.insurance_expiry),
        type: 'insurance',
        status: new Date(vehicle.insurance_expiry) < new Date() ? 'expired' : 'pending',
        priority: new Date(vehicle.insurance_expiry) < new Date() ? 'high' : 'medium',
        description: `Insurance expires for ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
      });
    } else {
      items.push({
        id: `${vehicle.id}-insurance-missing`,
        title: `Missing Insurance: ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
        dueDate: null,
        type: 'insurance',
        status: 'missing',
        priority: 'high',
        description: `No insurance expiry set for ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
      });
    }
    if (vehicle.inspection_expiry) {
      items.push({
        id: `${vehicle.id}-inspection`,
        title: `Inspection Expiry: ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
        dueDate: new Date(vehicle.inspection_expiry),
        type: 'inspection',
        status: new Date(vehicle.inspection_expiry) < new Date() ? 'expired' : 'pending',
        priority: new Date(vehicle.inspection_expiry) < new Date() ? 'high' : 'medium',
        description: `Inspection expires for ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
      });
    } else {
      items.push({
        id: `${vehicle.id}-inspection-missing`,
        title: `Missing Inspection: ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
        dueDate: null,
        type: 'inspection',
        status: 'missing',
        priority: 'high',
        description: `No inspection expiry set for ${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
      });
    }
    return items;
  });

  // Dates for calendar highlights
  const complianceDates = complianceItems
    .filter(item => item.dueDate)
    .map(item => item.dueDate);

  // Handle date selection in calendar
  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      const items = complianceItems.filter(item => {
        if (!item.dueDate) return false;
        const itemDate = new Date(item.dueDate);
        return (
          itemDate.getDate() === selectedDate.getDate() &&
          itemDate.getMonth() === selectedDate.getMonth() &&
          itemDate.getFullYear() === selectedDate.getFullYear()
        );
      });
      setSelectedItems(items);
    } else {
      setSelectedItems([]);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500 hover:bg-red-600">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Medium</Badge>;
      case 'low':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Low</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'insurance':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'inspection':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Compliance Tracking</h2>
      <p className="text-gray-600 mb-4">Track insurance and inspection deadlines for your vehicles.</p>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
          />
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Compliance Items</h3>
            {selectedItems.length === 0 ? (
              <div className="text-gray-500">Select a date to view compliance items due.</div>
            ) : (
              <ul className="space-y-3">
                {selectedItems.map(item => (
                  <li key={item.id} className="flex items-center gap-3 p-3 border rounded">
                    {getTypeIcon(item.type)}
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                    {item.dueDate && (
                      <span className="text-xs text-gray-400">Due: {formatDate(item.dueDate)}</span>
                    )}
                    {getPriorityBadge(item.priority)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ComplianceCalendar;
