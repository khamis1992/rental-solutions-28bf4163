import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>اختبار الزر</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('اختبار الزر')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>انقر هنا</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>زر معطل</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should have correct variant class', () => {
    render(<Button variant="destructive">زر حذف</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('should have correct size class', () => {
    render(<Button size="lg">زر كبير</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-11');
  });

  it('should show loading state', () => {
    render(<Button disabled>جاري التحميل...</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should support Arabic text properly', () => {
    render(<Button>إضافة عميل جديد</Button>);
    expect(screen.getByText('إضافة عميل جديد')).toBeInTheDocument();
  });
}); 