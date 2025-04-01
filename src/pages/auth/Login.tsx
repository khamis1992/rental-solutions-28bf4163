
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);

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
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
      {/* Enhanced gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-accent/20 animate-gradient-shift" />
      
      {/* Animated floating elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            y: [0, 30, 0],
            x: [0, 15, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-0 -right-4 w-80 h-80 bg-accent/20 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            y: [0, -40, 0],
            x: [0, -20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div 
          className="absolute -bottom-8 left-20 w-72 h-72 bg-secondary/30 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            y: [0, -25, 0],
            x: [0, 25, 0],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
      </div>
      
      <div className="w-full max-w-md px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-primary/20">
            <CardHeader className="space-y-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-center">
                  Enter your credentials to access your account
                </CardDescription>
              </motion.div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                              <Input 
                                placeholder="name@example.com" 
                                {...field} 
                                className="backdrop-blur-sm bg-background/50 pl-10 transition-all duration-300 border-muted focus:border-primary" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                {...field} 
                                className="backdrop-blur-sm bg-background/50 pl-10 transition-all duration-300 border-muted focus:border-primary" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full relative overflow-hidden group"
                      disabled={isLoading}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-80 group-hover:opacity-100 transition-opacity" />
                      <span className="relative flex items-center justify-center">
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Sign in"
                        )}
                      </span>
                    </Button>
                  </motion.div>
                </form>
              </Form>
              
              <motion.div 
                className="mt-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Link to="/auth/forgot-password" className="text-sm text-primary hover:text-accent transition-colors">
                  Forgot password?
                </Link>
              </motion.div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <motion.div 
                className="text-sm text-center text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                Don't have an account?{" "}
                <Link to="/auth/register" className="text-primary hover:text-accent transition-colors font-medium">
                  Sign up
                </Link>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
