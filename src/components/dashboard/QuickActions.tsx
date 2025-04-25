
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  FileText, 
  CreditCard, 
  UserPlus, 
  Wrench, 
  AlertTriangle, 
  Search,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  
  const actions = [
    { 
      title: 'New Rental Agreement', 
      description: 'Create a new rental contract',
      icon: FileText, 
      color: 'bg-indigo-50 text-indigo-600',
      path: '/agreements/new' 
    },
    { 
      title: 'Add Vehicle', 
      description: 'Register a new vehicle',
      icon: Car, 
      color: 'bg-blue-50 text-blue-600',
      path: '/vehicles/add' 
    },
    { 
      title: 'Record Payment', 
      description: 'Process a new payment',
      icon: CreditCard, 
      color: 'bg-green-50 text-green-600',
      path: '/payments/add' 
    },
    { 
      title: 'Add Customer', 
      description: 'Register a new customer',
      icon: UserPlus, 
      color: 'bg-violet-50 text-violet-600',
      path: '/customers/new' 
    },
    { 
      title: 'Schedule Maintenance', 
      description: 'Plan vehicle service',
      icon: Wrench, 
      color: 'bg-amber-50 text-amber-600',
      path: '/maintenance/add' 
    },
    { 
      title: 'Check Traffic Fines', 
      description: 'Validate and manage fines',
      icon: AlertTriangle, 
      color: 'bg-red-50 text-red-600',
      path: '/fines/validate' 
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate('/search')} className="text-sm">
          <Search className="h-4 w-4 mr-1" />
          Advanced Search
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action) => (
          <Button
            key={action.title}
            variant="outline"
            className="flex flex-col items-start h-auto p-4 justify-between border bg-white hover:bg-slate-50 transition-all shadow-sm hover:shadow"
            onClick={() => navigate(action.path)}
          >
            <div className={`${action.color} p-2 rounded-full mb-3`}>
              <action.icon className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-medium text-sm">{action.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{action.description}</div>
            </div>
            <div className="flex items-center justify-end w-full mt-3">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};
