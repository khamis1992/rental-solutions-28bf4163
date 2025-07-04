import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DocumentUpload from '@/components/documents/DocumentUpload';

describe('File Upload Edge Cases', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should reject files that are too large', async () => {
    const onComplete = vi.fn();
    
    renderWithProviders(
      <DocumentUpload 
        onComplete={onComplete}
      />
    );

    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf'
    });

    const input = screen.getByLabelText(/رفع ملف/);
    fireEvent.change(input, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/الملف كبير جداً/)).toBeInTheDocument();
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('should reject unsupported file types', async () => {
    const onComplete = vi.fn();
    
    renderWithProviders(
      <DocumentUpload 
        onComplete={onComplete}
      />
    );

    const unsupportedFile = new File(['content'], 'document.txt', {
      type: 'text/plain'
    });

    const input = screen.getByLabelText(/رفع ملف/);
    fireEvent.change(input, { target: { files: [unsupportedFile] } });

    await waitFor(() => {
      expect(screen.getByText(/نوع الملف غير مدعوم/)).toBeInTheDocument();
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('should handle corrupted files gracefully', async () => {
    const onComplete = vi.fn();
    
    renderWithProviders(<DocumentUpload onComplete={onComplete} />);

    const corruptedFile = new File([new ArrayBuffer(0)], 'corrupted.pdf', {
      type: 'application/pdf'
    });

    const input = screen.getByLabelText(/رفع ملف/);
    fireEvent.change(input, { target: { files: [corruptedFile] } });

    await waitFor(() => {
      expect(screen.getByText(/الملف تالف أو فارغ/)).toBeInTheDocument();
    });
  });

  it('should handle network errors during upload', async () => {
    const onComplete = vi.fn();
    
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    
    renderWithProviders(<DocumentUpload onComplete={onComplete} />);

    const validFile = new File(['content'], 'document.pdf', {
      type: 'application/pdf'
    });

    const input = screen.getByLabelText(/رفع ملف/);
    fireEvent.change(input, { target: { files: [validFile] } });

    const uploadButton = screen.getByRole('button', { name: /رفع/ });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/فشل في رفع الملف/)).toBeInTheDocument();
    });
  });

  it('should handle multiple file uploads with mixed success/failure', async () => {
    const onComplete = vi.fn();
    
    renderWithProviders(
      <DocumentUpload 
        onComplete={onComplete}
      />
    );

    const validFile = new File(['content'], 'valid.pdf', {
      type: 'application/pdf'
    });

    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf'
    });

    const input = screen.getByLabelText(/رفع ملف/);
    fireEvent.change(input, { target: { files: [validFile, largeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/تم رفع ملف واحد بنجاح/)).toBeInTheDocument();
      expect(screen.getByText(/فشل في رفع ملف واحد/)).toBeInTheDocument();
    });
  });

  it('should show upload progress for large files', async () => {
    const onComplete = vi.fn();
    
    const mockXHR = {
      open: vi.fn(),
      send: vi.fn(),
      upload: {
        addEventListener: vi.fn((event, callback) => {
          if (event === 'progress') {
            setTimeout(() => callback({ loaded: 50, total: 100 }), 100);
            setTimeout(() => callback({ loaded: 100, total: 100 }), 200);
          }
        })
      },
      addEventListener: vi.fn(),
      setRequestHeader: vi.fn()
    };

    global.XMLHttpRequest = vi.fn(() => mockXHR) as any;
    
    renderWithProviders(<DocumentUpload onComplete={onComplete} />);

    const file = new File(['content'], 'document.pdf', {
      type: 'application/pdf'
    });

    const input = screen.getByLabelText(/رفع ملف/);
    fireEvent.change(input, { target: { files: [file] } });

    const uploadButton = screen.getByRole('button', { name: /رفع/ });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });
  });
});
