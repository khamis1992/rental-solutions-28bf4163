
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CustomButton } from '@/components/ui/custom-button';
import { Car, BarChart, Users, FileText, ChevronRight } from 'lucide-react';

const features = [
  {
    icon: Car,
    title: 'Vehicle Management',
    description: 'Comprehensive fleet inventory with real-time status updates and GPS-based location monitoring.',
  },
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Detailed customer profiles with verification documents, rental histories, and automated risk assessment.',
  },
  {
    icon: FileText,
    title: 'Agreement Management',
    description: 'Digital contract creation with customizable templates for different agreement types.',
  },
  {
    icon: BarChart,
    title: 'Analytics & Reporting',
    description: 'Interactive dashboard with real-time KPIs, business intelligence, and trend analysis.',
  },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 bg-white border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xl">
            AR
          </div>
          <span className="ml-3 font-medium text-lg">Auto Rent Manager</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link to="/vehicles" className="text-muted-foreground hover:text-foreground transition-colors">
            Vehicles
          </Link>
          <Link to="/dashboard">
            <CustomButton>Get Started</CustomButton>
          </Link>
        </div>
        
        <Link to="/dashboard" className="md:hidden">
          <CustomButton>Get Started</CustomButton>
        </Link>
      </header>
      
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-background to-secondary">
        <motion.div 
          className="text-center max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Simplify Your Car Rental Business
          </h1>
          <p className="mt-6 text-xl text-muted-foreground">
            A comprehensive management system for car rental businesses. 
            Streamline your operations, manage your fleet, and delight your customers.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard">
              <CustomButton size="lg" glossy className="px-8">
                Explore Dashboard
                <ChevronRight className="ml-2 h-5 w-5" />
              </CustomButton>
            </Link>
            <Link to="/vehicles">
              <CustomButton size="lg" variant="outline" className="px-8">
                View Vehicles
              </CustomButton>
            </Link>
          </div>
        </motion.div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Powerful Features</h2>
            <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to run your car rental business efficiently in one place.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="p-6 bg-white border border-border rounded-lg shadow-soft"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 px-6 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight">Ready to transform your car rental business?</h2>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Get started with Auto Rent Manager today and see the difference it makes in your operations.
          </p>
          <div className="mt-10">
            <Link to="/dashboard">
              <CustomButton size="lg" variant="secondary" glossy className="px-8">
                Get Started Now
                <ChevronRight className="ml-2 h-5 w-5" />
              </CustomButton>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-6 bg-background border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
              AR
            </div>
            <span className="ml-2 text-sm font-medium">Auto Rent Manager</span>
          </div>
          
          <div className="mt-4 md:mt-0 text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Auto Rent Manager. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
