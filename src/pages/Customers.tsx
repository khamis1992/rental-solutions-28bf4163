
import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { CustomerList } from '@/components/customers/CustomerList';
import { ImportHistoryList } from '@/components/customers/ImportHistoryList';
import { CSVImportModal } from '@/components/customers/CSVImportModal';
import { Button } from '@/components/ui/button';
import { FileUp, AlertTriangle, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { checkEdgeFunctionAvailability } from '@/utils/service-availability';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';

const Customers = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEdgeFunctionAvailable, setIsEdgeFunctionAvailable] = useState(true);
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();
  
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await checkEdgeFunctionAvailability('process-customer-imports', 2);
      setIsEdgeFunctionAvailable(available);
    };
    
    checkAvailability();
  }, []);

  return (
    <PageContainer 
      title={t('common.customers')} 
      description={t('customers.description')}
      actions={
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2"
            disabled={!isEdgeFunctionAvailable}
          >
            {!isEdgeFunctionAvailable && (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            )}
            <FileUp className="h-4 w-4" />
            {t('customers.importCSV')}
          </Button>
          <Button asChild>
            <Link to="/customers/add">
              <UserPlus className="h-4 w-4 mr-2" />
              {t('customers.addCustomer')}
            </Link>
          </Button>
        </div>
      }
    >
      <CustomerList />
      <div className="mt-8">
        <ImportHistoryList />
      </div>
      
      <CSVImportModal 
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImportComplete={() => {
          // Refresh the customer list
        }}
      />
    </PageContainer>
  );
};

export default Customers;
