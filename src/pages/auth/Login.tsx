
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("عنوان بريد إلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      await signIn(data.email, data.password);
      
      // Redirect to the page they tried to visit or to dashboard
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm">
        <CardHeader className="text-center pt-8 pb-6">
          <CardTitle className="text-xl font-semibold text-gray-800 mb-2">
            العراف لتأجير السيارات
          </CardTitle>
          <p className="text-gray-500 text-sm">
            تسجيل الدخول إلى حسابك
          </p>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 text-sm font-medium text-right block mb-2">
                      البريد الإلكتروني
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="admin@admin.com" 
                        {...field} 
                        className="h-11 border-gray-300 rounded-md text-left focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        dir="ltr"
                      />
                    </FormControl>
                    <FormMessage className="text-right text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 text-sm font-medium text-right block mb-2">
                      كلمة المرور
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="ادخل كلمة المرور" 
                          {...field} 
                          className="h-11 border-gray-300 rounded-md text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pl-10"
                          dir="rtl"
                        />
                      </FormControl>
                      <button 
                        type="button"
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FormMessage className="text-right text-xs" />
                  </FormItem>
                )}
              />
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    "تسجيل الدخول"
                  )}
                </Button>
              </div>
            </form>
          </Form>
          
          <div className="mt-4 text-center">
            <Link to="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </div>
          
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">
              ليس لديك حساب؟{" "}
              <Link to="/auth/register" className="text-blue-600 hover:underline">
                إنشاء حساب جديد
              </Link>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
