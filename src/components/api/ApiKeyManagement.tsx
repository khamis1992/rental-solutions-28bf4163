
import React, { useState, useEffect } from 'react';
import { useApiKeys } from '@/hooks/use-api-keys';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ApiKeyPermission } from '@/types/api-types';
import { format } from 'date-fns';
import { AlertCircle, Check, Copy, Key, Shield, ShieldAlert, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const ApiKeyManagement: React.FC = () => {
  const { apiKeys, isLoading, createApiKey, revokeApiKey, refetch } = useApiKeys();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<ApiKeyPermission[]>([]);
  const [expiryDays, setExpiryDays] = useState<number | ''>('');
  
  // Force refresh data when component mounts and when user changes
  useEffect(() => {
    console.log("Component mounted or user changed, refreshing API keys");
    if (user?.id) {
      handleRefresh();
    }
  }, [user?.id]);
  
  // Permission options
  const permissionOptions: { value: ApiKeyPermission; label: string }[] = [
    { value: 'vehicles', label: 'Vehicles' },
    { value: 'customers', label: 'Customers' },
    { value: 'agreements', label: 'Agreements' },
    { value: 'traffic-fines', label: 'Traffic Fines' },
    { value: '*', label: 'All Resources (Full Access)' },
  ];
  
  const togglePermission = (permission: ApiKeyPermission) => {
    if (permission === '*') {
      if (!permissions.includes('*')) {
        setPermissions(['*']);
      } else {
        setPermissions([]);
      }
      return;
    }
    
    if (permissions.includes('*')) {
      setPermissions([permission]);
      return;
    }
    
    if (permissions.includes(permission)) {
      setPermissions(permissions.filter(p => p !== permission));
    } else {
      setPermissions([...permissions, permission]);
    }
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      console.log("API keys refreshed");
    } catch (error) {
      console.error("Error refreshing API keys:", error);
      toast.error("Failed to refresh API keys");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const handleCreateApiKey = async () => {
    if (!name) {
      toast.error('API key name is required');
      return;
    }
    
    if (permissions.length === 0) {
      toast.error('Select at least one permission');
      return;
    }
    
    try {
      let expires_at = null;
      if (expiryDays !== '') {
        const days = parseInt(expiryDays.toString());
        if (!isNaN(days) && days > 0) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + days);
          expires_at = expiryDate.toISOString();
        }
      }
      
      const response = await createApiKey.mutateAsync({
        name,
        description,
        permissions,
        expires_at
      });
      
      if (response?.key_value) {
        setNewKeyValue(response.key_value);
        setShowNewKey(true);
      }
      
      setName('');
      setDescription('');
      setPermissions([]);
      setExpiryDays('');
      setIsCreating(false);
      
      // Explicitly refresh after creating
      await handleRefresh();
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };
  
  const handleRevokeKey = async (keyId: string, keyName: string) => {
    if (confirm(`Are you sure you want to revoke the API key "${keyName}"? This action cannot be undone.`)) {
      try {
        await revokeApiKey.mutateAsync(keyId);
        // Explicitly refresh after revoking
        await handleRefresh();
      } catch (error) {
        console.error('Error revoking key:', error);
      }
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('API key copied to clipboard');
  };
  
  const renderApiKeyTable = () => {
    if (isLoading || isRefreshing) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading API keys...</p>
        </div>
      );
    }
    
    if (!apiKeys || apiKeys.length === 0) {
      return (
        <div className="text-center py-12 border rounded-md bg-muted/20">
          <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No API keys found</h3>
          <p className="text-muted-foreground mb-6">
            Create your first API key to integrate with external applications.
          </p>
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              className="flex items-center gap-2 mr-2"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              Create API Key
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Used</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiKeys.map((apiKey) => (
            <TableRow key={apiKey.id}>
              <TableCell>
                <div className="font-medium">{apiKey.name}</div>
                {apiKey.description && (
                  <div className="text-sm text-muted-foreground">{apiKey.description}</div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {apiKey.permissions?.includes('*') ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      All Resources
                    </Badge>
                  ) : (
                    apiKey.permissions?.map(permission => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))
                  )}
                </div>
              </TableCell>
              <TableCell>
                {apiKey.created_at ? format(new Date(apiKey.created_at), 'MMM d, yyyy') : 'N/A'}
              </TableCell>
              <TableCell>
                {apiKey.last_used_at ? (
                  format(new Date(apiKey.last_used_at), 'MMM d, yyyy HH:mm')
                ) : (
                  <span className="text-muted-foreground">Never</span>
                )}
              </TableCell>
              <TableCell>
                {apiKey.is_active ? (
                  <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
                    Revoked
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {apiKey.is_active && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRevokeKey(apiKey.id, apiKey.name)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Revoke
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage API keys for third-party application access
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button onClick={() => setIsCreating(true)}>
              <Key className="h-4 w-4 mr-2" />
              Generate New Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {renderApiKeyTable()}
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground">
            <ShieldAlert className="h-4 w-4 inline mr-1" />
            API keys provide third-party access to your data. Never share your API keys with unauthorized parties.
          </div>
        </CardFooter>
      </Card>
      
      {/* Create API Key Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for third-party access
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Key Name</Label>
              <Input
                id="name"
                placeholder="E.g., Analytics Integration"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="What this API key is used for"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Permissions</Label>
              <div className="grid gap-2">
                {permissionOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`permission-${option.value}`}
                      checked={permissions.includes(option.value)}
                      onCheckedChange={() => togglePermission(option.value)}
                    />
                    <Label htmlFor={`permission-${option.value}`} className="font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="expiry">Expires After (Days)</Label>
              <Input
                id="expiry"
                type="number"
                placeholder="Leave empty for no expiry"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value === '' ? '' : parseInt(e.target.value))}
                min="1"
              />
              <p className="text-sm text-muted-foreground">
                For security, it's recommended to set an expiry date
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateApiKey}
              disabled={createApiKey.isPending}
            >
              {createApiKey.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create API Key"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New API Key Dialog */}
      <Dialog open={showNewKey} onOpenChange={setShowNewKey}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy your API key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important!</AlertTitle>
            <AlertDescription>
              This is the only time this API key will be displayed. Please save it securely.
            </AlertDescription>
          </Alert>
          
          <div className="flex items-center border rounded-md p-2 bg-muted/50">
            <code className="font-mono text-sm flex-1 overflow-x-auto p-2">
              {newKeyValue}
            </code>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2"
              onClick={() => copyToClipboard(newKeyValue)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-2 text-sm">
            <p className="font-medium">Integration Example:</p>
            <code className="text-xs block mt-1 p-3 bg-slate-950 text-slate-50 rounded">
              {`curl -X GET https://vqdlsidkucrownbfuouq.supabase.co/functions/v1/api/traffic-fines \\
  -H "Authorization: Bearer ${newKeyValue}"`}
            </code>
          </div>
          
          <DialogFooter>
            <Button 
              variant="default" 
              onClick={() => {
                copyToClipboard(newKeyValue);
                setShowNewKey(false);
                handleRefresh(); // Refresh after closing the dialog
              }}
              className="w-full"
            >
              <Check className="h-4 w-4 mr-2" />
              I've Saved My API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ApiKeyManagement;
