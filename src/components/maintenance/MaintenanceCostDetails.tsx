
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

interface MaintenanceCostDetailsProps {
  cost: number;
  serviceProvider: string;
  invoiceNumber: string;
  odometerReading: number;
  onCostChange: (cost: number) => void;
  onServiceProviderChange: (provider: string) => void;
  onInvoiceNumberChange: (invoice: string) => void;
  onOdometerReadingChange: (reading: number) => void;
}

const MaintenanceCostDetails: React.FC<MaintenanceCostDetailsProps> = ({
  cost,
  serviceProvider,
  invoiceNumber,
  odometerReading,
  onCostChange,
  onServiceProviderChange,
  onInvoiceNumberChange,
  onOdometerReadingChange
}) => {
  const [providers, setProviders] = React.useState([
    'In-House Service',
    'AutoCare Express', 
    'Premium Auto Service',
    'City Motors Workshop',
    'FastTrack Maintenance'
  ]);
  
  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCostChange(parseFloat(e.target.value) || 0);
  };
  
  const handleOdometerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onOdometerReadingChange(parseInt(e.target.value) || 0);
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="cost">Cost ($)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              id="cost" 
              type="number"
              className="pl-8"
              placeholder="0.00" 
              value={cost === 0 ? '' : cost}
              onChange={handleCostChange}
            />
          </div>
          
          <p className="text-xs text-muted-foreground">
            Enter the total cost of the maintenance service
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="odometer">Odometer Reading (km)</Label>
          <Input 
            id="odometer" 
            type="number"
            placeholder="0" 
            value={odometerReading === 0 ? '' : odometerReading}
            onChange={handleOdometerChange}
          />
          <p className="text-xs text-muted-foreground">
            Current vehicle mileage at time of service
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="service-provider">Service Provider</Label>
          <Input 
            id="service-provider"
            placeholder="Auto Shop Name"
            value={serviceProvider}
            onChange={e => onServiceProviderChange(e.target.value)}
            list="service-providers"
          />
          <datalist id="service-providers">
            {providers.map(provider => (
              <option key={provider} value={provider} />
            ))}
          </datalist>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="invoice-number">Invoice Number</Label>
          <Input 
            id="invoice-number" 
            placeholder="INV-12345" 
            value={invoiceNumber}
            onChange={e => onInvoiceNumberChange(e.target.value)}
          />
        </div>
      </div>
      
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-sm">
            <strong>Cost Recommendations:</strong>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Oil Change: $50 - $100</li>
              <li>Tire Replacement: $400 - $800 (set of 4)</li>
              <li>Brake Service: $150 - $400</li>
              <li>Regular Inspection: $80 - $150</li>
              <li>Air Conditioning Service: $100 - $250</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceCostDetails;
