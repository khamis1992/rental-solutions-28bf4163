
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileCode, Globe, Terminal, HelpCircle, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ApiDocumentation: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>
            Reference documentation for integrating with our API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-md border">
              <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-primary" /> Base URL
              </h3>
              <code className="block bg-slate-100 p-2 rounded">
                https://vqdlsidkucrownbfuouq.supabase.co/functions/v1/api
              </code>
              <p className="text-sm mt-2 text-muted-foreground">
                All API requests must be made to this base URL with the appropriate endpoint appended.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-md border">
              <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                <Terminal className="h-5 w-5 text-primary" /> Authentication
              </h3>
              <p className="mb-2">
                To authenticate API requests, include your API key in the Authorization header:
              </p>
              <code className="block bg-slate-100 p-2 rounded">
                Authorization: Bearer YOUR_API_KEY
              </code>
              <p className="text-sm mt-2 text-muted-foreground">
                Generate an API key from the API Keys tab to start making authenticated requests.
                <br />
                <span className="font-medium">Important:</span> Do not include quotes around your API key.
              </p>
            </div>
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Authentication Formats</AlertTitle>
              <AlertDescription>
                <p className="mb-2">Our API accepts these authentication header formats:</p>
                <ul className="list-disc ml-6 space-y-1 text-sm">
                  <li><code>Authorization: Bearer YOUR_API_KEY</code> (recommended)</li>
                  <li><code>Authorization: YOUR_API_KEY</code> (also supported)</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertTitle>PowerShell Usage</AlertTitle>
              <AlertDescription>
                <p className="mb-2">When using PowerShell, make sure to format the request correctly:</p>
                <code className="block bg-slate-100 p-2 rounded text-xs mt-2">
                  {`Invoke-WebRequest -Uri "https://vqdlsidkucrownbfuouq.supabase.co/functions/v1/api/traffic-fines" \\`}<br />
                  {`-Headers @{"Authorization" = "Bearer YOUR_API_KEY"}`}
                </code>
                <p className="mt-2 text-sm">Note: Remove backticks and line breaks for a single-line command.</p>
              </AlertDescription>
            </Alert>
            
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertTitle>cURL Example</AlertTitle>
              <AlertDescription>
                <p className="mb-2">Basic cURL example for retrieving traffic fines:</p>
                <code className="block bg-slate-100 p-2 rounded text-xs mt-2">
                  {`curl -X GET "https://vqdlsidkucrownbfuouq.supabase.co/functions/v1/api/traffic-fines" \\`}<br />
                  {`-H "Authorization: Bearer YOUR_API_KEY"`}
                </code>
              </AlertDescription>
            </Alert>

            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertTitle>Fetch API Example (JavaScript)</AlertTitle>
              <AlertDescription>
                <p className="mb-2">Using the Fetch API in JavaScript:</p>
                <code className="block bg-slate-100 p-2 rounded text-xs mt-2">
                  {`fetch("https://vqdlsidkucrownbfuouq.supabase.co/functions/v1/api/traffic-fines", {`}<br />
                  {`  method: "GET",`}<br />
                  {`  headers: {`}<br />
                  {`    "Authorization": "Bearer YOUR_API_KEY"`}<br />
                  {`  }`}<br />
                  {`})`}<br />
                  {`.then(response => response.json())`}<br />
                  {`.then(data => console.log(data))`}
                </code>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="vehicles">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
          <TabsTrigger value="traffic-fines">Traffic Fines</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle>Vehicles API</CardTitle>
              <CardDescription>Endpoints for vehicle management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium">GET /vehicles</h4>
                  <p className="text-muted-foreground">List all vehicles</p>
                  
                  <div className="mt-2">
                    <h5 className="font-medium">Query Parameters</h5>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li><code>status</code> - Filter by vehicle status</li>
                      <li><code>make</code> - Filter by vehicle make</li>
                      <li><code>model</code> - Filter by vehicle model</li>
                      <li><code>location</code> - Filter by location</li>
                      <li><code>limit</code> - Limit number of results (default: 100)</li>
                    </ul>
                  </div>
                  
                  <div className="mt-2">
                    <h5 className="font-medium">Response Example</h5>
                    <pre className="bg-slate-100 p-3 rounded-md text-xs overflow-auto mt-1">
{`{
  "data": [
    {
      "id": "12345-uuid",
      "make": "Toyota",
      "model": "Camry",
      "year": 2023,
      "license_plate": "ABC123",
      "status": "available",
      "color": "blue",
      "mileage": 15000,
      "created_at": "2023-01-01T12:00:00.000Z"
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-medium">GET /vehicles/{'{id}'}</h4>
                  <p className="text-muted-foreground">Get a specific vehicle by ID</p>
                  <div className="mt-2">
                    <h5 className="font-medium">Response Example</h5>
                    <pre className="bg-slate-100 p-3 rounded-md text-xs overflow-auto mt-1">
{`{
  "data": {
    "id": "12345-uuid",
    "make": "Toyota",
    "model": "Camry",
    "year": 2023,
    "license_plate": "ABC123",
    "status": "available",
    "color": "blue",
    "vin": "1HGCM82633A123456",
    "mileage": 15000,
    "image_url": "https://example.com/car.jpg",
    "description": "Sedan in excellent condition",
    "vehicle_types": {
      "id": "type-uuid",
      "name": "Economy Sedan",
      "size": "compact",
      "daily_rate": 50.00
    }
  }
}`}
                    </pre>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-medium">POST /vehicles</h4>
                  <p className="text-muted-foreground">Create a new vehicle</p>
                  <div className="mt-2">
                    <h5 className="font-medium">Required Fields</h5>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li><code>make</code> - Vehicle manufacturer</li>
                      <li><code>model</code> - Vehicle model</li>
                      <li><code>year</code> - Vehicle year</li>
                      <li><code>license_plate</code> - License plate number</li>
                      <li><code>vin</code> - Vehicle identification number</li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-medium">PUT /vehicles/{'{id}'}</h4>
                  <p className="text-muted-foreground">Update a specific vehicle</p>
                </div>
                
                <div>
                  <h4 className="text-md font-medium">DELETE /vehicles/{'{id}'}</h4>
                  <p className="text-muted-foreground">Delete a specific vehicle</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Customers API</CardTitle>
              <CardDescription>Endpoints for customer management</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="text-md font-medium">GET /customers</h4>
                <p className="text-muted-foreground">List all customers (paginated)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="agreements">
          <Card>
            <CardHeader>
              <CardTitle>Agreements API</CardTitle>
              <CardDescription>Endpoints for agreement management</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="text-md font-medium">GET /agreements</h4>
                <p className="text-muted-foreground">List all agreements (paginated)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="traffic-fines">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Fines API</CardTitle>
              <CardDescription>Endpoints for traffic fine management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium">GET /traffic-fines</h4>
                  <p className="text-muted-foreground">List all traffic fines</p>
                  <div className="mt-2">
                    <h5 className="font-medium">Query Parameters</h5>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li><code>license_plate</code> - Filter by license plate</li>
                      <li><code>status</code> - Filter by payment status (pending, completed)</li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-medium">GET /traffic-fines/{'{id}'}</h4>
                  <p className="text-muted-foreground">Get a specific traffic fine by ID</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Rate Limits & Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">By default, API keys have the following rate limits:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>100 requests per minute</li>
            <li>5,000 requests per day</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Contact support if you need higher rate limits for your integration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiDocumentation;
