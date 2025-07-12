import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  const handleGoHome = () => {
    try {
      // استخدام window.location بدلاً من useNavigate لتجنب مشاكل Router context
      window.location.href = '/';
    } catch (err) {
      // fallback: إعادة تحميل الصفحة
      window.location.reload();
    }
  };

  const handleReload = () => {
    try {
      resetErrorBoundary();
    } catch (err) {
      // fallback: إعادة تحميل الصفحة
      window.location.reload();
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-6" dir="rtl">
      <div className="w-full max-w-md space-y-4">
        <Alert variant="destructive">
          <AlertTitle className="text-right">حدث خطأ غير متوقع</AlertTitle>
          <AlertDescription className="mt-2 text-right">
            <p className="mb-4">نعتذر، لقد حدث خطأ غير متوقع:</p>
            <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-[200px] text-left" dir="ltr">
              {error.message}
            </pre>
          </AlertDescription>
        </Alert>
        
        <div className="flex space-x-2 gap-2">
          <Button 
            onClick={handleReload} 
            variant="outline" 
            className="flex-1"
          >
            <RefreshCcw className="ml-2 h-4 w-4" />
            حاول مرة أخرى
          </Button>
          <Button 
            onClick={handleGoHome} 
            className="flex-1"
          >
            <Home className="ml-2 h-4 w-4" />
            العودة للرئيسية
          </Button>
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>إذا استمر الخطأ، يرجى إعادة تحميل الصفحة</p>
        </div>
      </div>
    </div>
  );
};

class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <ErrorFallback 
          error={this.state.error!} 
          resetErrorBoundary={this.resetErrorBoundary} 
        />
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = (props: ErrorBoundaryProps) => {
  return <ErrorBoundaryClass {...props} />;
};
