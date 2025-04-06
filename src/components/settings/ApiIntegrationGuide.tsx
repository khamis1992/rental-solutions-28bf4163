
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CopyIcon, CheckIcon } from 'lucide-react';
import { toast } from 'sonner';

export function ApiIntegrationGuide() {
  const [copied, setCopied] = useState<string | null>(null);
  
  // Dynamic URL based on environment
  const apiBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;
  
  // Sample API requests
  const sampleRequests = {
    getCustomers: {
      method: 'POST',
      url: apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'YOUR_API_KEY_HERE'
      },
      body: JSON.stringify({
        resource: 'customers',
        action: 'get',
        filters: { status: 'active' },
        pagination: { page: 1, pageSize: 10 }
      }, null, 2)
    },
    createCustomer: {
      method: 'POST',
      url: apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'YOUR_API_KEY_HERE'
      },
      body: JSON.stringify({
        resource: 'customers',
        action: 'create',
        data: {
          full_name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '55512345',
          driver_license: 'DL123456',
          nationality: 'Qatar'
        }
      }, null, 2)
    },
    getVehicles: {
      method: 'POST',
      url: apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'YOUR_API_KEY_HERE'
      },
      body: JSON.stringify({
        resource: 'vehicles',
        action: 'get',
        filters: { status: 'available' }
      }, null, 2)
    },
    createAgreement: {
      method: 'POST',
      url: apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'YOUR_API_KEY_HERE'
      },
      body: JSON.stringify({
        resource: 'agreements',
        action: 'create',
        data: {
          customer_id: '00000000-0000-0000-0000-000000000000',
          vehicle_id: '00000000-0000-0000-0000-000000000000',
          start_date: '2023-10-01T00:00:00',
          end_date: '2023-10-31T00:00:00',
          rent_amount: 3000,
          total_amount: 3000,
          deposit_amount: 1000
        }
      }, null, 2)
    }
  };
  
  // Function to handle code copying
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success('Copied to clipboard');
    
    setTimeout(() => {
      setCopied(null);
    }, 2000);
  };
  
  // Format the sample request object for display
  const formatRequest = (request: any) => {
    return `// API Request
fetch('${request.url}', {
  method: '${request.method}',
  headers: ${JSON.stringify(request.headers, null, 2)},
  body: ${request.body}
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>API Integration Guide</CardTitle>
        <CardDescription>
          Connect your systems with our car rental platform using our RESTful API
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Authentication</h3>
            <p className="text-sm text-muted-foreground mt-1">
              All API requests require an API key passed in the header. Contact the system administrator to obtain a key.
            </p>
            
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="text-sm font-mono">
                <span className="text-foreground">x-api-key:</span> YOUR_API_KEY_HERE
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium">Endpoints</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Our API uses a single endpoint with different resources and actions.
            </p>
            
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="text-sm font-mono">
                <span className="text-foreground">POST {apiBaseUrl}</span>
              </p>
            </div>
            
            <div className="mt-4 space-y-2">
              <p className="text-sm">Available resources:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li className="text-sm"><span className="font-medium">customers</span> - Manage customer profiles</li>
                <li className="text-sm"><span className="font-medium">vehicles</span> - Manage vehicle inventory</li>
                <li className="text-sm"><span className="font-medium">agreements</span> - Manage rental agreements</li>
                <li className="text-sm"><span className="font-medium">payments</span> - Manage payment transactions</li>
              </ul>
            </div>
            
            <div className="mt-4 space-y-2">
              <p className="text-sm">Available actions:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li className="text-sm"><span className="font-medium">get</span> - List resources with optional filters and pagination</li>
                <li className="text-sm"><span className="font-medium">getById</span> - Get a specific resource by ID</li>
                <li className="text-sm"><span className="font-medium">create</span> - Create a new resource</li>
                <li className="text-sm"><span className="font-medium">update</span> - Update an existing resource</li>
                <li className="text-sm"><span className="font-medium">delete</span> - Delete a resource</li>
              </ul>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium">Sample Requests</h3>
            <Tabs defaultValue="getCustomers" className="mt-4">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
                <TabsTrigger value="getCustomers">Get Customers</TabsTrigger>
                <TabsTrigger value="createCustomer">Create Customer</TabsTrigger>
                <TabsTrigger value="getVehicles">Get Vehicles</TabsTrigger>
                <TabsTrigger value="createAgreement">Create Agreement</TabsTrigger>
              </TabsList>
              
              {Object.entries(sampleRequests).map(([key, request]) => (
                <TabsContent key={key} value={key} className="relative">
                  <div className="rounded-md bg-muted p-4">
                    <pre className="text-xs sm:text-sm overflow-auto max-h-80">
                      <code>{formatRequest(request)}</code>
                    </pre>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(formatRequest(request), key)}
                    >
                      {copied === key ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col items-start">
        <p className="text-sm text-muted-foreground">
          For detailed documentation, send a GET request to <code className="text-xs bg-muted p-1 rounded">{apiBaseUrl}/docs</code>
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          All API responses follow a standard format with <code className="text-xs bg-muted p-1 rounded">success</code>, <code className="text-xs bg-muted p-1 rounded">data</code>, and <code className="text-xs bg-muted p-1 rounded">error</code> fields.
        </p>
      </CardFooter>
    </Card>
  );
}
