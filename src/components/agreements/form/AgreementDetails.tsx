
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";

interface AgreementDetailsProps {
  agreementNumber: string;
  setAgreementNumber: (value: string) => void;
  startDate: Date;
  setStartDate: (date: Date) => void;
  durationMonths: string;
  setDurationMonths: (value: string) => void;
  endDate: Date;
  setEndDate: (date: Date) => void;
  status: string;
  setStatus: (value: string) => void;
  standardTemplateExists: boolean;
}

export const AgreementDetails = ({
  agreementNumber,
  setAgreementNumber,
  startDate,
  setStartDate,
  durationMonths,
  setDurationMonths,
  endDate,
  setEndDate,
  status,
  setStatus,
  standardTemplateExists
}: AgreementDetailsProps) => {
  return (
    <div className={`space-y-4 ${typeof window !== 'undefined' && document?.documentElement?.dir === 'rtl' ? 'text-right' : ''}`}>
      <h3 className="font-medium text-lg">تفاصيل العقد</h3>
      
      {/* Using Standard Template Section */}
      {standardTemplateExists && (
        <div className={`mb-6 bg-green-50 p-4 rounded-md border border-green-200 ${typeof window !== 'undefined' && document?.documentElement?.dir === 'rtl' ? 'text-right' : ''}`}>
          <div className={`flex items-center gap-2 ${typeof window !== 'undefined' && document?.documentElement?.dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <CheckCircle2 className={`h-5 w-5 text-green-500 ${typeof window !== 'undefined' && document?.documentElement?.dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
            <div>
              <p className="font-medium text-green-800">يتم استخدام القالب القياسي</p>
              <p className="text-sm text-green-700">سيتم استخدام القالب القياسي من قاعدة البيانات لهذا العقد.</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="agreementNumber" className="text-sm font-medium">
          رقم العقد
        </label>
        <Input
          id="agreementNumber"
          value={agreementNumber}
          onChange={(e) => setAgreementNumber(e.target.value)}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="startDate" className="text-sm font-medium">
          تاريخ البدء
        </label>
        <DatePicker 
          date={startDate ? (startDate instanceof Date ? startDate : new Date(startDate)) : undefined}
          setDate={setStartDate} 
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="duration" className="text-sm font-medium">
          المدة (بالأشهر)
        </label>
        <Select value={durationMonths} onValueChange={setDurationMonths}>
          <SelectTrigger>
            <SelectValue placeholder="اختر المدة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">شهر واحد</SelectItem>
            <SelectItem value="3">٣ أشهر</SelectItem>
            <SelectItem value="6">٦ أشهر</SelectItem>
            <SelectItem value="12">١٢ شهر</SelectItem>
            <SelectItem value="24">٢٤ شهر</SelectItem>
            <SelectItem value="36">٣٦ شهر</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="endDate" className="text-sm font-medium">
          تاريخ الانتهاء
        </label>
        <DatePicker 
          date={endDate ? (endDate instanceof Date ? endDate : new Date(endDate)) : undefined}
          setDate={setEndDate}
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="status" className="text-sm font-medium">
          الحالة
        </label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="اختر الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">مسودة</SelectItem>
            <SelectItem value="pending">معلق</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="closed">مكتمل</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
            <SelectItem value="expired">منتهي</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
