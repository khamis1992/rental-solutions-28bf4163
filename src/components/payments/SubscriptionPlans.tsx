
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscriptionPlans } from '@/hooks/use-subscription-plans';

export function SubscriptionPlans() {
  const { plans, selectedPlan, selectPlan, isLoading } = useSubscriptionPlans();

  if (isLoading) return <div>Loading plans...</div>;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((plan) => (
        <Card key={plan.id} className={`${selectedPlan?.id === plan.id ? 'border-primary' : ''}`}>
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${plan.price}/month</p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index}>✓ {feature}</li>
              ))}
            </ul>
            <Button 
              className="mt-4 w-full"
              onClick={() => selectPlan(plan.id)}
              variant={selectedPlan?.id === plan.id ? "default" : "outline"}
            >
              {selectedPlan?.id === plan.id ? 'Selected' : 'Select Plan'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
