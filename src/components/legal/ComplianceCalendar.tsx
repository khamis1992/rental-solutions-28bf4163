import React, { useState } from 'react';
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
import { AlertTriangle, Calendar as CalendarIcon, Clock, FileText } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

// Mock compliance data
const MOCK_COMPLIANCE_ITEMS = [
  {
    id: '1',
    title: 'Vehicle Insurance Renewal',
    dueDate: new Date(2024, 2, 15),
    type: 'insurance',
    status: 'pending',
    priority: 'high',
    description: 'Renew insurance policies for fleet vehicles.'
  },
  {
    id: '2',
    title: 'Annual Tax Filing',
    dueDate: new Date(2024, 3, 30),
    type: 'tax',
    status: 'pending',
    priority: 'high',
    description: 'Submit annual tax returns for the company.'
  },
  {
    id: '3',
    title: 'Driver License Verifications',
    dueDate: new Date(2024, 2, 25),
    type: 'license',
    status: 'pending',
    priority: 'medium',
    description: 'Verify all driver licenses are valid and up to date.'
  },
  {
    id: '4',
    title: 'Vehicle Inspection Certificates',
    dueDate: new Date(2024, 4, 10),
    type: 'inspection',
    status: 'pending',
    priority: 'medium',
    description: 'Renew vehicle inspection certificates.'
  }
];

const ComplianceCalendar: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  
  // Generate compliance event dates for the calendar highlighting
  const complianceDates = MOCK_COMPLIANCE_ITEMS.map(item => {
    const date = new Date(item.dueDate);
    return date;
  });

  // Handle date selection in calendar
  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    
    if (selectedDate) {
      // Find items due on the selected date
      const items = MOCK_COMPLIANCE_ITEMS.filter(item => {
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
      case 'tax':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'license':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'inspection':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Compliance Tracking</h2>
      <p className="text-gray-600">Track compliance deadlines and requirements here.</p>
    </div>
  );
};

export default ComplianceCalendar;
