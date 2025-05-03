
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Check for stored email if remember me was used previously
  const storedEmail = localStorage.getItem("rememberedEmail") || "";

  // Check for success message from registration or password reset
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from location state to prevent showing it again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: storedEmail,
      password: "",
      rememberMe: !!storedEmail,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setLoginError(null);
      setSuccessMessage(null);

      // Handle remember me functionality
      if (data.rememberMe) {
        localStorage.setItem("rememberedEmail", data.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      await signIn(data.email, data.password);

      // Redirect to the page they tried to visit or to dashboard
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error("Login error:", error);
      // Set a user-friendly error message
      if (error.message?.includes("Invalid login credentials")) {
        setLoginError("Invalid email or password. Please try again.");
      } else if (error.message?.includes("Email not confirmed")) {
        setLoginError("Please verify your email address before logging in.");
      } else {
        setLoginError(error.message || "An error occurred during sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      className="w-full max-w-md px-4 sm:px-0"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Card className="border-border/40 shadow-lg bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md">
        <CardHeader className="space-y-1">
          <motion.div variants={itemVariants}>
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-blue-400/20 flex items-center justify-center mb-3">
              <LogIn className="h-6 w-6 text-primary" />
            </div>
          </motion.div>
          <motion.div variants={itemVariants}>
            <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          </motion.div>
          <motion.div variants={itemVariants}>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          {loginError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="name@example.com"
                            {...field}
                            className="pl-10"
                            autoComplete="email"
                          />
                        </FormControl>
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            className="pl-10 pr-10"
                            autoComplete="current-password"
                          />
                        </FormControl>
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="rememberMe"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <label
                          htmlFor="rememberMe"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Remember me
                        </label>
                      </div>
                    )}
                  />

                  <Link
                    to="/auth/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-2">
                <GradientButton
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  size="lg"
                  glow
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </GradientButton>
              </motion.div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <motion.div variants={itemVariants} className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/auth/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default Login;
