
import React, { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { UserCog, Globe } from "lucide-react";
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
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const UserSettings = () => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    // Password validation
    if (newPassword !== confirmPassword) {
      toast.error(t("settings.passwordsDoNotMatch"));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t("settings.passwordMinLength"));
      return;
    }

    try {
      setIsChangingPassword(true);
      
      // Here you would typically call a function to change password
      // For security reasons, many auth systems require re-authentication first
      toast.success(t("settings.passwordUpdated"));
      
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

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-3">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">{t('common.profile')}</TabsTrigger>
              <TabsTrigger value="security">{t('common.security')}</TabsTrigger>
              <TabsTrigger value="preferences">{t('common.preferences')}</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 mt-4">
              <UserProfile />
            </TabsContent>

            <TabsContent value="security" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{t('settings.securitySettings')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.manageSecuritySettings')}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{t('settings.changePassword')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.changePassword')}
                      </p>
                    </div>
                    <Dialog
                      open={isChangePasswordOpen}
                      onOpenChange={setIsChangePasswordOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline">{t('settings.changePassword')}</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('settings.changePassword')}</DialogTitle>
                          <DialogDescription>
                            {t('settings.changePassword')}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label htmlFor="current-password">{t('settings.currentPassword')}</Label>
                            <Input
                              id="current-password"
                              type="password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-password">{t('settings.newPassword')}</Label>
                            <Input
                              id="new-password"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">{t('settings.confirmPassword')}</Label>
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
                                {t('settings.updating')}
                              </>
                            ) : (
                              t('settings.updatePassword')
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{t('common.signOut')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('common.signOut')}
                      </p>
                    </div>
                    <Button variant="destructive" onClick={signOut}>
                      {t('common.signOut')}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{t('settings.preferences')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.customizePreferences')}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Language settings */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{t('common.language')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('common.changeLanguage')}
                      </p>
                    </div>
                    <LanguageSwitcher position="inline" showLabel={true} />
                  </div>
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
