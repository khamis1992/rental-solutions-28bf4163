import React, { useState, useMemo, useEffect } from 'react';
import { useLegalCases, calculateAgreementAmountOwed } from '@/hooks/legal/useLegalCases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import LegalCaseForm, { LegalCaseFormValues } from './form/LegalCaseForm';
import { LegalCaseType, CasePriority, LegalCaseStatus } from '@/types/legal-case';
import type { LegalCase } from '@/types/legal-case';

// If LegalCase type is imported from '@/types/legal-case', extend it to include agreement_id if missing
// type LegalCaseWithAgreement = LegalCase & { agreement_id?: string };

// Helper to get agreement ID from a case (supports both agreement_id and lease_id)
const getAgreementId = (c: any) => c.agreement_id || c.lease_id;

const LegalCaseManagement: React.FC = () => {
  const { legalCases, isLoading, error, createLegalCase, updateLegalCase, deleteLegalCase } = useLegalCases();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [amountsOwed, setAmountsOwed] = useState<{ [agreementId: string]: number }>({});
  const [loadingAmounts, setLoadingAmounts] = useState<{ [agreementId: string]: boolean }>({});

  // Filter cases by customer name
  const filteredCases = useMemo(() => {
    if (!search) return legalCases;
    return legalCases.filter(c =>
      (c.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [legalCases, search]);

  useEffect(() => {
    const fetchAmounts = async () => {
      const newAmounts: { [agreementId: string]: number } = {};
      const newLoading: { [agreementId: string]: boolean } = {};
      const promises = filteredCases.map(async (c) => {
        const agreementId = getAgreementId(c);
        if (!agreementId) return;
        newLoading[agreementId] = true;
        const amount = await calculateAgreementAmountOwed(agreementId);
        newAmounts[agreementId] = amount;
        newLoading[agreementId] = false;
      });
      setLoadingAmounts({ ...loadingAmounts, ...newLoading });
      await Promise.all(promises);
      setAmountsOwed((prev) => ({ ...prev, ...newAmounts }));
      setLoadingAmounts((prev) => ({ ...prev, ...newLoading }));
    };
    fetchAmounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCases.map(c => getAgreementId(c)).join(",")]);

  const handleAddCase = async (data: LegalCaseFormValues) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      await createLegalCase(data as any);
      setShowAddModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCase = async (data: LegalCaseFormValues) => {
    if (!selectedCase) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      await updateLegalCase({
        id: selectedCase.id,
        ...data,
        case_type: data.case_type as LegalCaseType,
        priority: data.priority as CasePriority,
        status: data.status as LegalCaseStatus | null,
      });
      setShowEditModal(false);
      setSelectedCase(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCase = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه القضية؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    setDeletingId(id);
    setDeleteError(null);
    try {
      await deleteLegalCase(id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingId(null);
    }
  };

  // Helper functions to translate status and priority
  const getStatusInArabic = (status: string | null) => {
    if (!status) return 'غير محدد';
    switch (status.toLowerCase()) {
      case 'active':
        return 'نشطة';
      case 'pending':
        return 'معلقة';
      case 'resolved':
        return 'محلولة';
      case 'closed':
        return 'مغلقة';
      case 'escalated':
        return 'مصعدة';
      default:
        return status;
    }
  };

  const getPriorityInArabic = (priority: string | null) => {
    if (!priority) return 'غير محدد';
    switch (priority.toLowerCase()) {
      case 'high':
        return 'عالية';
      case 'medium':
        return 'متوسطة';
      case 'low':
        return 'منخفضة';
      case 'critical':
        return 'حرجة';
      default:
        return priority;
    }
  };

  const getCaseTypeInArabic = (caseType: string) => {
    switch (caseType) {
      case 'payment_default':
        return 'تخلف عن الدفع';
      case 'contract_breach':
        return 'انتهاك العقد';
      case 'vehicle_damage':
        return 'ضرر المركبة';
      case 'traffic_violations':
        return 'مخالفات مرورية';
      case 'insurance_dispute':
        return 'نزاع التأمين';
      default:
        return caseType || 'غير محدد';
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-right">إدارة القضايا</h2>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 ml-2" /> قضية جديدة
        </Button>
      </div>
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="البحث باسم العميل..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full max-w-xs text-right"
          dir="rtl"
        />
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary ml-2" />
          <span className="text-muted-foreground">جاري تحميل القضايا...</span>
        </div>
      ) : error ? (
        <div className="flex items-center bg-red-50 p-4 rounded">
          <AlertTriangle className="h-5 w-5 text-red-500 ml-2" />
          <span className="text-red-700">خطأ في تحميل القضايا: {error instanceof Error ? error.message : String(error)}</span>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-right">جميع القضايا القانونية</CardTitle>
          </CardHeader>
          <CardContent>
            {deleteError && <div className="text-red-600 mb-2 text-right">{deleteError}</div>}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm" dir="rtl">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-1 text-right">العميل</th>
                    <th className="px-2 py-1 text-right">النوع</th>
                    <th className="px-2 py-1 text-right">الحالة</th>
                    <th className="px-2 py-1 text-right">الأولوية</th>
                    <th className="px-2 py-1 text-right">المبلغ المستحق</th>
                    <th className="px-2 py-1 text-right">تاريخ الإنشاء</th>
                    <th className="px-2 py-1 text-right">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50 cursor-pointer group" onClick={() => { setSelectedCase(c); setShowEditModal(true); }}>
                      <td className="px-2 py-1 text-right">{c.profiles?.full_name || 'غير متوفر'}</td>
                      <td className="px-2 py-1 text-right">{getCaseTypeInArabic(c.case_type)}</td>
                      <td className="px-2 py-1 text-right">{getStatusInArabic(c.status)}</td>
                      <td className="px-2 py-1 text-right">{getPriorityInArabic(c.priority)}</td>
                      <td className="px-2 py-1 text-right">
                        {getAgreementId(c) ? (
                          loadingAmounts[getAgreementId(c)] ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            amountsOwed[getAgreementId(c)]?.toLocaleString('ar-QA', { style: 'currency', currency: 'QAR' }) || 'ر.ق 0.00'
                          )
                        ) : 'غير متوفر'}
                      </td>
                      <td className="px-2 py-1 text-right">{new Date(c.created_at).toLocaleDateString('ar-QA')}</td>
                      <td className="px-2 py-1 text-right" onClick={e => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="ml-1" onClick={() => { setSelectedCase(c); setShowEditModal(true); }} title="تعديل">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-red-600" onClick={() => handleDeleteCase(c.id)} title="حذف" disabled={deletingId === c.id}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Add Case Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-right">إضافة قضية جديدة</h3>
            {formError && <div className="text-red-600 mb-2 text-right">{formError}</div>}
            <LegalCaseForm onSubmit={handleAddCase} isSubmitting={isSubmitting} />
            <div className="flex justify-end gap-2 mt-4 flex-row-reverse">
              <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>إلغاء</Button>
            </div>
          </div>
        </div>
      )}
      {/* Edit/View Case Modal */}
      {showEditModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-right">تعديل القضية</h3>
            {formError && <div className="text-red-600 mb-2 text-right">{formError}</div>}
            <LegalCaseForm
              initialData={{
                status: selectedCase.status,
                customer_id: selectedCase.customer_id,
                description: selectedCase.description,
                amount_owed: selectedCase.amount_owed,
                case_type: selectedCase.case_type,
                priority: selectedCase.priority,
              }}
              onSubmit={handleEditCase}
              isSubmitting={isSubmitting}
              isEdit
            />
            <div className="flex justify-end gap-2 mt-4 flex-row-reverse">
              <Button variant="outline" onClick={() => { setShowEditModal(false); setSelectedCase(null); }} disabled={isSubmitting}>إلغاء</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalCaseManagement;
