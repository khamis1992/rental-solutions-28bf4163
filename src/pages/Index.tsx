
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <div className="container flex flex-col items-center justify-center min-h-screen py-12 space-y-10">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            Rental Solutions
          </h1>
          <p className="max-w-[600px] text-muted-foreground text-xl">
            A comprehensive fleet management system for rental companies.
          </p>
        </div>

        <div className="flex gap-4">
          <Link to="/auth/login">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link to="/auth/register">
            <Button variant="outline" size="lg">Register</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-12">
          <div className="flex flex-col p-6 bg-card rounded-lg shadow">
            <h3 className="text-xl font-bold mb-2">Vehicle Management</h3>
            <p className="text-muted-foreground flex-1">Track and manage your entire fleet in one place.</p>
          </div>
          <div className="flex flex-col p-6 bg-card rounded-lg shadow">
            <h3 className="text-xl font-bold mb-2">Customer Management</h3>
            <p className="text-muted-foreground flex-1">Maintain customer profiles and rental histories.</p>
          </div>
          <div className="flex flex-col p-6 bg-card rounded-lg shadow">
            <h3 className="text-xl font-bold mb-2">Agreement Management</h3>
            <p className="text-muted-foreground flex-1">Create and manage rental agreements efficiently.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
