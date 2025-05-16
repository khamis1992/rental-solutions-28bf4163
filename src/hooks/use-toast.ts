
// This file creates a wrapper around the toast component
import { useToast as useToastOriginal, toast, type ToastActionElement, type ToastProps } from "@/components/ui/toast";

export { useToastOriginal as useToast, toast };
export type { ToastActionElement, ToastProps };
