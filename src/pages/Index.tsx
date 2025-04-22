import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  ArrowRight, CarFront, Clock, FileText, Boxes, Shield, 
  ChevronRight, Star, BarChart3, Users, CreditCard, 
  Calendar, Phone, Check, ArrowDown
} from 'lucide-react';
import ParticleBackground from '@/components/ui/particle-background';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  // Scroll to features section
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-background/90 via-background/80 to-background/95">
      {/* Enhanced particle background */}
      <ParticleBackground />
      
      {/* Gradient overlays with more vibrant colors */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-background/90 via-background/70 to-background/90 z-10" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent z-10" />
      
      <div className="relative z-20">
        {/* Hero section with split layout */}
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                className="inline-block"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <div className="inline-block p-2 px-4 text-sm font-medium rounded-full bg-gradient-to-r from-primary/20 to-blue-400/20 text-primary mb-6 shadow-md">
                  Complete Fleet Management Solution
                </div>
              </motion.div>
              
              <motion.h1 
                className="text-5xl font-extrabold tracking-tight lg:text-7xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-blue-300">
                  Streamline Your
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-blue-300">
                  Rental Business
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-muted-foreground leading-relaxed max-w-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                An all-in-one platform for rental companies to manage vehicles, agreements, and finances with ease.
                Get more done with less work.
              </motion.p>
              
              <motion.div 
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              >
                <Link to="/auth/login">
                  <Button size="lg" className="group transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-primary to-blue-500 hover:from-blue-600 hover:to-primary shadow-lg hover:shadow-xl">
                    Get Started 
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={scrollToFeatures}
                  className="group border border-primary/20 hover:border-primary/40"
                >
                  See features
                  <ArrowDown className="ml-2 h-4 w-4 transition-transform group-hover:translate-y-1" />
                </Button>
              </motion.div>

              <motion.div 
                className="flex items-center gap-6 pt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-background bg-primary/20`} />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">350+</span> companies trust us
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <div className="relative bg-gradient-to-br from-background/80 to-background/50 backdrop-blur-md rounded-2xl shadow-2xl border border-border/50 overflow-hidden aspect-[4/3]">
                <img 
                  src="/lovable-uploads/f81bdd9a-0bfe-4a23-9690-2b9104df3642.png" 
                  alt="Dashboard Preview" 
                  className="w-full h-full object-cover opacity-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
              
              {/* Floating highlights */}
              <motion.div 
                className="absolute -top-4 -right-4 py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg shadow-lg text-white text-sm font-medium"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Real-time updates</span>
                </div>
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-4 -left-4 py-2 px-4 bg-gradient-to-r from-primary to-blue-500 rounded-lg shadow-lg text-white text-sm font-medium"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Smart analytics</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Stats Section */}
        <motion.div 
          className="bg-gradient-to-r from-primary/5 via-blue-400/10 to-primary/5 py-12 border-y border-primary/10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <h3 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">98%</h3>
                <p className="text-muted-foreground mt-2">Client satisfaction</p>
              </div>
              <div className="text-center">
                <h3 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">15k+</h3>
                <p className="text-muted-foreground mt-2">Vehicles managed</p>
              </div>
              <div className="text-center">
                <h3 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">350+</h3>
                <p className="text-muted-foreground mt-2">Companies</p>
              </div>
              <div className="text-center">
                <h3 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">24/7</h3>
                <p className="text-muted-foreground mt-2">Support available</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features section with enhanced cards */}
        <div id="features" className="container mx-auto px-4 py-24">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block p-2 px-4 text-sm font-medium rounded-full bg-gradient-to-r from-primary/20 to-blue-400/20 text-primary mb-6 shadow-md">
              Core Features
            </div>
            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
              Everything you need to manage your fleet
            </h2>
            <p className="text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
              Our platform is designed to streamline operations and boost profitability at every step
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div 
              className="flex flex-col p-8 glass-card bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md rounded-xl shadow-lg border border-border/50 transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px]" 
              variants={itemVariants}
              whileHover={{
                y: -8,
                transition: { duration: 0.2 }
              }}
            >
              <div className="bg-gradient-to-br from-primary/20 to-blue-400/20 p-3 rounded-full w-fit mb-4">
                <CarFront className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Fleet Management</h3>
              <p className="text-muted-foreground flex-1 mb-6">Track and manage your entire fleet with real-time updates, maintenance schedules, and detailed vehicle profiles.</p>
              <div className="mt-auto">
                <Link to="/auth/register" className="group inline-flex items-center text-primary hover:text-primary/80">
                  Learn more <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex flex-col p-8 glass-card bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md rounded-xl shadow-lg border border-border/50 transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px]" 
              variants={itemVariants}
              whileHover={{
                y: -8,
                transition: { duration: 0.2 }
              }}
            >
              <div className="bg-gradient-to-br from-primary/20 to-blue-400/20 p-3 rounded-full w-fit mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Paperless Agreements</h3>
              <p className="text-muted-foreground flex-1 mb-6">Create, manage, and store rental agreements digitally with automated workflows and instant access.</p>
              <div className="mt-auto">
                <Link to="/auth/register" className="group inline-flex items-center text-primary hover:text-primary/80">
                  Learn more <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex flex-col p-8 glass-card bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-md rounded-xl shadow-lg border border-border/50 transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px]" 
              variants={itemVariants}
              whileHover={{
                y: -8,
                transition: { duration: 0.2 }
              }}
            >
              <div className="bg-gradient-to-br from-primary/20 to-blue-400/20 p-3 rounded-full w-fit mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Real-time Analytics</h3>
              <p className="text-muted-foreground flex-1 mb-6">Access comprehensive dashboards and reports for data-driven decisions to optimize your rental business.</p>
              <div className="mt-auto">
                <Link to="/auth/register" className="group inline-flex items-center text-primary hover:text-primary/80">
                  Learn more <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Feature showcase with screenshots */}
        <div className="bg-gradient-to-b from-background to-primary/5 py-24">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
                  Built for growth
                </span>
              </h2>
              <p className="text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
                The complete platform to take your rental business to the next level
              </p>
            </motion.div>

            {/* Feature 1 */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="order-2 lg:order-1">
                <div className="inline-block p-2 px-4 text-sm font-medium rounded-full bg-primary/10 text-primary mb-4">
                  Digital Agreements
                </div>
                <h3 className="text-3xl font-bold mb-4">Paperless Contract Management</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-1 rounded-full mt-1">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-muted-foreground">Generate customized rental agreements in seconds</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-1 rounded-full mt-1">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-muted-foreground">Digital signatures and automatic document storage</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-1 rounded-full mt-1">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-muted-foreground">Automated renewal reminders and contract tracking</p>
                  </div>
                </div>
              </div>
              
              <motion.div 
                className="order-1 lg:order-2 relative"
                initial={{ x: 50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <div className="bg-gradient-to-br from-background/80 to-background/50 backdrop-blur-md rounded-xl shadow-xl border border-border/50 overflow-hidden">
                  <img 
                    src="/lovable-uploads/3e327a80-91f9-498d-aa11-cb8ed24eb199.png"
                    alt="Agreement Management" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                className="relative"
                initial={{ x: -50, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <div className="bg-gradient-to-br from-background/80 to-background/50 backdrop-blur-md rounded-xl shadow-xl border border-border/50 overflow-hidden">
                  <img 
                    src="/lovable-uploads/737e8bf3-01cb-4104-9d28-4e2775eb9efd.png"
                    alt="Financial Management" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
              
              <div>
                <div className="inline-block p-2 px-4 text-sm font-medium rounded-full bg-primary/10 text-primary mb-4">
                  Financial Management
                </div>
                <h3 className="text-3xl font-bold mb-4">Complete Financial Control</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-1 rounded-full mt-1">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-muted-foreground">Track payments, invoices, and receivables in one place</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-1 rounded-full mt-1">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-muted-foreground">Generate detailed financial reports with one click</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-1 rounded-full mt-1">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-muted-foreground">Automate billing and payment collection processes</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Testimonial section */}
        <div className="container mx-auto px-4 py-24">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block p-2 px-4 text-sm font-medium rounded-full bg-gradient-to-r from-primary/20 to-blue-400/20 text-primary mb-6 shadow-md">
              Testimonials
            </div>
            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
              Trusted by rental businesses worldwide
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <motion.div 
              className="bg-gradient-to-br from-card/80 to-card/60 p-8 rounded-xl shadow-lg border border-border/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <div className="flex mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6">
                "Since implementing Rental Solutions, we've reduced our paperwork by 90% and increased our operational efficiency significantly."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full"></div>
                <div>
                  <h4 className="font-medium">Sarah Johnson</h4>
                  <p className="text-sm text-muted-foreground">CEO, FleetMasters Inc.</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-card/80 to-card/60 p-8 rounded-xl shadow-lg border border-border/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <div className="flex mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6">
                "The analytics dashboard has given us insights we never had before. Now we can make data-driven decisions that have improved our profitability by 35%."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full"></div>
                <div>
                  <h4 className="font-medium">David Rodriguez</h4>
                  <p className="text-sm text-muted-foreground">Operations Manager, RentalPro</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-card/80 to-card/60 p-8 rounded-xl shadow-lg border border-border/50"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <div className="flex mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6">
                "Customer satisfaction is up 40% since we started using Rental Solutions. The streamlined process makes both our staff and customers happier."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full"></div>
                <div>
                  <h4 className="font-medium">Michelle Lee</h4>
                  <p className="text-sm text-muted-foreground">Customer Service Director, AutoRental</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* CTA section */}
        <motion.div 
          className="bg-gradient-to-r from-primary/10 via-blue-400/20 to-primary/10 py-24 border-t border-primary/10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="max-w-2xl mx-auto"
            >
              <h2 className="text-4xl font-bold mb-6">Ready to transform your rental business?</h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-lg mx-auto">
                Join hundreds of successful companies who have streamlined their operations with our platform.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/auth/register">
                  <Button size="lg" className="group transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-primary to-blue-500 hover:from-blue-600 hover:to-primary shadow-lg hover:shadow-xl">
                    Get Started 
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/auth/login">
                  <Button variant="outline" size="lg" className="group border border-primary/40">
                    Log In 
                  </Button>
                </Link>
              </div>
              <div className="mt-8 text-sm text-muted-foreground">
                No credit card required • Free trial available • Cancel anytime
              </div>
            </motion.div>
            
            <div className="mt-12 flex justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm">256-bit encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <span className="text-sm">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-sm">24/7 Support</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
