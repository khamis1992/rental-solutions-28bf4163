
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useCustomerService } from '@/hooks/services/useCustomerService';
import { Skeleton } from '@/components/ui/skeleton';
import { Customer } from '@/lib/validation-schemas/customer';
import { CustomerStatus } from '@/types/customer.types';

interface CustomerListProps {
  searchParams: {
    query: string;
    status: string;
  };
}

const ITEMS_PER_PAGE = 10;

export function CustomerList({ searchParams }: CustomerListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Use the useCustomerService hook with search filters
  const {
    customers,
    isLoading,
    error,
    deleteCustomer
  } = useCustomerService({
    filters: {
      status: searchParams.status !== 'all' ? searchParams.status as CustomerStatus : undefined,
      search: searchParams.query || undefined
    }
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      active: { variant: "default", icon: CheckCircle },
      inactive: { variant: "secondary", icon: XCircle },
      blacklisted: { variant: "destructive", icon: XCircle },
      pending_review: { variant: "outline", icon: AlertTriangle },
      pending_payment: { variant: "outline", icon: AlertTriangle },
    };

    const { variant, icon: Icon } = variants[status] || variants.active;
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  // Calculate pagination
  const totalPages = Math.ceil((customers?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentCustomers = customers?.slice(startIndex, endIndex) || [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
        <h3 className="font-semibold mb-2">Error loading customers</h3>
        <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الإجراءات</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الإضافة</TableHead>
              <TableHead>الجوال</TableHead>
              <TableHead className="text-right">اسم العميل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton className="h-6 w-[50px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[200px]" /></TableCell>
                </TableRow>
              ))
            ) : currentCustomers.length ? (
              currentCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-muted/50">
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">فتح القائمة</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[160px] text-right">
                        <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={`/customers/${customer.id}`}>عرض التفاصيل</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/customers/edit/${customer.id}`}>تعديل العميل</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من حذف ${customer.full_name}؟`)) {
                              deleteCustomer(customer.id!);
                            }
                          }}
                        >
                          حذف العميل
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>{getStatusBadge(customer.status)}</TableCell>
                  <TableCell>{customer.created_at && customer.created_at.trim() !== '' ? new Date(customer.created_at).toLocaleDateString('ar-QA') : 'غير متوفر'}</TableCell>
                  <TableCell><span className="phone-number-ltr" dir="ltr">{customer.phone_number || customer.phone || 'غير متوفر'}</span></TableCell>
                  <TableCell className="font-medium text-right">
                    <Link 
                      to={`/customers/${customer.id}`}
                      className="text-primary hover:underline"
                    >
                      {customer.full_name}
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  لا يوجد عملاء. {searchParams?.query || searchParams?.status !== 'all' 
                    ? 'جرّب تعديل الفلاتر.' 
                    : 'أضف أول عميل باستخدام الزر أعلاه.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {customers && customers.length > ITEMS_PER_PAGE && (
        <div className="flex justify-center items-center space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
