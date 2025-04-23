
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

const ComplianceCalendar = () => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Compliance Calendar</CardTitle>
          <CardDescription>
            Track upcoming compliance deadlines and regulatory requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            className="border rounded-md p-4"
            modifiers={{
              compliance: complianceDates
            }}
            modifiersStyles={{
              compliance: {
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontWeight: 'bold'
              }
            }}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {date ? (
              <>
                <CalendarIcon className="inline-block mr-2 h-5 w-5" />
                <span>Compliance Items for {formatDate(date)}</span>
              </>
            ) : (
              'Select a Date'
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedItems.length > 0 ? (
            <div className="space-y-4">
              {selectedItems.map(item => (
                <div key={item.id} className="border rounded-md p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      {getTypeIcon(item.type)}
                      <h3 className="ml-2 font-medium">{item.title}</h3>
                    </div>
                    {getPriorityBadge(item.priority)}
                  </div>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="mr-1 h-4 w-4" />
                      Due: {formatDate(item.dueDate)}
                    </div>
                    <Button size="sm">Take Action</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {date 
                ? "No compliance items due on this date." 
                : "Select a date to view compliance items."}
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t">
            <h3 className="font-medium mb-2">Upcoming Compliance Deadlines</h3>
            <div className="space-y-2">
              {MOCK_COMPLIANCE_ITEMS
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 3)
                .map(item => (
                  <div key={item.id} className="flex justify-between items-center rounded-md p-2 bg-gray-50">
                    <div className="flex items-center">
                      {getTypeIcon(item.type)}
                      <span className="ml-2 text-sm">{item.title}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(item.dueDate)}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceCalendar;
