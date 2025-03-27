import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { ArrowRight, CarFront, Clock, FileText } from 'lucide-react';
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
  return <div className="relative min-h-screen overflow-hidden">
      {/* Particle background */}
      <ParticleBackground />
      
      {/* Gradient overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background/90 via-background/70 to-background/90 z-10" />
      
      <div className="container relative flex flex-col items-center justify-center min-h-screen py-12 space-y-12 z-20">
        {/* Hero section */}
        <motion.div className="space-y-6 text-center max-w-3xl" initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.8
      }}>
          <motion.h1 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400 lg:text-6xl" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.3,
          duration: 0.8
        }}>
            Rental Solutions
          </motion.h1>
          
          <motion.p className="max-w-[600px] text-muted-foreground text-xl mx-auto" initial={{
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
          
          <motion.div className="pt-4 flex gap-4 justify-center" initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.7,
          duration: 0.8
        }}>
            <Link to="/auth/login">
              <Button size="lg" className="group transition-all duration-300 transform hover:scale-105">
                Get Started 
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/auth/register">
              
            </Link>
          </motion.div>
        </motion.div>

        {/* Features section */}
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mt-12" initial={{
        opacity: 0,
        y: 40
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.9,
        duration: 0.8
      }}>
          <motion.div className="flex flex-col p-6 bg-card/80 backdrop-blur-sm rounded-lg shadow-lg border border-border/50 transition-all duration-300 hover:shadow-xl hover:scale-105" whileHover={{
          y: -5
        }}>
            <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
              <CarFront className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Fleet Management</h3>
            <p className="text-muted-foreground flex-1">Track and manage your entire fleet with real-time updates, maintenance schedules, and detailed vehicle profiles.</p>
          </motion.div>
          
          <motion.div className="flex flex-col p-6 bg-card/80 backdrop-blur-sm rounded-lg shadow-lg border border-border/50 transition-all duration-300 hover:shadow-xl hover:scale-105" whileHover={{
          y: -5
        }}>
            <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Paperless Agreements</h3>
            <p className="text-muted-foreground flex-1">Create, manage, and store rental agreements digitally with automated workflows and instant access.</p>
          </motion.div>
          
          <motion.div className="flex flex-col p-6 bg-card/80 backdrop-blur-sm rounded-lg shadow-lg border border-border/50 transition-all duration-300 hover:shadow-xl hover:scale-105" whileHover={{
          y: -5
        }}>
            <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Real-time Analytics</h3>
            <p className="text-muted-foreground flex-1">Access comprehensive dashboards and reports for data-driven decisions to optimize your rental business.</p>
          </motion.div>
        </motion.div>
        
        {/* Testimonial or highlight section */}
        <motion.div className="mt-16 text-center max-w-2xl" initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 1.2,
        duration: 0.8
      }}>
          <p className="text-sm text-muted-foreground">
            Trusted by leading rental companies worldwide to manage fleets, 
            streamline operations, and boost efficiency.
          </p>
        </motion.div>
      </div>
    </div>;
};
export default Index;