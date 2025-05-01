
# Error Handling Guide

This document outlines the centralized error handling system implemented in the application.

## Core Components

### 1. ErrorContext

The `ErrorContext` provides a global state for errors and methods to manage them:

```tsx
import { useError } from '@/contexts/ErrorContext';

function MyComponent() {
  const { addError, removeError, clearErrors, errors } = useError();
  
  const handleClick = () => {
    addError({
      message: 'Something went wrong',
      severity: 'error',
      category: 'api',
      source: 'MyComponent',
    });
  };
  
  return <button onClick={handleClick}>Trigger Error</button>;
}
```

### 2. ErrorService

The `ErrorService` provides specialized error handling methods:

```tsx
import errorService from '@/services/error/ErrorService';

try {
  // Do something risky
} catch (error) {
  errorService.handleApiError(error, 'MyComponent');
}
```

### 3. Error API

The unified error API simplifies common error handling operations:

```tsx
import { handleApiError, handleValidationError } from '@/lib/api/error-api';

// Handle API error
handleApiError(error, 'Failed to fetch user data');

// Handle validation error
handleValidationError({
  username: ['Username is required'],
  password: ['Password must be at least 8 characters']
});
```

### 4. ErrorBoundary

Use ErrorBoundary components to gracefully handle React rendering errors:

```tsx
import ErrorBoundary from '@/components/error/ErrorBoundary';
import SectionErrorBoundary from '@/components/error/SectionErrorBoundary';

// Root level error boundary
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Section specific error boundary
<SectionErrorBoundary title="User Dashboard">
  <UserDashboard />
</SectionErrorBoundary>
```

## Best Practices

1. **Use the Correct Error Type**
   - Use `addError` with severity 'info' for informational messages
   - Use `addError` with severity 'warning' for non-critical issues
   - Use `addError` with severity 'error' for critical issues

2. **Provide Context**
   - Always include a source in your error to identify where it originated
   - Use the context parameter in API error handlers

3. **Error Boundaries**
   - Place ErrorBoundaries strategically to prevent entire app crashes
   - Use SectionErrorBoundary for critical UI sections

4. **API Calls**
   - Use the useApiQuery and useApiMutation hooks which have error handling built in
   - Provide errorContext to help identify the source of API errors

5. **Error Telemetry**
   - For important flows, consider using the useErrorTelemetry hook
   - Configure what level of information is sent to monitoring services

## Migration Guide

If you have existing code with error handling, migrate it using these steps:

1. Replace direct toast calls with error API:
   ```tsx
   // Before
   toast.error('Failed to fetch data');
   
   // After
   handleApiError(new Error('Failed to fetch data'));
   ```

2. Replace try/catch blocks:
   ```tsx
   // Before
   try {
     await fetchData();
   } catch (error) {
     console.error(error);
     toast.error('Something went wrong');
   }
   
   // After
   try {
     await fetchData();
   } catch (error) {
     handleApiError(error, 'Failed to fetch data');
   }
   ```

3. Wrap components with ErrorBoundary:
   ```tsx
   <SectionErrorBoundary title="Dashboard Stats">
     <DashboardStats />
   </SectionErrorBoundary>
   ```

## Testing Error Handling

Use the ErrorDemo component to test and demonstrate the error handling system:

```tsx
import ErrorDemo from '@/components/error/ErrorDemo';

function TestPage() {
  return <ErrorDemo />;
}
```
