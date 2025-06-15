import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomerInfo } from '@/types/customer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  User, 
  Calendar, 
  Mail, 
  Phone,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCustomerService } from '@/hooks/services/useCustomerService';
import { toast } from "sonner";

interface CustomerDataGridProps {
  customers: CustomerInfo[];
  isLoading: boolean;
  onCustomerSelect?: (customer: CustomerInfo) => void;
}

export const CustomerDataGrid: React.FC<CustomerDataGridProps> = ({ 
  customers, 
  isLoading,
  onCustomerSelect
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const { deleteCustomer } = useCustomerService();

  const totalPages = Math.ceil((customers?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentCustomers = Array.isArray(customers) ? customers.slice(startIndex, endIndex) : [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Arabic date formatting function
  const formatArabicDate = (dateString: string) => {
    if (!dateString) return 'غير محدد';
    
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      calendar: 'gregory' // ميلادي format
    };
    
    return date.toLocaleDateString('ar-SA', options);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: any, label: string }> = {
      active: { icon: CheckCircle, label: "نشط" },
      inactive: { icon: XCircle, label: "غير نشط" },
      blacklisted: { icon: XCircle, label: "محظور" },
      pending_review: { icon: AlertTriangle, label: "قيد المراجعة" },
      pending_payment: { icon: Clock, label: "في انتظار الدفع" },
    };
    const { icon: Icon, label } = statusConfig[status] || statusConfig.active;

    return (
      <div className="flex items-center gap-2 justify-center" dir="rtl">
        <div className="flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Icon className="h-3 w-3" aria-hidden="true" />
          <span>{label}</span>
        </div>
      </div>
    );
  };

  const handleDeleteCustomer = (e: React.MouseEvent, customer: CustomerInfo) => {
    e.stopPropagation();
    
    toast.warning(
      "حذف العميل",
      {
        description: `هل أنت متأكد من حذف ${customer.full_name}؟`,
        action: {
          label: "حذف",
          onClick: () => deleteCustomer(customer.id)
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-md border" dir="rtl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">الإجراءات</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead className="text-center">تاريخ الإضافة</TableHead>
              <TableHead className="text-center">الجوال</TableHead>
              <TableHead className="text-center">اسم العميل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`} className="hover:bg-muted/50">
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-5 w-[100px] mx-auto" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-4 w-[100px] mx-auto" />
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Skeleton className="h-3 w-[120px]" />
                    <Skeleton className="h-3 w-[160px]" />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <Skeleton className="h-4 w-[140px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!Array.isArray(customers) || customers.length === 0) {
    return (
      <div className="rounded-md border p-8 flex flex-col items-center justify-center" dir="rtl">
        <User className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
        <h3 className="font-medium text-lg">لا توجد عملاء</h3>
        <p className="text-muted-foreground text-sm mb-4">جرب تعديل مرشحات البحث أو أضف عميلاً جديداً.</p>
        <Button asChild>
          <Link to="/customers/add">إضافة عميل</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">الإجراءات</TableHead>
              <TableHead className="text-center">الحالة</TableHead>
              <TableHead className="text-center">تاريخ الإضافة</TableHead>
              <TableHead className="text-center">الجوال</TableHead>
              <TableHead className="text-center">اسم العميل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentCustomers.map((customer) => (
              <TableRow 
                key={customer.id} 
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => onCustomerSelect?.(customer)}
              >
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">فتح القائمة</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[160px]">
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
                          onClick={(e) => handleDeleteCustomer(e, customer)}
                        >
                          حذف العميل
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    {getStatusBadge(customer.status)}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm">
                      {formatArabicDate(customer.created_at)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center text-sm gap-1">
                    <div className="flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span>{customer.phone_number}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span className="text-xs text-muted-foreground">{customer.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-center">
                      <div className="font-medium">{customer.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        ID: {customer.id.substring(0, 8)}
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {customer.full_name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {customers.length > ITEMS_PER_PAGE && (
        <div className="flex justify-between items-center pt-4" dir="rtl">
          <p className="text-sm text-muted-foreground">
            عرض {startIndex + 1} إلى {Math.min(endIndex, customers.length)} من {customers.length} عميل
          </p>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronRight className="h-4 w-4 ml-1" />
              السابق
            </Button>
            <div className="text-sm">
              صفحة {currentPage} من {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              التالي
              <ChevronLeft className="h-4 w-4 mr-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDataGrid;