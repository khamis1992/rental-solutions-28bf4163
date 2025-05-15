
// Import directly from the hooks folder to avoid circular references
import { useToast as useToastOriginal, toast, type ToastProps, type ToastActionElement } from "@/hooks/use-toast";

export { useToastOriginal as useToast, toast };
export type { ToastActionElement, ToastProps };
