
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Plus, FileText, Search, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';

// Mock data for demonstration
const MOCK_DOCUMENTS = [
  { 
    id: '1', 
    title: 'Vehicle Lease Agreement Template', 
    type: 'template', 
    category: 'contracts',
    lastUpdated: new Date(2023, 9, 15),
    status: 'active' 
  },
  { 
    id: '2', 
    title: 'Insurance Policy Requirements', 
    type: 'policy', 
    category: 'insurance',
    lastUpdated: new Date(2023, 11, 3),
    status: 'active' 
  },
  { 
    id: '3', 
    title: 'Driver Conduct Guidelines', 
    type: 'guideline', 
    category: 'operations',
    lastUpdated: new Date(2023, 8, 22),
    status: 'active' 
  },
  { 
    id: '4', 
    title: 'Vehicle Damage Report Form', 
    type: 'form', 
    category: 'reporting',
    lastUpdated: new Date(2023, 10, 7),
    status: 'archived' 
  },
  { 
    id: '5', 
    title: 'Corporate Lease Amendment', 
    type: 'template', 
    category: 'contracts',
    lastUpdated: new Date(2024, 0, 18),
    status: 'draft' 
  },
];

const LegalDocuments = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredDocuments = MOCK_DOCUMENTS.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Legal Documents</CardTitle>
              <CardDescription>
                Manage legal templates, policies, and forms
              </CardDescription>
            </div>
            <Button className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length > 0 ? (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                          {doc.title}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell capitalize">{doc.category}</TableCell>
                      <TableCell className="hidden md:table-cell capitalize">{doc.type}</TableCell>
                      <TableCell className="hidden md:table-cell">{format(doc.lastUpdated, 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            doc.status === 'active' ? 'default' : 
                            doc.status === 'draft' ? 'outline' : 'secondary'
                          }
                        >
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" /> Download
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No documents found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LegalDocuments;
