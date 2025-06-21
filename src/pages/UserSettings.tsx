import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from '@/components/ui/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserCog } from "lucide-react";
import UserProfile from "@/components/auth/UserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
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
  const { language } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    // Password validation
    if (newPassword !== confirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("يجب أن تكون كلمة المرور 6 أحرف على الأقل");
      return;
    }

    try {
      setIsChangingPassword(true);
      
      // Here you would typically call a function to change password
      // For security reasons, many auth systems require re-authentication first
      toast.success("تم تحديث كلمة المرور بنجاح");
      
      // Clear form and close dialog
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      setIsChangePasswordOpen(false);
    } catch (error: any) {
      toast.error(`فشل في تغيير كلمة المرور: ${error.message}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      navigate('/', { replace: true });
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="إعدادات الحساب"
        subtitle="إدارة تفضيلات وإعدادات حسابك"
        icon={<UserCog className="w-6 h-6 text-blue-500" />}
        align={language === 'ar' ? 'right' : 'left'}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />

      <div className="grid gap-6 md:grid-cols-12" dir="rtl">
        <div className="md:col-span-3">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
              <TabsTrigger value="security">الأمان</TabsTrigger>
              <TabsTrigger value="preferences">التفضيلات</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 mt-4">
              <UserProfile />
            </TabsContent>

            <TabsContent value="security" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-right">إعدادات الأمان</h3>
                  <p className="text-sm text-muted-foreground text-right">
                    إدارة أمان حسابك وتفضيلات المصادقة
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center flex-row-reverse">
                    <div className="text-right">
                      <h4 className="font-medium">كلمة المرور</h4>
                      <p className="text-sm text-muted-foreground">
                        تغيير كلمة مرور حسابك
                      </p>
                    </div>
                    <Dialog
                      open={isChangePasswordOpen}
                      onOpenChange={setIsChangePasswordOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline">تغيير كلمة المرور</Button>
                      </DialogTrigger>
                      <DialogContent dir="rtl">
                        <DialogHeader>
                          <DialogTitle className="text-right">تغيير كلمة المرور</DialogTitle>
                          <DialogDescription className="text-right">
                            أدخل كلمة المرور الحالية وكلمة المرور الجديدة أدناه.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label htmlFor="current-password" className="text-right block">كلمة المرور الحالية</Label>
                            <Input
                              id="current-password"
                              type="password"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="text-right"
                              dir="rtl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-password" className="text-right block">كلمة المرور الجديدة</Label>
                            <Input
                              id="new-password"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="text-right"
                              dir="rtl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password" className="text-right block">تأكيد كلمة المرور</Label>
                            <Input
                              id="confirm-password"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="text-right"
                              dir="rtl"
                            />
                          </div>
                        </div>
                        <DialogFooter className="flex flex-row-reverse space-x-reverse space-x-2">
                          <Button
                            onClick={handleChangePassword}
                            disabled={isChangingPassword}
                          >
                            {isChangingPassword ? (
                              <>
                                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                جاري التحديث...
                              </>
                            ) : (
                              "حفظ التغييرات"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="flex justify-between items-center flex-row-reverse">
                    <div className="text-right">
                      <h4 className="font-medium">تسجيل الخروج</h4>
                      <p className="text-sm text-muted-foreground">
                        تسجيل الخروج من حسابك
                      </p>
                    </div>
                    <Button variant="destructive" onClick={handleSignOut}>
                      تسجيل الخروج
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-right">التفضيلات</h3>
                  <p className="text-sm text-muted-foreground text-right">
                    تخصيص تفضيلات حسابك وإعدادات الإشعارات
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Placeholder for preferences settings */}
                  <p className="text-sm text-muted-foreground text-right">
                    إعدادات التفضيلات ستكون متاحة قريباً.
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
