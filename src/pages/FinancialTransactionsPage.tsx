import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/ui/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import FinancialTransactions from '@/components/financials/FinancialTransactions';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Plus } from 'lucide-react';
import { toast } from 'sonner';

const FinancialTransactionsPage = () => {
  const { language } = useLanguage();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    type: '',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'completed'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTransactionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setTransactionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTransaction = () => {
    setShowAddTransaction(true);
  };

  const handleSubmitTransaction = async () => {
    try {
      // Validate form
      if (!transactionForm.type || !transactionForm.category || !transactionForm.amount || !transactionForm.description) {
        toast.error(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
        return;
      }

      // Here you would typically call an API to create the transaction
      console.log('Creating transaction:', transactionForm);
      
      toast.success(language === 'ar' ? 'تم إضافة المعاملة بنجاح' : 'Transaction added successfully');
      
      // Reset form and close dialog
      setTransactionForm({
        type: '',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        status: 'completed'
      });
      setShowAddTransaction(false);
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error(language === 'ar' ? 'فشل في إضافة المعاملة' : 'Failed to add transaction');
    }
  };

  const handleEditTransaction = (transactionId: string) => {
    console.log('Edit transaction:', transactionId);
    toast.info(language === 'ar' ? 'ميزة التعديل قيد التطوير' : 'Edit feature coming soon');
  };

  const handleDeleteTransaction = (transactionId: string) => {
    console.log('Delete transaction:', transactionId);
    toast.info(language === 'ar' ? 'ميزة الحذف قيد التطوير' : 'Delete feature coming soon');
  };

  return (
    <>
      <PageContainer>
        <PageHeader
          title={language === 'ar' ? "المعاملات المالية" : "Financial Transactions"}
          subtitle={language === 'ar' ? "إدارة المعاملات المالية والدفعات" : "Manage financial transactions and payments"}
          icon={<DollarSign className="w-6 h-6 text-green-500" />}
          align={language === 'ar' ? 'right' : 'left'}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        />
        
        <div className="space-y-6">
          <FinancialTransactions
            transactions={[]}
            isLoading={false}
            filters={{
              transactionType: '',
              category: '',
              dateFrom: '',
              dateTo: '',
              searchQuery: ''
            }}
            setFilters={() => {}}
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        </div>
      </PageContainer>

      {/* Add Transaction Dialog */}
      <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle className={language === 'ar' ? 'text-right' : 'text-left'} dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {language === 'ar' ? 'إضافة معاملة جديدة' : 'Add New Transaction'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'نوع المعاملة *' : 'Transaction Type *'}
                </Label>
                <Select value={transactionForm.type} onValueChange={(value) => handleSelectChange('type', value)}>
                  <SelectTrigger dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <SelectValue placeholder={language === 'ar' ? 'اختر النوع' : 'Select Type'} />
                  </SelectTrigger>
                  <SelectContent align={language === 'ar' ? 'start' : 'end'}>
                    <SelectItem value="income">{language === 'ar' ? 'دخل' : 'Income'}</SelectItem>
                    <SelectItem value="expense">{language === 'ar' ? 'مصروف' : 'Expense'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'الفئة *' : 'Category *'}
                </Label>
                <Select value={transactionForm.category} onValueChange={(value) => handleSelectChange('category', value)}>
                  <SelectTrigger dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <SelectValue placeholder={language === 'ar' ? 'اختر الفئة' : 'Select Category'} />
                  </SelectTrigger>
                  <SelectContent align={language === 'ar' ? 'start' : 'end'}>
                    <SelectItem value="Rental">{language === 'ar' ? 'إيجار' : 'Rental'}</SelectItem>
                    <SelectItem value="Maintenance">{language === 'ar' ? 'صيانة' : 'Maintenance'}</SelectItem>
                    <SelectItem value="Insurance">{language === 'ar' ? 'تأمين' : 'Insurance'}</SelectItem>
                    <SelectItem value="Fuel">{language === 'ar' ? 'وقود' : 'Fuel'}</SelectItem>
                    <SelectItem value="Other">{language === 'ar' ? 'أخرى' : 'Other'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'المبلغ (ريال) *' : 'Amount (QAR) *'}
                </Label>
                <Input
                  name="amount"
                  type="number"
                  value={transactionForm.amount}
                  onChange={handleInputChange}
                  placeholder="0"
                  className={language === 'ar' ? 'text-right' : 'text-left'}
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-2">
                <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                  {language === 'ar' ? 'التاريخ *' : 'Date *'}
                </Label>
                <Input
                  name="date"
                  type="date"
                  value={transactionForm.date}
                  onChange={handleInputChange}
                  className={language === 'ar' ? 'text-right' : 'text-left'}
                  dir="ltr"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'الوصف *' : 'Description *'}
              </Label>
              <Textarea
                name="description"
                value={transactionForm.description}
                onChange={handleInputChange}
                placeholder={language === 'ar' ? 'أدخل وصف المعاملة' : 'Enter transaction description'}
                className={language === 'ar' ? 'text-right' : 'text-left'}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label className={language === 'ar' ? 'text-right' : 'text-left'}>
                {language === 'ar' ? 'الحالة' : 'Status'}
              </Label>
              <Select value={transactionForm.status} onValueChange={(value) => handleSelectChange('status', value)}>
                <SelectTrigger dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align={language === 'ar' ? 'start' : 'end'}>
                  <SelectItem value="completed">{language === 'ar' ? 'مكتملة' : 'Completed'}</SelectItem>
                  <SelectItem value="pending">{language === 'ar' ? 'معلقة' : 'Pending'}</SelectItem>
                  <SelectItem value="cancelled">{language === 'ar' ? 'ملغاة' : 'Cancelled'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className={`flex gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Button variant="outline" onClick={() => setShowAddTransaction(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSubmitTransaction} className="bg-green-600 hover:bg-green-700">
              {language === 'ar' ? 'إضافة المعاملة' : 'Add Transaction'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FinancialTransactionsPage; 