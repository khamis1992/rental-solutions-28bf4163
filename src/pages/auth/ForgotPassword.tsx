
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, KeyRound, AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [resetError, setResetError] = React.useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      setResetError(null);
      await resetPassword(data.email);
      setIsSubmitted(true);
    } catch (error: any) {
      console.error("Password reset error:", error);
      if (error.message?.includes("rate limit")) {
        setResetError("Too many requests. Please try again later.");
      } else if (error.message?.includes("no user found")) {
        setResetError("No account found with this email address.");
      } else {
        setResetError(error.message || "An error occurred. Please try again.");
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
              <CardTitle className="text-2xl font-bold text-center">Reset password</CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription className="text-center">
                Enter your email to receive a password reset link
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

            {isSubmitted ? (
              <motion.div
                className="text-center p-4 space-y-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-medium mb-2">Check your email</h3>
                <p className="text-muted-foreground mb-4">
                  We've sent a password reset link to <span className="font-medium">{form.getValues().email}</span>.
                  Please check your inbox and follow the instructions to reset your password.
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  If you don't see the email, check your spam folder or try again.
                </p>
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/auth/login")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setIsSubmitted(false);
                      setResetError(null);
                    }}
                  >
                    Try another email
                  </Button>
                </div>
              </motion.div>
            ) : (
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
                          Sending reset link...
                        </>
                      ) : (
                        "Send reset link"
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col">
            <motion.div variants={itemVariants} className="text-sm text-center text-muted-foreground">
              Remember your password?{" "}
              <Link to="/auth/login" className="text-primary hover:underline">
                Back to login
              </Link>
            </motion.div>
          </CardFooter>
        </Card>
      </div>
    </motion.div>
  );
};

export default ForgotPassword;
