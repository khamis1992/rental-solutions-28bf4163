
// This file creates a wrapper around the toast component
import { useToast as useToastOriginal } from "@/components/ui/toast";
import { ToastActionElement } from "@/components/ui/toast";

export type ToastProps = {
  title?: string;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive';
};

// Create our toast function 
const toast = ({ title, description, action, variant }: ToastProps) => {
  // Get the original toast function
  const { toast: originalToast } = useToastOriginal();
  
  // Call it with our props
  return originalToast({
    title,
    description,
    action,
    variant
  });
};

export { useToastOriginal as useToast, toast };
export type { ToastActionElement, ToastProps };
