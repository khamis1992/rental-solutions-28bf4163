
import React from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import ParticleBackground from "@/components/ui/particle-background";

const AuthLayout = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-background/90 via-background/80 to-background/95">
      {/* Particle background */}
      <ParticleBackground />
      
      {/* Gradient overlays */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background/90 via-background/70 to-background/90 z-10" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent z-10" />
      
      <div className="container flex-1 relative items-center justify-center grid lg:grid-cols-2 lg:px-0 z-20 py-12 min-h-screen">
        <motion.div 
          className="hidden lg:flex flex-col justify-center items-center p-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative h-full w-full flex-col items-center justify-center lg:flex">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-xl" />
            <div className="relative z-10 max-w-md">
              <motion.div 
                className="mb-6 flex flex-col space-y-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-blue-300">
                  Rental Solutions
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Efficiently manage your fleet with our comprehensive rental management system.
                </p>
              </motion.div>
              <motion.div 
                className="flex justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="w-full rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/10 to-blue-400/5 border border-white/10 p-8">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-primary/20 p-3">
                        <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M7 16a6 6 0 003-6m4-1v1m0 0v1m0-1h1m-1 0h-1" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Simplified Management</h3>
                        <p className="text-sm text-muted-foreground">Track your entire fleet in one place</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-primary/20 p-3">
                        <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Enhanced Security</h3>
                        <p className="text-sm text-muted-foreground">Protect your data with advanced security</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-primary/20 p-3">
                        <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">Real-time Analytics</h3>
                        <p className="text-sm text-muted-foreground">Make data-driven decisions</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
        <motion.div 
          className="lg:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <Outlet />
          </div>
        </motion.div>
      </div>
      <footer className="border-t py-4 bg-background/50 backdrop-blur-sm relative z-20">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Rental Solutions. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
