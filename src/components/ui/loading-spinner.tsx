import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  className,
  text
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };
  
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary")} />
      {text && <span className="ml-2 text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

interface FullPageLoaderProps {
  text?: string;
}

export function FullPageLoader({ text = "Loading..." }: FullPageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-muted-foreground">{text}</p>
    </div>
  );
}

interface InlineLoaderProps {
  text?: string;
}

export function InlineLoader({ text }: InlineLoaderProps) {
  return (
    <div className="flex items-center py-2">
      <LoadingSpinner size="sm" />
      {text && <span className="ml-2 text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

interface ButtonLoaderProps {
  text: string;
}

export function ButtonLoader({ text }: ButtonLoaderProps) {
  return (
    <>
      <LoadingSpinner size="sm" className="mr-2" />
      {text}
    </>
  );
}
