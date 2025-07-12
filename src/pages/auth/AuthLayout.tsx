import React from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { ParticleBackground } from "@/components/ui/particle-background";

const AuthLayout = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-background/90 via-background/80 to-background/95">
      {/* Particle background */}
      <ParticleBackground />
      
      {/* Gradient overlays */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background/90 via-background/70 to-background/90 z-10" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent z-10" />
      
      <div className="container flex-1 relative items-center justify-center flex lg:px-0 z-20 py-12 min-h-screen">
        <motion.div 
          className="lg:p-8 w-full max-w-md mx-auto"
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