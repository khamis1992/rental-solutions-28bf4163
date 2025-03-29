
import React from "react";
import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 flex flex-col">
      <div className="container flex-1 items-center justify-center grid lg:grid-cols-2 lg:px-0">
        <div className="hidden lg:flex flex-col justify-center items-center p-8">
          <div className="relative h-full w-full flex-col items-center justify-center lg:flex">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-md blur-xl" />
            <div className="relative z-10">
              <div className="mb-6 flex flex-col space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Auto Rent Manager</h1>
                <p className="text-muted-foreground text-lg">
                  Efficiently manage your fleet with our comprehensive rental management system.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="w-full max-w-md">
                  {/* Placeholder for image or additional content */}
                  <div className="h-64 w-full rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary">ARM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <Outlet />
          </div>
        </div>
      </div>
      <footer className="border-t py-4">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Auto Rent Manager. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
