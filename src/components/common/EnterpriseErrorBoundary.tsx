import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { enterpriseLogger } from '@/utils/enterprise-logger';
import { errorRecoveryService } from '@/utils/error-recovery';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  isRecovering?: boolean;
}

export class EnterpriseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.generateErrorId();
    
    enterpriseLogger.error(error.message, {
      context: 'EnterpriseErrorBoundary',
      errorInfo,
      errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      stack: error.stack
    });

    this.setState({ 
      error, 
      errorInfo, 
      errorId 
    });

    this.props.onError?.(error, errorInfo);
    this.attemptRecovery(error);
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async attemptRecovery(error: Error): Promise<void> {
    this.setState({ isRecovering: true });
    
    try {
      const recovered = await errorRecoveryService.attemptRecovery(error);
      if (recovered) {
        this.setState({ 
          hasError: false, 
          error: undefined, 
          errorInfo: undefined,
          errorId: undefined,
          isRecovering: false 
        });
      } else {
        this.setState({ isRecovering: false });
      }
    } catch (recoveryError) {
      enterpriseLogger.error('Error recovery failed', {
        originalError: error.message,
        recoveryError: (recoveryError as Error).message
      });
      this.setState({ isRecovering: false });
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined,
      isRecovering: false 
    });
  };

  handleReportError = () => {
    if (this.state.errorId) {
      window.open(`/support?error_id=${this.state.errorId}`, '_blank');
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (this.state.isRecovering) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>جاري محاولة استعادة النظام...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl">حدث خطأ غير متوقع</CardTitle>
              <CardDescription>
                نعتذر، حدث خطأ في التطبيق. تم تسجيل الخطأ وسيتم إصلاحه قريباً.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.errorId && (
                <Alert>
                  <Bug className="h-4 w-4" />
                  <AlertDescription>
                    معرف الخطأ: <code className="font-mono text-sm">{this.state.errorId}</code>
                  </AlertDescription>
                </Alert>
              )}

              {(import.meta.env.DEV || this.props.showDetails) && this.state.error && (
                <div className="rounded-md bg-red-50 p-3 border border-red-200">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    تفاصيل الخطأ (للمطورين):
                  </p>
                  <p className="text-sm text-red-700 mb-2">
                    {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <details className="text-xs text-red-600">
                      <summary className="cursor-pointer font-medium mb-1">
                        Stack Trace
                      </summary>
                      <pre className="overflow-auto max-h-32 bg-red-100 p-2 rounded">
                        {this.state.error.stack}
                      </pre>
                      <pre className="overflow-auto max-h-32 bg-red-100 p-2 rounded mt-2">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReset} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  إعادة المحاولة
                </Button>
                {this.state.errorId && (
                  <Button 
                    variant="outline" 
                    onClick={this.handleReportError}
                    className="flex-1"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    الإبلاغ عن الخطأ
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
