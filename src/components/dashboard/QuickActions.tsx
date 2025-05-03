
import React, { useState, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { UserPlus, FileText, CreditCard, Wrench, Plus, ChevronRight } from 'lucide-react';
import { RecordPaymentDialog } from '@/components/payments/RecordPaymentDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const QuickActions = memo(() => {
  const navigate = useNavigate();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const quickActions = [
    {
      title: "Add Customer",
      description: "Register a new customer",
      icon: UserPlus,
      color: "bg-green-500",
      textColor: "text-green-500",
      onClick: () => navigate('/customers/add')
    },
    {
      title: "Create Agreement",
      description: "Start a new rental agreement",
      icon: FileText,
      color: "bg-violet-500",
      textColor: "text-violet-500",
      onClick: () => navigate('/agreements/add')
    },
    {
      title: "Record Payment",
      description: "Add a new payment record",
      icon: CreditCard,
      color: "bg-blue-500",
      textColor: "text-blue-500",
      onClick: () => setShowPaymentDialog(true)
    },
    {
      title: "Schedule Maintenance",
      description: "Plan vehicle maintenance",
      icon: Wrench,
      color: "bg-amber-500",
      textColor: "text-amber-500",
      onClick: () => navigate('/maintenance/new')
    }
  ];

  return (
    <>
      <Card className="mb-6 border border-border/60 shadow-sm animate-fade-in">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
              <CardDescription>Common tasks and operations</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center text-xs"
              onClick={() => navigate('/actions')}
            >
              <span>View all</span>
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <TooltipProvider key={action.title}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-auto py-4 justify-start flex flex-col items-center text-center",
                        "hover:bg-accent/5 transition-all duration-200 border-border/50",
                        "sm:hover:scale-105 hover:shadow-sm"
                      )}
                      onClick={action.onClick}
                    >
                      <div className={`rounded-full p-2 ${action.color} bg-opacity-10 mb-2`}>
                        <action.icon className={`h-5 w-5 ${action.textColor}`} />
                      </div>
                      <span className="text-sm font-medium">{action.title}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{action.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </CardContent>
      </Card>

      <RecordPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
      />
    </>
  );
});
