
import { Button } from "@/components/ui/button";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-red-50 rounded-lg border border-red-200 text-red-800">
      <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm text-red-700 mb-4">{error.message}</p>
      <div className="bg-red-100 p-2 rounded overflow-auto max-w-full my-2">
        <pre className="text-xs whitespace-pre-wrap">{error.stack}</pre>
      </div>
      <Button 
        variant="destructive" 
        onClick={resetErrorBoundary}
        className="mt-4"
      >
        Try again
      </Button>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<FallbackProps>;
  onReset?: () => void;
  onError?: (error: Error, info: { componentStack: string }) => void;
}

export const ErrorBoundary = ({
  children,
  fallback = ErrorFallback,
  onReset,
  onError,
}: ErrorBoundaryProps) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={fallback}
      onReset={onReset}
      onError={onError}
    >
      {children}
    </ReactErrorBoundary>
  );
};
