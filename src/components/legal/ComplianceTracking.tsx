
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  AlertCircle,
  FileCheck 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock data for demonstration
const COMPLIANCE_SUMMARY = {
  compliant: 78,
  overdue: 5,
  upcoming: 12,
  notStarted: 5
};

const COMPLIANCE_TASKS = [
  {
    id: '1',
    name: 'Vehicle Insurance Verification',
    description: 'Verify all vehicles have valid insurance coverage',
    dueDate: new Date(2024, 5, 15),
    status: 'overdue',
    completion: 85,
    priority: 'high'
  },
  {
    id: '2',
    name: 'Driver License Validation',
    description: 'Check driver licenses for expiration and validity',
    dueDate: new Date(2024, 5, 22),
    status: 'in-progress',
    completion: 65,
    priority: 'medium'
  },
  {
    id: '3',
    name: 'Quarterly Fleet Emissions Check',
    description: 'Ensure fleet complies with local emissions standards',
    dueDate: new Date(2024, 6, 1),
    status: 'upcoming',
    completion: 0,
    priority: 'medium'
  },
  {
    id: '4',
    name: 'Annual Safety Certification',
    description: 'Complete legally required safety inspections',
    dueDate: new Date(2024, 8, 15),
    status: 'upcoming',
    completion: 0,
    priority: 'high'
  },
  {
    id: '5',
    name: 'Corporate Tax Documentation',
    description: 'Prepare fleet-related tax documents',
    dueDate: new Date(2024, 3, 15),
    status: 'completed',
    completion: 100,
    priority: 'high'
  }
];

const ComplianceTracking = () => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'upcoming':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Compliant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
              <span className="text-2xl font-bold">{COMPLIANCE_SUMMARY.compliant}%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              <span className="text-2xl font-bold">{COMPLIANCE_SUMMARY.overdue}%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-amber-500" />
              <span className="text-2xl font-bold">{COMPLIANCE_SUMMARY.upcoming}%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Not Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-gray-500" />
              <span className="text-2xl font-bold">{COMPLIANCE_SUMMARY.notStarted}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Compliance Tasks</CardTitle>
              <CardDescription>
                Track and manage compliance requirements
              </CardDescription>
            </div>
            <Button className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead className="hidden md:table-cell">Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Priority</TableHead>
                  <TableHead className="hidden md:table-cell">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {COMPLIANCE_TASKS.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center">
                          <FileCheck className="mr-2 h-4 w-4 text-muted-foreground" />
                          {task.name}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {task.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDate(task.dueDate)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getStatusIcon(task.status)}
                        <Badge 
                          className="ml-2"
                          variant={
                            task.status === 'completed' ? 'outline' : 
                            task.status === 'in-progress' ? 'default' : 
                            task.status === 'overdue' ? 'destructive' : 'secondary'
                          }
                        >
                          {task.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge 
                        variant={
                          task.priority === 'high' ? 'destructive' : 
                          task.priority === 'medium' ? 'secondary' : 'outline'
                        }
                      >
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="w-full">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{task.completion}%</span>
                        </div>
                        <Progress value={task.completion} className="h-2" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceTracking;
