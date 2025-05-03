
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, Eye, EyeOff, KeyRound, CheckCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

// Enhanced password validation
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine(
    (password) => /[A-Z]/.test(password),
    "Password must contain at least one uppercase letter"
  )
  .refine(
    (password) => /[a-z]/.test(password),
    "Password must contain at least one lowercase letter"
  )
  .refine(
    (password) => /[0-9]/.test(password),
    "Password must contain at least one number"
  )
  .refine(
    (password) => /[^A-Za-z0-9]/.test(password),
    "Password must contain at least one special character"
  );

const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [hashPresent, setHashPresent] = React.useState(false);
  const [resetError, setResetError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [passwordStrength, setPasswordStrength] = React.useState(0);

  useEffect(() => {
    // Check for the presence of a hash for password reset
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setHashPresent(true);
    } else {
      toast.error("Invalid or expired password reset link");
      navigate("/auth/login", {
        replace: true,
        state: {
          message: "The password reset link is invalid or has expired. Please request a new one."
        }
      });
    }
  }, [navigate]);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0;

    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 25;

    // Character type checks
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^A-Za-z0-9]/.test(password)) strength += 12.5;

    return Math.min(100, strength);
  };

  // Watch password field to calculate strength
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'password') {
        setPasswordStrength(calculatePasswordStrength(value.password || ''));
      }
    });

    return () => subscription.unsubscribe();
  }, [form.watch]);

  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 25) return "Very Weak";
    if (passwordStrength < 50) return "Weak";
    if (passwordStrength < 75) return "Moderate";
    if (passwordStrength < 100) return "Strong";
    return "Very Strong";
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return "bg-red-500";
    if (passwordStrength < 50) return "bg-orange-500";
    if (passwordStrength < 75) return "bg-yellow-500";
    if (passwordStrength < 100) return "bg-green-500";
    return "bg-emerald-500";
  };

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!hashPresent) {
      return;
    }

    try {
      setIsLoading(true);
      setResetError(null);

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success("Password updated successfully");
    } catch (error: any) {
      console.error("Password reset error:", error);
      setResetError(error.message || "Failed to reset password. Please try again.");
      toast.error(`Failed to reset password: ${error.message}`);
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

  if (!hashPresent) {
    return (
      <motion.div
        className="flex items-center justify-center min-h-screen bg-background px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Invalid Reset Link</h2>
          <p className="mb-6 text-muted-foreground">The password reset link is invalid or has expired. Please request a new password reset.</p>
          <Button
            onClick={() => navigate("/auth/forgot-password")}
            className="mr-2"
          >
            Request New Link
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/auth/login")}
          >
            Back to Login
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen bg-background px-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="w-full max-w-md">
        <Card className="border-border/40 shadow-lg bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md">
          <CardHeader className="space-y-1">
            <motion.div variants={itemVariants}>
              <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-blue-400/20 flex items-center justify-center mb-3">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardTitle className="text-2xl font-bold text-center">Set new password</CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription className="text-center">
                Create a strong password for your account
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent>
            {resetError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{resetError}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {isSuccess ? (
              <motion.div
                className="text-center p-4 space-y-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-medium mb-2">Password Updated Successfully</h3>
                <p className="text-muted-foreground mb-6">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
                <Button
                  className="w-full"
                  onClick={() => navigate("/auth/login", {
                    replace: true,
                    state: {
                      message: "Your password has been updated successfully. You can now log in with your new password."
                    }
                  })}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go to Login
                </Button>
              </motion.div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...field}
                                autoComplete="new-password"
                                className="pr-10"
                              />
                            </FormControl>
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                              onClick={() => setShowPassword(!showPassword)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between mb-1 text-xs">
                              <span>Password Strength:</span>
                              <span className={passwordStrength >= 75 ? "text-green-500" : passwordStrength >= 50 ? "text-yellow-500" : "text-red-500"}>
                                {getPasswordStrengthLabel()}
                              </span>
                            </div>
                            <Progress value={passwordStrength} className={`h-1 ${getPasswordStrengthColor()}`} />
                          </div>
                          <FormDescription className="text-xs mt-1">
                            Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...field}
                                autoComplete="new-password"
                                className="pr-10"
                              />
                            </FormControl>
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="pt-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating password...
                        </>
                      ) : (
                        "Update password"
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>
            )}
          </CardContent>
          {!isSuccess && (
            <CardFooter className="flex flex-col">
              <motion.div variants={itemVariants} className="text-sm text-center text-muted-foreground">
                Remember your password?{" "}
                <Link to="/auth/login" className="text-primary hover:underline">
                  Back to login
                </Link>
              </motion.div>
            </CardFooter>
          )}
        </Card>
      </div>
    </motion.div>
  );
};

export default ResetPassword;
