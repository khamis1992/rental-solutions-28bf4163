
// This file creates a wrapper around the toast component
import { useToast as useToastOriginal, toast } from "@/components/ui/toast";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

export { toast };
export const useToast = useToastOriginal;
export type { ToastActionElement, ToastProps };
