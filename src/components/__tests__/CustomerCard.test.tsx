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
  Eye: () => <span data-testid="eye-icon">Eye</span>,
  Edit: () => <span data-testid="edit-icon">Edit</span>,
  Trash2: () => <span data-testid="trash-icon">Trash</span>,
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
    const moreButton = screen.getByTestId('more-icon').parentElement;
    fireEvent.click(moreButton!);

    // Then click edit button
    const editButton = screen.getByTestId('edit-icon').parentElement;
    fireEvent.click(editButton!);

    expect(onEdit).toHaveBeenCalledWith(mockCustomer);
  });

  it('should call onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(
      <MockWrapper>
        <CustomerCard customer={mockCustomer} onDelete={onDelete} />
      </MockWrapper>
    );

    // Click the more options button first
    const moreButton = screen.getByTestId('more-icon').parentElement;
    fireEvent.click(moreButton!);

    // Then click delete button
    const deleteButton = screen.getByTestId('trash-icon').parentElement;
    fireEvent.click(deleteButton!);

    expect(onDelete).toHaveBeenCalledWith(mockCustomer);
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