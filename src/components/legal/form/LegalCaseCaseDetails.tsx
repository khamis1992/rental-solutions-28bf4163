
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LegalCaseFormValues, LegalCaseCaseDetailsProps } from './LegalCaseForm';

export const LegalCaseCaseDetails: React.FC<LegalCaseCaseDetailsProps> = ({ 
  form, 
  caseTypes, 
  casePriorities, 
  caseStatuses 
}) => {
  return (
    <div dir="rtl">
      <FormField
        control={form.control}
        name="case_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right">نوع القضية</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger className="text-right" dir="rtl">
                  <SelectValue placeholder="اختر نوع القضية" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {caseTypes.map(type => (
                  <SelectItem key={type.value} value={type.value} className="text-right">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="priority"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right">الأولوية</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger className="text-right" dir="rtl">
                  <SelectValue placeholder="اختر الأولوية" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {casePriorities.map(priority => (
                  <SelectItem key={priority.value} value={priority.value} className="text-right">
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-right">الحالة</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger className="text-right" dir="rtl">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {caseStatuses.map(status => (
                  <SelectItem key={status.value} value={status.value} className="text-right">
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
