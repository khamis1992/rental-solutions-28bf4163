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
    if (!window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) return;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Case Management</h2>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Case
        </Button>
      </div>
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="Search by customer name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full max-w-xs"
        />
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Loading cases...</span>
        </div>
      ) : error ? (
        <div className="flex items-center bg-red-50 p-4 rounded">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">Error loading cases: {error instanceof Error ? error.message : String(error)}</span>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Legal Cases</CardTitle>
          </CardHeader>
          <CardContent>
            {deleteError && <div className="text-red-600 mb-2">{deleteError}</div>}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-1 text-left">ID</th>
                    <th className="px-2 py-1 text-left">Customer</th>
                    <th className="px-2 py-1 text-left">Type</th>
                    <th className="px-2 py-1 text-left">Status</th>
                    <th className="px-2 py-1 text-left">Priority</th>
                    <th className="px-2 py-1 text-left">Amount Owed</th>
                    <th className="px-2 py-1 text-left">Created</th>
                    <th className="px-2 py-1 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50 cursor-pointer group" onClick={() => { setSelectedCase(c); setShowEditModal(true); }}>
                      <td className="px-2 py-1">{c.id}</td>
                      <td className="px-2 py-1">{c.profiles?.full_name || 'N/A'}</td>
                      <td className="px-2 py-1">{c.case_type}</td>
                      <td className="px-2 py-1">{c.status}</td>
                      <td className="px-2 py-1">{c.priority}</td>
                      <td className="px-2 py-1">
                        {getAgreementId(c) ? (
                          loadingAmounts[getAgreementId(c)] ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            amountsOwed[getAgreementId(c)]?.toLocaleString('en-US', { style: 'currency', currency: 'QAR' }) || 'QAR 0.00'
                          )
                        ) : 'N/A'}
                      </td>
                      <td className="px-2 py-1">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="px-2 py-1" onClick={e => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="mr-1" onClick={() => { setSelectedCase(c); setShowEditModal(true); }} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-red-600" onClick={() => handleDeleteCase(c.id)} title="Delete" disabled={deletingId === c.id}>
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
            <h3 className="text-lg font-semibold mb-4">Add New Case</h3>
            {formError && <div className="text-red-600 mb-2">{formError}</div>}
            <LegalCaseForm onSubmit={handleAddCase} isSubmitting={isSubmitting} />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
      {/* Edit/View Case Modal */}
      {showEditModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Case</h3>
            {formError && <div className="text-red-600 mb-2">{formError}</div>}
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
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setShowEditModal(false); setSelectedCase(null); }} disabled={isSubmitting}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalCaseManagement;
