
// This file creates a wrapper around the toast component
import { useToast as useToastOriginal } from "@/components/ui/toast";
import { ToastActionElement, ToastProps } from "@/components/ui/toast";

// Create our toast function instead of importing it
const toast = (props: ToastProps & { description?: React.ReactNode; title?: string; action?: ToastActionElement }) => {
  const { toast: originalToast } = useToastOriginal();
  return originalToast(props);
};

export { useToast as useToastOriginal, toast };
export type { ToastProps, ToastActionElement };
