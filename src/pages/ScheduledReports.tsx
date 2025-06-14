
import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit, 
  Mail, 
  FileText, 
  Users,
  Car, 
  CreditCard,
  Gavel
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';

// Mock data for scheduled reports
const SCHEDULED_REPORTS = [
  {
    id: '1',
    name: 'Monthly Fleet Status',
    type: 'fleet',
    frequency: 'monthly',
    recipients: ['admin@example.com', 'manager@example.com'],
    format: 'pdf',
    nextRunDate: '2023-07-01',
    status: 'active'
  },
  {
    id: '2',
    name: 'Weekly Financial Summary',
    type: 'financial',
    frequency: 'weekly',
    recipients: ['finance@example.com'],
    format: 'excel',
    nextRunDate: '2023-06-15',
    status: 'active'
  },
  {
    id: '3',
    name: 'Customer Retention Report',
    type: 'customers',
    frequency: 'quarterly',
    recipients: ['marketing@example.com', 'sales@example.com'],
    format: 'pdf',
    nextRunDate: '2023-08-01',
    status: 'paused'
  },
  {
    id: '4',
    name: 'Maintenance Schedule',
    type: 'maintenance',
    frequency: 'weekly',
    recipients: ['maintenance@example.com'],
    format: 'pdf',
    nextRunDate: '2023-06-18',
    status: 'active'
  },
  {
    id: '5',
    name: 'Legal Compliance Review',
    type: 'legal',
    frequency: 'monthly',
    recipients: ['legal@example.com'],
    format: 'pdf',
    nextRunDate: '2023-07-05',
    status: 'active'
  }
];

const reportTypeIcons = {
  fleet: Car,
  financial: CreditCard,
  customers: Users,
  maintenance: Clock,
  legal: Gavel
};

const formSchema = z.object({
  name: z.string().min(3, { message: 'Report name must be at least 3 characters' }),
  type: z.string(),
  frequency: z.string(),
  recipients: z.string().email({ message: 'Please enter valid email addresses separated by commas' }),
  format: z.string(),
});

const ScheduledReports = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scheduledReports, setScheduledReports] = useState(SCHEDULED_REPORTS);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'fleet',
      frequency: 'monthly',
      recipients: '',
      format: 'pdf',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const newReport = {
      id: Math.random().toString(36).substring(7),
      name: values.name,
      type: values.type,
      frequency: values.frequency,
      recipients: values.recipients.split(',').map(email => email.trim()),
      format: values.format,
      nextRunDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active'
    };
    
    setScheduledReports([...scheduledReports, newReport]);
    toast.success('New scheduled report created successfully');
    setOpen(false);
    form.reset();
  };

  const toggleReportStatus = (id: string) => {
    setScheduledReports(
      scheduledReports.map(report => 
        report.id === id 
          ? { ...report, status: report.status === 'active' ? 'paused' : 'active' } 
          : report
      )
    );
    
    const report = scheduledReports.find(r => r.id === id);
    const newStatus = report?.status === 'active' ? 'paused' : 'active';
    toast.success(`Report ${newStatus === 'active' ? 'activated' : 'paused'} successfully`);
  };
  
  const deleteReport = (id: string) => {
    setScheduledReports(scheduledReports.filter(report => report.id !== id));
    toast.success('Report deleted successfully');
  };

  return (
    <PageContainer
      title="Scheduled Reports"
      description="Set up and manage automated reports generation"
      actions={
        <Button onClick={() => navigate('/reports')} variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          View Reports
        </Button>
      }
    >
      <div className="flex justify-between items-center mb-6">
        <SectionHeader
          title="Scheduled Reports"
          description="Automate report generation and delivery to your inbox"
          icon={Calendar}
        />
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Scheduled Report</DialogTitle>
              <DialogDescription>
                Set up an automated report to be generated and delivered on a recurring schedule.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Monthly Fleet Status" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select report type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fleet">Fleet Report</SelectItem>
                            <SelectItem value="financial">Financial Report</SelectItem>
                            <SelectItem value="customers">Customer Report</SelectItem>
                            <SelectItem value="maintenance">Maintenance Report</SelectItem>
                            <SelectItem value="legal">Legal Report</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="recipients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipients</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="email@example.com, another@example.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Enter email addresses separated by commas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Format</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit">Create Schedule</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Next Run</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scheduledReports.map((report) => {
              const ReportIcon = reportTypeIcons[report.type as keyof typeof reportTypeIcons];
              
              return (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <ReportIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {report.name}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{report.frequency}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{report.recipients.length} recipient{report.recipients.length !== 1 ? 's' : ''}</span>
                    </div>
                  </TableCell>
                  <TableCell>{report.nextRunDate}</TableCell>
                  <TableCell className="uppercase">{report.format}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={report.status === 'active' ? 'default' : 'secondary'}
                      className={report.status === 'active' ? 'bg-green-500' : ''}
                    >
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleReportStatus(report.id)}
                      >
                        {report.status === 'active' ? 'Pause' : 'Activate'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </PageContainer>
  );
};

export default ScheduledReports;
