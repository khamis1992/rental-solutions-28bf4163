import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { User, Mail, Phone, Calendar, Edit, Save, X } from 'lucide-react';

export function UserProfile() {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedFullName, setUpdatedFullName] = useState('');
  const [updatedEmail, setUpdatedEmail] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setUpdatedFullName(user?.user_metadata?.full_name || '');
      setUpdatedEmail(user?.email || '');
    };

    fetchProfile();
  }, []);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setUpdatedFullName(user?.user_metadata?.full_name || '');
    setUpdatedEmail(user?.email || '');
  };

  const handleSaveClick = async () => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        email: updatedEmail,
        data: {
          full_name: updatedFullName,
        },
      });

      if (error) {
        toast.error(`Could not update profile: ${error.message}`);
      } else {
        setUser(data.user);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error: any) {
      toast.error(`Could not update profile: ${error.message}`);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <Card className="shadow-lg sm:rounded-md">
          <CardHeader className="flex flex-row items-center pb-2 space-y-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              User Profile
            </CardTitle>
            <Badge variant="secondary">
              User ID: {user.id}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.email}`} />
                <AvatarFallback>{user.email[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-lg font-semibold">{user.user_metadata?.full_name || 'No Name'}</h2>
                <p className="text-gray-500">{user.email}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm text-gray-600">Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  value={updatedFullName}
                  onChange={(e) => setUpdatedFullName(e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-gray-600">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={updatedEmail}
                  onChange={(e) => setUpdatedEmail(e.target.value)}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              {isEditing ? (
                <div className="space-x-2">
                  <Button variant="ghost" onClick={handleCancelClick}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveClick}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              ) : (
                <Button onClick={handleEditClick}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
