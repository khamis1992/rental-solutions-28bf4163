
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Code, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ApiDocumentation: React.FC = () => {
  const baseUrl = 'https://vqdlsidkucrownbfuouq.supabase.co/functions/v1/api';
  const [copied, setCopied] = useState<string | null>(null);
  
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Code copied to clipboard');
    
    setTimeout(() => {
      setCopied(null);
    }, 2000);
  };
  
  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative">
      <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto">
        <code>{code}</code>
      </pre>
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-white"
        onClick={() => copyToClipboard(code, id)}
      >
        {copied === id ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>
            Learn how to integrate with our API for third-party applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold mt-0">Authentication</h3>
            <p>
              All API requests must include your API key in the Authorization header:
            </p>
            
            <CodeBlock 
              id="auth-example" 
              code={`Authorization: Bearer YOUR_API_KEY`} 
            />
            
            <div className="flex items-center p-4 rounded-md bg-blue-50 text-blue-800 my-4">
              <Info className="w-5 h-5 mr-2 flex-shrink-0" />
              <p className="text-sm">
                To generate an API key, go to the "API Keys" tab and create a new key with the appropriate permissions.
              </p>
            </div>
            
            <h3 className="text-lg font-semibold">Base URL</h3>
            <p>All API requests should be made to:</p>
            <div className="bg-muted p-2 rounded font-mono text-sm">
              {baseUrl}
            </div>
            
            <h3 className="text-lg font-semibold mt-6">Rate Limiting</h3>
            <p>
              API requests are limited to 100 requests per minute by default. Rate limits can be adjusted for specific API keys.
            </p>
          </div>
          
          <Tabs defaultValue="traffic-fines" className="mt-6">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="traffic-fines">Traffic Fines</TabsTrigger>
              <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="agreements">Agreements</TabsTrigger>
            </TabsList>
            
            <TabsContent value="traffic-fines" className="space-y-4 mt-4">
              <div>
                <h3 className="text-lg font-semibold">Traffic Fines API</h3>
                <p className="text-muted-foreground">
                  Endpoints for managing traffic violation records
                </p>
                
                <div className="mt-6 space-y-8">
                  {/* GET Traffic Fines */}
                  <div>
                    <h4 className="text-md font-semibold flex items-center">
                      <Code className="mr-2 h-4 w-4" />
                      Get All Traffic Fines
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Retrieves a list of all traffic fines, with optional filtering
                    </p>
                    
                    <div className="bg-muted p-2 rounded flex items-center mb-2">
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded mr-2 text-xs font-medium">GET</span>
                      <code className="text-sm">{`${baseUrl}/traffic-fines`}</code>
                    </div>
                    
                    <h5 className="text-sm font-medium mt-4">Query Parameters</h5>
                    <ul className="list-disc list-inside text-sm space-y-1 mb-4">
                      <li><code>license_plate</code> - Filter by license plate</li>
                      <li><code>status</code> - Filter by payment status</li>
                      <li><code>limit</code> - Maximum number of records to return (default: 100)</li>
                    </ul>
                    
                    <h5 className="text-sm font-medium">Example Request</h5>
                    <CodeBlock 
                      id="get-fines" 
                      code={`curl -X GET "${baseUrl}/traffic-fines?license_plate=ABC123&status=pending" \\
  -H "Authorization: Bearer YOUR_API_KEY"`} 
                    />
                    
                    <h5 className="text-sm font-medium mt-4">Example Response</h5>
                    <CodeBlock 
                      id="get-fines-response" 
                      code={`{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "violation_number": "VN-2025-0042",
      "license_plate": "ABC123",
      "violation_date": "2025-04-01T14:32:00.000Z",
      "fine_amount": 500,
      "violation_charge": "Speeding",
      "payment_status": "pending",
      "fine_location": "Al Corniche St",
      "vehicle_id": "7f9c24e0-5f9a-4d5d-b5d8-3a37a9766ea7",
      "lease_id": "c29142e5-9d9e-4f4c-b4d6-5d8d93c5e34a",
      "payment_date": null
    }
  ]
}`} 
                    />
                  </div>
                  
                  {/* GET Traffic Fine by ID */}
                  <div>
                    <h4 className="text-md font-semibold flex items-center">
                      <Code className="mr-2 h-4 w-4" />
                      Get Traffic Fine by ID
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Retrieves details for a specific traffic fine
                    </p>
                    
                    <div className="bg-muted p-2 rounded flex items-center mb-2">
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded mr-2 text-xs font-medium">GET</span>
                      <code className="text-sm">{`${baseUrl}/traffic-fines/{fine_id}`}</code>
                    </div>
                    
                    <h5 className="text-sm font-medium mt-4">Example Request</h5>
                    <CodeBlock 
                      id="get-fine-by-id" 
                      code={`curl -X GET "${baseUrl}/traffic-fines/550e8400-e29b-41d4-a716-446655440000" \\
  -H "Authorization: Bearer YOUR_API_KEY"`} 
                    />
                  </div>
                  
                  {/* CREATE Traffic Fine */}
                  <div>
                    <h4 className="text-md font-semibold flex items-center">
                      <Code className="mr-2 h-4 w-4" />
                      Create Traffic Fine
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Creates a new traffic fine record
                    </p>
                    
                    <div className="bg-muted p-2 rounded flex items-center mb-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded mr-2 text-xs font-medium">POST</span>
                      <code className="text-sm">{`${baseUrl}/traffic-fines`}</code>
                    </div>
                    
                    <h5 className="text-sm font-medium mt-4">Request Body</h5>
                    <CodeBlock 
                      id="create-fine-body" 
                      code={`{
  "violation_number": "VN-2025-0043",
  "license_plate": "DEF456",
  "violation_date": "2025-04-05T10:15:00.000Z",
  "fine_amount": 350,
  "violation_charge": "Illegal Parking",
  "payment_status": "pending",
  "fine_location": "West Bay"
}`} 
                    />
                    
                    <h5 className="text-sm font-medium mt-4">Example Request</h5>
                    <CodeBlock 
                      id="create-fine" 
                      code={`curl -X POST "${baseUrl}/traffic-fines" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "violation_number": "VN-2025-0043",
    "license_plate": "DEF456",
    "violation_date": "2025-04-05T10:15:00.000Z",
    "fine_amount": 350,
    "violation_charge": "Illegal Parking",
    "payment_status": "pending",
    "fine_location": "West Bay"
  }'`} 
                    />
                  </div>
                  
                  {/* UPDATE Traffic Fine */}
                  <div>
                    <h4 className="text-md font-semibold flex items-center">
                      <Code className="mr-2 h-4 w-4" />
                      Update Traffic Fine
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Updates an existing traffic fine record
                    </p>
                    
                    <div className="bg-muted p-2 rounded flex items-center mb-2">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded mr-2 text-xs font-medium">PUT</span>
                      <code className="text-sm">{`${baseUrl}/traffic-fines/{fine_id}`}</code>
                    </div>
                    
                    <h5 className="text-sm font-medium mt-4">Example Request</h5>
                    <CodeBlock 
                      id="update-fine" 
                      code={`curl -X PUT "${baseUrl}/traffic-fines/550e8400-e29b-41d4-a716-446655440000" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "payment_status": "paid",
    "payment_date": "2025-04-07T09:30:00.000Z"
  }'`} 
                    />
                  </div>
                  
                  {/* DELETE Traffic Fine */}
                  <div>
                    <h4 className="text-md font-semibold flex items-center">
                      <Code className="mr-2 h-4 w-4" />
                      Delete Traffic Fine
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Deletes a traffic fine record
                    </p>
                    
                    <div className="bg-muted p-2 rounded flex items-center mb-2">
                      <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded mr-2 text-xs font-medium">DELETE</span>
                      <code className="text-sm">{`${baseUrl}/traffic-fines/{fine_id}`}</code>
                    </div>
                    
                    <h5 className="text-sm font-medium mt-4">Example Request</h5>
                    <CodeBlock 
                      id="delete-fine" 
                      code={`curl -X DELETE "${baseUrl}/traffic-fines/550e8400-e29b-41d4-a716-446655440000" \\
  -H "Authorization: Bearer YOUR_API_KEY"`} 
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="vehicles" className="mt-4">
              <div className="flex items-center p-4 rounded-md bg-amber-50 text-amber-800">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <p>
                  The Vehicles API is currently under development. Check back soon for full documentation.
                </p>
              </div>
              
              <div className="mt-4">
                <h4 className="text-md font-semibold">Available Endpoints</h4>
                <ul className="list-disc list-inside text-sm space-y-2 mt-2">
                  <li><code>GET /api/vehicles</code> - Retrieve all vehicles</li>
                  <li><code>GET /api/vehicles/:id</code> - Get vehicle by ID</li>
                  <li><code>POST /api/vehicles</code> - Create a new vehicle</li>
                  <li><code>PUT /api/vehicles/:id</code> - Update vehicle details</li>
                  <li><code>DELETE /api/vehicles/:id</code> - Remove a vehicle</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="customers" className="mt-4">
              <div className="flex items-center p-4 rounded-md bg-amber-50 text-amber-800">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <p>
                  The Customers API is currently under development. Check back soon for full documentation.
                </p>
              </div>
              
              <div className="mt-4">
                <h4 className="text-md font-semibold">Available Endpoints</h4>
                <ul className="list-disc list-inside text-sm space-y-2 mt-2">
                  <li><code>GET /api/customers</code> - Retrieve all customers</li>
                  <li><code>GET /api/customers/:id</code> - Get customer by ID</li>
                  <li><code>POST /api/customers</code> - Create a new customer</li>
                  <li><code>PUT /api/customers/:id</code> - Update customer details</li>
                  <li><code>DELETE /api/customers/:id</code> - Remove a customer</li>
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="agreements" className="mt-4">
              <div className="flex items-center p-4 rounded-md bg-amber-50 text-amber-800">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <p>
                  The Agreements API is currently under development. Check back soon for full documentation.
                </p>
              </div>
              
              <div className="mt-4">
                <h4 className="text-md font-semibold">Available Endpoints</h4>
                <ul className="list-disc list-inside text-sm space-y-2 mt-2">
                  <li><code>GET /api/agreements</code> - Retrieve all agreements</li>
                  <li><code>GET /api/agreements/:id</code> - Get agreement by ID</li>
                  <li><code>POST /api/agreements</code> - Create a new agreement</li>
                  <li><code>PUT /api/agreements/:id</code> - Update agreement details</li>
                  <li><code>DELETE /api/agreements/:id</code> - Remove an agreement</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiDocumentation;
