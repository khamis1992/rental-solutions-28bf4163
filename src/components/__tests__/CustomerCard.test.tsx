import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CustomerCard } from '@/components/customers/CustomerCard';
import { createMockCustomer } from '@/__tests__/setup';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Phone: () => <span data-testid="phone-icon">Phone</span>,
  Mail: () => <span data-testid="mail-icon">Mail</span>,
  User: () => <span data-testid="user-icon">User</span>,
  MoreHorizontal: () => <span data-testid="more-icon">More</span>,
  MoreVertical: () => <span data-testid="more-vertical-icon">More</span>,
  Eye: () => <span data-testid="eye-icon">Eye</span>,
  Edit: () => <span data-testid="edit-icon">Edit</span>,
  Trash2: () => <span data-testid="trash-icon">Trash</span>,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, onClick }: { children: React.ReactNode, onClick?: (e: any) => void }) => (
    <div onClick={onClick}>{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, asChild }: { children: React.ReactNode, onClick?: (e: any) => void, asChild?: boolean }) => (
    asChild ? <div>{children}</div> : <div onClick={onClick}>{children}</div>
  ),
}));

const MockWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('CustomerCard Component', () => {
  const mockCustomer = createMockCustomer();

  it('should render customer information correctly', () => {
    render(
      <MockWrapper>
        <CustomerCard customer={mockCustomer} />
      </MockWrapper>
    );

    expect(screen.getByText('عميل تجريبي')).toBeInTheDocument();
    expect(screen.getByText('+97450000000')).toBeInTheDocument();
    expect(screen.getByText('DL123456')).toBeInTheDocument();
  });

  it('should display customer status badge', () => {
    render(
      <MockWrapper>
        <CustomerCard customer={mockCustomer} />
      </MockWrapper>
    );

    expect(screen.getByText('نشط')).toBeInTheDocument();
  });

  it('should show phone and email action buttons', () => {
    render(
      <MockWrapper>
        <CustomerCard customer={mockCustomer} />
      </MockWrapper>
    );

    expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(
      <MockWrapper>
        <CustomerCard customer={mockCustomer} onEdit={onEdit} />
      </MockWrapper>
    );

    // Click the more options button first
    const moreButton = screen.getByTestId('more-vertical-icon').parentElement;
    fireEvent.click(moreButton!);

    // Then click edit menu item by text
    const editMenuItem = screen.getByText('تعديل العميل');
    fireEvent.click(editMenuItem);

    expect(onEdit).toHaveBeenCalledWith(mockCustomer);
  });

  it('should call onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    render(
      <MockWrapper>
        <CustomerCard customer={mockCustomer} onDelete={onDelete} />
      </MockWrapper>
    );

    // Click the more options button first
    const moreButton = screen.getByTestId('more-vertical-icon').parentElement;
    fireEvent.click(moreButton!);

    // Then click delete menu item by text
    const deleteMenuItem = screen.getByText('حذف العميل');
    fireEvent.click(deleteMenuItem);

    expect(confirmSpy).toHaveBeenCalledWith(`هل أنت متأكد من حذف ${mockCustomer.full_name}؟`);
    expect(onDelete).toHaveBeenCalledWith(mockCustomer.id);
    
    confirmSpy.mockRestore();
  });

  it('should handle customer with different status', () => {
    const inactiveCustomer = createMockCustomer({ status: 'غير نشط' });
    render(
      <MockWrapper>
        <CustomerCard customer={inactiveCustomer} />
      </MockWrapper>
    );

    expect(screen.getByText('غير نشط')).toBeInTheDocument();
  });

  it('should handle customer without email', () => {
    const customerWithoutEmail = createMockCustomer({ email: null });
    render(
      <MockWrapper>
        <CustomerCard customer={customerWithoutEmail} />
      </MockWrapper>
    );

    expect(screen.getByText('عميل تجريبي')).toBeInTheDocument();
  });
});          