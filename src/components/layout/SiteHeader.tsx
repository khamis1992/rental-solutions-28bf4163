
import React from 'react';
import { Link } from 'react-router-dom';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold">Fleet Management</span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center justify-between">
          <div className="flex gap-6 md:gap-10">
            <Link to="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
              Dashboard
            </Link>
            <Link to="/vehicles" className="text-sm font-medium transition-colors hover:text-primary">
              Vehicles
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
