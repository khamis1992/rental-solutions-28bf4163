import { createStyles } from 'react-to-pdf';
import { LegalCase } from '@/types/legal-case';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/date-utils';

export const generateLegalReportStyles = createStyles({
  container: {
    padding: '20px',
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    textAlign: 'center',
  },
  section: {
    marginBottom: '15px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  field: {
    marginBottom: '5px',
  },
  fieldLabel: {
    fontWeight: 'bold',
    marginRight: '5px',
  },
  fieldValue: {
    fontSize: '14px',
  },
  footer: {
    fontSize: '12px',
    color: '#666',
    marginTop: '20px',
    textAlign: 'center',
  },
});

export const generateLegalReportData = async (caseId: string): Promise<LegalCase | null> => {
  try {
    const { data: legalCase, error } = await supabase
      .from('legal_cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (error) {
      console.error("Error fetching legal case:", error);
      return null;
    }

    if (!legalCase) {
      console.warn("Legal case not found with ID:", caseId);
      return null;
    }

    return {
      ...legalCase,
      created_at: formatDate(legalCase.created_at),
      updated_at: formatDate(legalCase.updated_at),
      hearing_date: formatDate(legalCase.hearing_date),
    } as LegalCase;
  } catch (error) {
    console.error("Unexpected error generating legal report data:", error);
    return null;
  }
};
