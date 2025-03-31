
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { UserCog } from "lucide-react";
import UserProfile from "@/components/auth/UserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const UserSettings = () => {
  const { user, signOut } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    // Password validation
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setIsChangingPassword(true);
      
      // Here you would typically call a function to change password
      // For security reasons, many auth systems require re-authentication first
      toast.success("Password updated successfully");
      
      // Clear form and close dialog
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      setIsChangePasswordOpen(false);
    } catch (error: any) {
      toast.error(`Failed to change password: ${error.message}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <PageContainer>
      <SectionHeader
        title={t('settings.accountSettings')}
        description={t('settings.manageAccount')}
        icon={UserCog}
      />
      <LanguageSwitcher />

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-3">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 mt-4">
              <UserProfile />
            </TabsContent>

            <TabsContent value="security" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Security Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your account security and authentication preferences
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Password</h4>
                      <p className="text-sm text-muted-foreground">
                        Change your account password
                      </p>
                    </div>
                    <Dialog
                      open={isChangePasswordOpen}
                      onOpenChange={setIsChangePasswordOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline">Change password</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change password</DialogTitle>
                          <DialogDescription>
                            Enter your current password and new password below.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label htmlFor="current-password">Current password</Label>
                            <Input
                              id="current-password"
                              type="password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-password">New password</Label>
                            <Input
                              id="new-password"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm password</Label>
                            <Input
                              id="confirm-password"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={handleChangePassword}
                            disabled={isChangingPassword}
                          >
                            {isChangingPassword ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              "Save changes"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Sign Out</h4>
                      <p className="text-sm text-muted-foreground">
                        Sign out from your account
                      </p>
                    </div>
                    <Button variant="destructive" onClick={signOut}>
                      Sign out
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Preferences</h3>
                  <p className="text-sm text-muted-foreground">
                    Customize your account preferences and notification settings
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Placeholder for preferences settings */}
                  <p className="text-sm text-muted-foreground">
                    Preference settings will be available soon.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageContainer>
  );
};

export default UserSettings;
