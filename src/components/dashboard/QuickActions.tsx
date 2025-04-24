
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { UserPlus, FileText, CreditCard, Wrench } from 'lucide-react';

export const QuickActions = () => {
  const navigate = useNavigate();
  
  const quickActions = [
    { 
      title: "Add Customer", 
      icon: UserPlus, 
      color: "bg-green-500", 
      onClick: () => navigate('/customers/add') 
    },
    { 
      title: "Create Agreement", 
      icon: FileText, 
      color: "bg-violet-500", 
      onClick: () => navigate('/agreements/add') 
    },
    { 
      title: "Record Payment", 
      icon: CreditCard, 
      color: "bg-green-500", 
      onClick: () => navigate('/financials/payments/new') 
    },
    { 
      title: "Schedule Maintenance", 
      icon: Wrench, 
      color: "bg-amber-500", 
      onClick: () => navigate('/maintenance/new') 
    }
  ];

  return (
    <Card className="mb-6 border border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
        <CardDescription>Common tasks and operations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto py-4 justify-start flex flex-col items-center text-center hover:bg-accent/5"
              onClick={action.onClick}
            >
              <div className={`rounded-full p-2 ${action.color} bg-opacity-10 mb-2`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{action.title}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
