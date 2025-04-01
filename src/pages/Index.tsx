import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { ArrowRight, CarFront, Clock, FileText, Boxes, Shield, ChevronRight, Star, BarChart3 } from 'lucide-react';
import ParticleBackground from '@/components/ui/particle-background';
const Index = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();

  // If user is already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };
  const itemVariants = {
    hidden: {
      y: 20,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };
  return <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background/90 via-background/80 to-background/95">
      {/* Enhanced particle background */}
      <ParticleBackground />
      
      {/* Gradient overlays with more vibrant colors */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background/90 via-background/70 to-background/90 z-10" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent z-10" />
      
      <div className="container relative flex flex-col items-center justify-center min-h-screen py-12 space-y-16 z-20">
        {/* Hero section with enhanced animations */}
        <motion.div className="space-y-10 text-center max-w-3xl pt-10" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8
      }}>
          <motion.div initial={{
          opacity: 0,
          scale: 0.9
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          delay: 0.2,
          duration: 0.8
        }} className="mb-6">
            <div className="inline-block p-2 px-4 text-sm font-medium rounded-full bg-gradient-to-r from-primary/20 to-blue-400/20 text-primary mb-6 shadow-md">
              Fleet Management Solution
            </div>
          </motion.div>
          
          <motion.h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.3,
          duration: 0.8
        }}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-blue-300">
              Rental Solutions
            </span>
          </motion.h1>
          
          <motion.p className="max-w-[650px] text-muted-foreground text-xl mx-auto leading-relaxed" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.5,
          duration: 0.8
        }}>
            A comprehensive fleet management system designed to streamline operations, 
            optimize resources, and maximize profitability for rental companies.
          </motion.p>
          
          <motion.div className="pt-8 flex flex-wrap gap-4 justify-center" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.7,
          duration: 0.8
        }}>
            <Link to="/auth/login">
              <Button size="lg" className="group transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-primary to-blue-500 hover:from-blue-600 hover:to-primary shadow-lg hover:shadow-xl">
                Get Started 
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/auth/register">
              
            </Link>
          </motion.div>
        </motion.div>

        {/* Features section with enhanced floating card effect */}
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mt-12" variants={containerVariants} initial="hidden" animate="visible">
          <motion.div className="flex flex-col p-8 glass-card bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md rounded-lg shadow-lg border border-border/50 transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px]" variants={itemVariants} whileHover={{
          y: -8,
          transition: {
            duration: 0.2
          }
        }}>
            <div className="bg-gradient-to-br from-primary/20 to-blue-400/20 p-3 rounded-full w-fit mb-4">
              <CarFront className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Fleet Management</h3>
            <p className="text-muted-foreground flex-1">Track and manage your entire fleet with real-time updates, maintenance schedules, and detailed vehicle profiles.</p>
          </motion.div>
          
          <motion.div className="flex flex-col p-8 glass-card bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md rounded-lg shadow-lg border border-border/50 transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px]" variants={itemVariants} whileHover={{
          y: -8,
          transition: {
            duration: 0.2
          }
        }}>
            <div className="bg-gradient-to-br from-primary/20 to-blue-400/20 p-3 rounded-full w-fit mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Paperless Agreements</h3>
            <p className="text-muted-foreground flex-1">Create, manage, and store rental agreements digitally with automated workflows and instant access.</p>
          </motion.div>
          
          <motion.div className="flex flex-col p-8 glass-card bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md rounded-lg shadow-lg border border-border/50 transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px]" variants={itemVariants} whileHover={{
          y: -8,
          transition: {
            duration: 0.2
          }
        }}>
            <div className="bg-gradient-to-br from-primary/20 to-blue-400/20 p-3 rounded-full w-fit mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Real-time Analytics</h3>
            <p className="text-muted-foreground flex-1">Access comprehensive dashboards and reports for data-driven decisions to optimize your rental business.</p>
          </motion.div>
        </motion.div>
        
        {/* Additional Features Section with enhanced animations */}
        <motion.div className="w-full max-w-5xl mt-8" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 1.2,
        duration: 0.8
      }}>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">Complete Rental Management</h2>
            <p className="text-muted-foreground mt-2">Everything you need to run your rental business efficiently</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div className="p-6 rounded-lg border border-border/50 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300" whileHover={{
            y: -5,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
          }}>
              <div className="flex items-start">
                <div className="bg-gradient-to-br from-primary/20 to-blue-400/20 p-2 rounded-full mr-4">
                  <Boxes className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Inventory Tracking</h3>
                  <p className="text-muted-foreground">Keep track of all your rental assets with detailed condition reports and location tracking.</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div className="p-6 rounded-lg border border-border/50 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300" whileHover={{
            y: -5,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
          }}>
              <div className="flex items-start">
                <div className="bg-gradient-to-br from-primary/20 to-blue-400/20 p-2 rounded-full mr-4">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Contract Management</h3>
                  <p className="text-muted-foreground">Generate legal agreements, track signatures, and manage contract renewals automatically.</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div className="p-6 rounded-lg border border-border/50 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300" whileHover={{
            y: -5,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
          }}>
              <div className="flex items-start">
                <div className="bg-gradient-to-br from-primary/20 to-blue-400/20 p-2 rounded-full mr-4">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Customer Management</h3>
                  <p className="text-muted-foreground">Build and maintain customer relationships with detailed profiles and communication history.</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div className="p-6 rounded-lg border border-border/50 bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300" whileHover={{
            y: -5,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
          }}>
              <div className="flex items-start">
                <div className="bg-gradient-to-br from-primary/20 to-blue-400/20 p-2 rounded-full mr-4">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Financial Reporting</h3>
                  <p className="text-muted-foreground">Track revenue, expenses, and profitability with detailed financial reports and insights.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Testimonial section with enhanced styling */}
        <motion.div className="mt-16 text-center max-w-3xl bg-gradient-to-r from-primary/5 to-blue-400/5 p-10 rounded-2xl border border-border/30 shadow-lg" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 1.4,
        duration: 0.8
      }}>
          <p className="text-xl italic mb-6 text-foreground/90 leading-relaxed">
            "Rental Solutions transformed our operations by streamlining processes and providing crucial insights that helped us expand our fleet by 30% while reducing administrative overhead."
          </p>
          <p className="font-medium text-lg">— Sarah Johnson, Fleet Manager</p>
          
          <div className="mt-10 pt-6 border-t border-border/30">
            <p className="text-sm text-muted-foreground">
              Trusted by leading rental companies worldwide to manage fleets, 
              streamline operations, and boost efficiency.
            </p>
          </div>
        </motion.div>
      </div>
    </div>;
};
export default Index;