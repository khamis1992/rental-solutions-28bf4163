
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Wrench, FileText, AlertTriangle } from 'lucide-react';

export function MobileDashboard() {
  const navigate = useNavigate();

  const quickActions = [
    { 
      name: 'Start Vehicle Inspection', 
      icon: Car, 
      route: '/inspection',
      primary: true,
      description: 'Perform digital vehicle inspection with photos'
    },
    { 
      name: 'Report Issue', 
      icon: AlertTriangle, 
      route: '/maintenance/new',
      description: 'Report vehicle problems or maintenance needs'
    },
    { 
      name: 'View Assignments', 
      icon: FileText, 
      route: '/agreements',
      description: 'Check vehicle assignments and agreements'
    },
    { 
      name: 'Maintenance Tasks', 
      icon: Wrench, 
      route: '/maintenance',
      description: 'View and update maintenance schedule'
    }
  ];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-6">Field Operations</h1>
      
      <div className="grid grid-cols-2 gap-4">
        {quickActions.map((action) => (
          <Card 
            key={action.name}
            className="p-4 flex flex-col items-center justify-center cursor-pointer"
            onClick={() => navigate(action.route)}
          >
            <action.icon className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium text-center">{action.name}</span>
          </Card>
        ))}
      </div>
      
      <Button className="w-full mt-4" variant="outline">
        Scan Vehicle QR Code
      </Button>
    </div>
  );
}
