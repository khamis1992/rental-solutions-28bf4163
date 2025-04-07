
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckCircle2,
  Copy,
  Key,
  Plus,
  RefreshCw,
  Shield,
  ShieldAlert,
  Trash2, 
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  description: string | null;
  key_value: string;
  permissions: string[];
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  is_active: boolean;
}

const ApiKeyManagement: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState<ApiKey | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    expiresIn: '0',
  });
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  // Available permissions for API keys
  const availablePermissions = [
    { value: 'vehicles', label: 'Vehicles' },
    { value: 'customers', label: 'Customers' },
    { value: 'agreements', label: 'Agreements' },
    { value: 'traffic-fines', label: 'Traffic Fines' },
  ];

  // Expiry options for API keys
  const expiryOptions = [
    { value: '0', label: 'Never expires' },
    { value: '30', label: '30 days' },
    { value: '90', label: '90 days' },
    { value: '365', label: '1 year' },
  ];

  // Fetch API keys
  const { data: apiKeys, isLoading, error } = useQuery<ApiKey[]>({
    queryKey: ['apiKeys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    },
  });

  // Create API key mutation
  const createApiKey = useMutation({
    mutationFn: async () => {
      // Calculate expiry date if needed
      let expiresAt = null;
      const daysToExpire = parseInt(formData.expiresIn, 10);
      
      if (daysToExpire > 0) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + daysToExpire);
        expiresAt = expiry.toISOString();
      }
      
      const { data, error } = await supabase
        .rpc('create_api_key', {
          p_name: formData.name,
          p_description: formData.description || null,
          p_permissions: formData.permissions,
          p_expires_at: expiresAt
        });
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setNewKey(data);
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
    },
    onError: (error) => {
      console.error('Error creating API key:', error);
      toast.error('Failed to create API key');
    },
  });

  // Revoke API key mutation
  const revokeApiKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { data, error } = await supabase
        .rpc('revoke_api_key', {
          p_key_id: keyId
        });
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success('API key revoked successfully');
    },
    onError: (error) => {
      console.error('Error revoking API key:', error);
      toast.error('Failed to revoke API key');
    },
  });

  const handleFormChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('API key name is required');
      return;
    }
    
    if (formData.permissions.length === 0) {
      toast.error('Select at least one permission');
      return;
    }
    
    createApiKey.mutate();
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setNewKey(null);
    setFormData({
      name: '',
      description: '',
      permissions: [],
      expiresIn: '0',
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return formatDate(dateString);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">API Keys</h2>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            {newKey ? (
              <div className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    API Key Created
                  </DialogTitle>
                  <DialogDescription>
                    Make sure to copy your API key now. You won't be able to see it again!
                  </DialogDescription>
                </DialogHeader>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="flex justify-between items-center">
                    <code className="text-sm font-mono break-all">{newKey.key_value}</code>
                    <TooltipProvider>
                      <Tooltip open={copied}>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyToClipboard(newKey.key_value)}
                          >
                            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copied!</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Name:</span>
                    <span>{newKey.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Permissions:</span>
                    <span>{newKey.permissions.join(', ')}</span>
                  </div>
                  {newKey.expires_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Expires:</span>
                      <span>{formatDate(newKey.expires_at)}</span>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button onClick={handleCloseDialog}>
                    Close
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Create an API key to authenticate requests from external systems
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Key Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter a name for this API key"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="What is this API key used for?"
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availablePermissions.map((permission) => (
                        <label
                          key={permission.value}
                          className="flex items-center space-x-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            value={permission.value}
                            checked={formData.permissions.includes(permission.value)}
                            onChange={(e) => {
                              const value = permission.value;
                              if (e.target.checked) {
                                handleFormChange('permissions', [...formData.permissions, value]);
                              } else {
                                handleFormChange(
                                  'permissions',
                                  formData.permissions.filter((p) => p !== value)
                                );
                              }
                            }}
                          />
                          <span>{permission.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expiresIn">Expiry</Label>
                    <Select 
                      value={formData.expiresIn} 
                      onValueChange={(value) => handleFormChange('expiresIn', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select expiration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {expiryOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createApiKey.isPending}>
                    {createApiKey.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create API Key'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>
            Manage API keys to authenticate requests from external systems.
            Keep your API keys secure and do not share them publicly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-6">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-6">
              Error loading API keys. Please try again.
            </div>
          ) : apiKeys && apiKeys.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">
                        {key.name}
                        {key.description && (
                          <div className="text-xs text-gray-500">{key.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {key.permissions.map((permission) => (
                            <span
                              key={permission}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(key.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {key.expires_at ? formatDate(key.expires_at) : 'Never'}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {formatTimeAgo(key.last_used_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {key.is_active ? (
                          <div className="flex items-center text-green-600">
                            <Shield className="h-4 w-4 mr-1" />
                            <span>Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400">
                            <ShieldAlert className="h-4 w-4 mr-1" />
                            <span>Revoked</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => revokeApiKey.mutate(key.id)}
                          disabled={!key.is_active || revokeApiKey.isPending}
                          className="h-8 px-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Revoke</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium">No API keys</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create an API key to start integrating with external systems.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeyManagement;
