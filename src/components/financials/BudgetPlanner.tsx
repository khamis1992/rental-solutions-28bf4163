
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

interface BudgetItem {
  category: string;
  amount: number;
  allocated: number;
  remaining: number;
}

export default function BudgetPlanner() {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  const addBudgetItem = () => {
    if (category && amount) {
      setBudgetItems([...budgetItems, {
        category,
        amount: parseFloat(amount),
        allocated: 0,
        remaining: parseFloat(amount)
      }]);
      setCategory('');
      setAmount('');
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Budget Planning</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Input 
            placeholder="Category" 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input 
            type="number" 
            placeholder="Amount" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button onClick={addBudgetItem}>Add</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetItems}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                >
                  {budgetItems.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-2">
            {budgetItems.map((item, index) => (
              <div key={index} className="flex justify-between p-2 bg-gray-100 rounded">
                <span>{item.category}</span>
                <span>${item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
