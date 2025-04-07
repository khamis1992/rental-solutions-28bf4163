
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ApiDocumentation = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

  const baseUrl = `${window.location.protocol}//${window.location.host}/api`;

  // Example API documentation
  const endpoints = [
    {
      name: 'Traffic Fines',
      path: '/traffic-fines',
      description: 'Manage traffic fines and violations',
      methods: [
        {
          type: 'GET',
          path: '/traffic-fines',
          description: 'List all traffic fines with optional filtering',
          parameters: [
            { name: 'license_plate', type: 'string', description: 'Filter by vehicle license plate' },
            { name: 'status', type: 'string', description: 'Filter by payment status: pending, paid, disputed' },
            { name: 'limit', type: 'number', description: 'Maximum number of results to return (default: 100)' }
          ],
          response: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    violation_number: { type: 'string' },
                    license_plate: { type: 'string' },
                    violation_date: { type: 'string', format: 'date-time' },
                    fine_amount: { type: 'number' },
                    payment_status: { type: 'string', enum: ['pending', 'paid', 'disputed'] }
                  }
                }
              }
            }
          }
        },
        {
          type: 'GET',
          path: '/traffic-fines/{id}',
          description: 'Get a specific traffic fine by ID',
          parameters: [
            { name: 'id', type: 'string', description: 'Traffic fine ID', required: true }
          ],
          response: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  violation_number: { type: 'string' },
                  license_plate: { type: 'string' },
                  violation_date: { type: 'string', format: 'date-time' },
                  fine_amount: { type: 'number' },
                  violation_charge: { type: 'string' },
                  payment_status: { type: 'string', enum: ['pending', 'paid', 'disputed'] },
                  fine_location: { type: 'string' },
                  vehicle_id: { type: 'string' },
                  lease_id: { type: 'string' },
                  payment_date: { type: 'string', format: 'date-time', nullable: true }
                }
              }
            }
          }
        },
        {
          type: 'POST',
          path: '/traffic-fines',
          description: 'Create a new traffic fine',
          requestBody: {
            type: 'object',
            required: ['violation_number', 'violation_date', 'fine_amount', 'payment_status'],
            properties: {
              violation_number: { type: 'string' },
              license_plate: { type: 'string' },
              violation_date: { type: 'string', format: 'date-time' },
              fine_amount: { type: 'number' },
              violation_charge: { type: 'string' },
              payment_status: { type: 'string', enum: ['pending', 'paid', 'disputed'] },
              fine_location: { type: 'string' },
              vehicle_id: { type: 'string' }
            }
          },
          response: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              data: { type: 'object' }
            }
          }
        },
        {
          type: 'PUT',
          path: '/traffic-fines/{id}',
          description: 'Update a traffic fine',
          parameters: [
            { name: 'id', type: 'string', description: 'Traffic fine ID', required: true }
          ],
          requestBody: {
            type: 'object',
            properties: {
              violation_number: { type: 'string' },
              license_plate: { type: 'string' },
              violation_date: { type: 'string', format: 'date-time' },
              fine_amount: { type: 'number' },
              violation_charge: { type: 'string' },
              payment_status: { type: 'string', enum: ['pending', 'paid', 'disputed'] },
              fine_location: { type: 'string' },
              vehicle_id: { type: 'string' },
              payment_date: { type: 'string', format: 'date-time' }
            }
          },
          response: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              data: { type: 'object' }
            }
          }
        },
        {
          type: 'DELETE',
          path: '/traffic-fines/{id}',
          description: 'Delete a traffic fine',
          parameters: [
            { name: 'id', type: 'string', description: 'Traffic fine ID', required: true }
          ],
          response: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      ]
    },
    {
      name: 'Vehicles',
      path: '/vehicles',
      description: 'Vehicle management endpoints',
      methods: [
        {
          type: 'GET',
          path: '/vehicles',
          description: 'List all vehicles',
          parameters: [
            { name: 'status', type: 'string', description: 'Filter by vehicle status' }
          ],
          response: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              resourceId: { type: 'string', nullable: true }
            }
          }
        }
      ]
    },
    {
      name: 'Customers',
      path: '/customers',
      description: 'Customer management endpoints',
      methods: [
        {
          type: 'GET',
          path: '/customers',
          description: 'List all customers',
          parameters: [],
          response: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              resourceId: { type: 'string', nullable: true }
            }
          }
        }
      ]
    },
    {
      name: 'Agreements',
      path: '/agreements',
      description: 'Rental agreement management endpoints',
      methods: [
        {
          type: 'GET',
          path: '/agreements',
          description: 'List all rental agreements',
          parameters: [],
          response: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              resourceId: { type: 'string', nullable: true }
            }
          }
        }
      ]
    }
  ];

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500 text-white';
      case 'POST':
        return 'bg-green-500 text-white';
      case 'PUT':
        return 'bg-amber-500 text-white';
      case 'DELETE':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const renderMethod = (method: any) => {
    return (
      <div key={`${method.type}-${method.path}`} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Badge className={`${getMethodBadgeColor(method.type)} font-mono`}>
            {method.type}
          </Badge>
          <span className="font-mono text-sm">{method.path}</span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{method.description}</p>
        
        {method.parameters && method.parameters.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Parameters</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {method.parameters.map((param: any) => (
                    <tr key={param.name}>
                      <td className="px-4 py-2 text-sm font-medium">{param.name}</td>
                      <td className="px-4 py-2 text-sm">{param.type}</td>
                      <td className="px-4 py-2 text-sm">{param.description}</td>
                      <td className="px-4 py-2 text-sm">{param.required ? '✓' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {method.requestBody && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Request Body</h4>
            <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded text-xs overflow-x-auto">
              {JSON.stringify(method.requestBody, null, 2)}
            </pre>
          </div>
        )}
        
        {method.response && (
          <div>
            <h4 className="text-sm font-medium mb-2">Response</h4>
            <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded text-xs overflow-x-auto">
              {JSON.stringify(method.response, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Example Request</h4>
          <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded text-xs overflow-x-auto">
            {`fetch("${baseUrl}${method.path.replace(/{([^}]+)}/g, '123')}",{
  method: "${method.type}",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
  }${method.type !== 'GET' && method.type !== 'DELETE' ? ',\n  body: JSON.stringify({\n    // request payload\n  })' : ''}
})
.then(response => response.json())
.then(data => console.log(data));`}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto">
      <div className="flex items-center space-x-2 mb-6">
        <Code size={24} className="text-primary" />
        <h1 className="text-2xl font-bold">API Documentation</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            All API requests require authentication using API keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            To authenticate API requests, include an <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">Authorization</code> header with a Bearer token:
          </p>
          <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded text-xs overflow-x-auto">
            Authorization: Bearer YOUR_API_KEY
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>
            Available resources and operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={endpoints[0].path} className="w-full">
            <TabsList className="mb-4 w-full flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 pb-0">
              {endpoints.map((endpoint) => (
                <TabsTrigger 
                  key={endpoint.path} 
                  value={endpoint.path}
                  onClick={() => setSelectedEndpoint(endpoint.path)}
                  className="flex-1"
                >
                  {endpoint.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {endpoints.map((endpoint) => (
              <TabsContent key={endpoint.path} value={endpoint.path}>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">{endpoint.description}</p>
                  
                  {endpoint.methods.map((method) => renderMethod(method))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiDocumentation;
