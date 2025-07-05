import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from './button'

describe('Button Component', () => {
  it('يجب أن يعرض النص المرسل إليه', () => {
    render(<Button>اضغط هنا</Button>)
    
    expect(screen.getByText('اضغط هنا')).toBeInTheDocument()
  })

  it('يجب أن يكون clickable بشكل افتراضي', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>اضغط هنا</Button>)
    
    const button = screen.getByText('اضغط هنا')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('يجب أن يكون disabled عندما يُمرر disabled prop', () => {
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>اضغط هنا</Button>)
    
    const button = screen.getByText('اضغط هنا')
    fireEvent.click(button)
    
    expect(button).toBeDisabled()
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('يجب أن يطبق className المناسب للـ variant', () => {
    const { rerender } = render(<Button variant="default">افتراضي</Button>)
    
    expect(screen.getByText('افتراضي')).toHaveClass('bg-primary')
    
    rerender(<Button variant="destructive">حذف</Button>)
    
    expect(screen.getByText('حذف')).toHaveClass('bg-destructive')
  })

  it('يجب أن يطبق className المناسب للـ size', () => {
    const { rerender } = render(<Button size="sm">صغير</Button>)
    
    expect(screen.getByText('صغير')).toHaveClass('h-9')
    
    rerender(<Button size="lg">كبير</Button>)
    
    expect(screen.getByText('كبير')).toHaveClass('h-11')
  })

  it('يجب أن يدعم asChild prop', () => {
    render(
      <Button asChild>
        <a href="/test">رابط</a>
      </Button>
    )
    
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/test')
    expect(link).toHaveTextContent('رابط')
  })

  it('يجب أن يدعم type prop للنماذج', () => {
    render(<Button type="submit">إرسال</Button>)
    
    const button = screen.getByText('إرسال')
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('يجب أن يدعم custom className', () => {
    render(<Button className="custom-class">مخصص</Button>)
    
    const button = screen.getByText('مخصص')
    expect(button).toHaveClass('custom-class')
  })

  it('يجب أن يدعم loading state', () => {
    render(<Button disabled>تحميل...</Button>)
    
    const button = screen.getByText('تحميل...')
    expect(button).toBeDisabled()
  })
}) 