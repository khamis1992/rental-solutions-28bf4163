import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";
import { useSafeAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const profileSchema = z.object({
  full_name: z.string().min(3, "يجب أن يكون الاسم الكامل 3 أحرف على الأقل"),
  email: z.string().email("عنوان البريد الإلكتروني غير صالح").optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const UserProfile = () => {
  const { profile, updateProfile, isLoading } = useProfile();
  const { user } = useSafeAuth();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
      email: user?.email || "",
    },
  });

  React.useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || "",
        email: user?.email || "",
      });
    }
  }, [profile, user, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsUpdating(true);
      await updateProfile({ full_name: data.full_name });
    } catch (error) {
      console.error("خطأ في تحديث الملف الشخصي:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="mr-2 text-muted-foreground">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <Card className="rtl" dir="rtl">
      <CardHeader>
        <CardTitle className="text-right">الملف الشخصي</CardTitle>
        <CardDescription className="text-right">إدارة إعدادات وتفضيلات حسابك</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" dir="rtl">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right block">الاسم الكامل</FormLabel>
                  <FormControl>
                    <Input placeholder="محمد أحمد" {...field} className="text-right" dir="rtl" />
                  </FormControl>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right block">البريد الإلكتروني</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} disabled className="text-right" dir="ltr" />
                  </FormControl>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-reverse space-x-2">
              <div className="font-medium">الدور:</div>
              <div className="text-muted-foreground">{profile?.role === "User" ? "مستخدم" : profile?.role === "admin" ? "مدير" : profile?.role === "staff" ? "موظف" : profile?.role}</div>
            </div>

            <div className="flex items-center space-x-reverse space-x-2">
              <div className="font-medium">حالة الحساب:</div>
              <div className="text-muted-foreground">{profile ? "نشط" : "معلق"}</div>
            </div>

            <Button type="submit" disabled={isUpdating} className="w-full">
              {isUpdating ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                "حفظ التغييرات"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between"></CardFooter>
    </Card>
  );
};

export default UserProfile;

// Helper function
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}