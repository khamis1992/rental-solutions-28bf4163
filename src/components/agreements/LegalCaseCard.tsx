import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle, Scale, FileText, Plus } from 'lucide-react';
import { useLegalCases } from '@/hooks/legal/useLegalCases';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface LegalCaseCardProps {
  agreementId: string;
}

const LegalCaseCard: React.FC<LegalCaseCardProps> = ({ agreementId }) => {
  const { cases, isLoading, error, createCase, updateCase } = useLegalCases(agreementId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    case_number: '',
    court_date: '',
    court_location: '',
    assigned_attorney: '',
    notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createCase({
        ...formData,
        lease_id: agreementId
      });
      
      setIsDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        case_number: '',
        court_date: '',
        court_location: '',
        assigned_attorney: '',
        notes: ''
      });
      
      toast.success('Legal case created successfully');
    } catch (error) {
      console.error('Error creating legal case:', error);
      toast.error('Failed to create legal case');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="mr-1 h-3 w-3" /> Resolved</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500 text-white"><Scale className="mr-1 h-3 w-3" /> In Progress</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-amber-500 text-white"><AlertTriangle className="mr-1 h-3 w-3" /> Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Legal Cases</CardTitle>
          <CardDescription>Legal cases associated with this agreement</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Legal Cases</CardTitle>
          <CardDescription>Legal cases associated with this agreement</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="py-4 text-center text-red-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading legal cases: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Legal Cases</CardTitle>
            <CardDescription>Legal cases associated with this agreement</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add Case
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {cases && cases.length > 0 ? (
          <div className="space-y-4">
            {cases.map((legalCase) => (
              <div key={legalCase.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{legalCase.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{legalCase.description}</p>
                  </div>
                  {getStatusBadge(legalCase.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  {legalCase.case_number && (
                    <div>
                      <p className="text-muted-foreground">Case Number</p>
                      <p>{legalCase.case_number}</p>
                    </div>
                  )}
                  
                  {legalCase.court_date && (
                    <div>
                      <p className="text-muted-foreground">Court Date</p>
                      <p>{format(new Date(legalCase.court_date), 'PPP')}</p>
                    </div>
                  )}
                  
                  {legalCase.court_location && (
                    <div>
                      <p className="text-muted-foreground">Court Location</p>
                      <p>{legalCase.court_location}</p>
                    </div>
                  )}
                  
                  {legalCase.assigned_attorney && (
                    <div>
                      <p className="text-muted-foreground">Assigned Attorney</p>
                      <p>{legalCase.assigned_attorney}</p>
                    </div>
                  )}
                </div>
                
                {legalCase.notes && (
                  <div className="mt-4 text-sm">
                    <p className="text-muted-foreground">Notes</p>
                    <p className="whitespace-pre-line">{legalCase.notes}</p>
                  </div>
                )}
                
                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm">
                    <FileText className="mr-1 h-4 w-4" /> View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            No legal cases found for this agreement.
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add New Legal Case</DialogTitle>
            <DialogDescription>
              Create a new legal case associated with this agreement.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="case_number" className="text-right">
                  Case Number
                </Label>
                <Input
                  id="case_number"
                  name="case_number"
                  value={formData.case_number}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="court_date" className="text-right">
                  Court Date
                </Label>
                <Input
                  id="court_date"
                  name="court_date"
                  type="date"
                  value={formData.court_date}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="court_location" className="text-right">
                  Court Location
                </Label>
                <Input
                  id="court_location"
                  name="court_location"
                  value={formData.court_location}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="assigned_attorney" className="text-right">
                  Attorney
                </Label>
                <Input
                  id="assigned_attorney"
                  name="assigned_attorney"
                  value={formData.assigned_attorney}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Case</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default LegalCaseCard;
