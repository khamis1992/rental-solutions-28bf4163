
import { Toaster as SonnerToaster } from "sonner";

export function ToastProvider() {
  return (
    <SonnerToaster 
      position="top-right"
      toastOptions={{
        duration: 5000,
        className: "font-sans",
      }}
    />
  );
}
