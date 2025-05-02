import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CustomerDetailProps {
  customer: any | null;
  onUpdate: (data: any) => Promise<{ success: boolean; message?: string }>;
}

const CustomerDetail = ({ customer, onUpdate }: CustomerDetailProps) => {
  const [formData, setFormData] = useState({
    full_name: customer?.full_name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    driver_license: customer?.driver_license || '',
    nationality: customer?.nationality || '',
    notes: customer?.notes || '',
    status: customer?.status || 'active',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleUpdate = async (formData: any) => {
    if (!customer) return;

    try {
      // Update customer function
      const result = await onUpdate(formData);
      
      if (result.success) {
        toast.success('Customer updated successfully!');
      } else {
        toast.error(`Failed to update customer: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error(`Error updating customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleUpdate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="driver_license">Driver License</Label>
              <Input
                type="text"
                id="driver_license"
                name="driver_license"
                value={formData.driver_license}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                type="text"
                id="nationality"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <Button type="submit">Update Customer</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CustomerDetail;
