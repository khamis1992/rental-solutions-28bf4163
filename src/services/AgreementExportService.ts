import { supabase } from '@/lib/supabase';

// Utility to escape CSV values
function csvEscape(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value).replace(/\r?\n|\r/g, ' ').replace(/"/g, '""');
  // Wrap in quotes if contains comma or quotes
  if (/[",]/.test(str)) return `"${str}"`;
  return str;
}

function toArabicStatus(status: string | null | undefined) {
  switch (status) {
    case 'active': return 'نشطة';
    case 'closed': return 'مكتملة';
    case 'cancelled': return 'ملغاة';
    default: return status || '';
  }
}

export async function exportAllAgreementsToCSV() {
  // Fetch all leases with customer and vehicle relations
  const { data, error } = await supabase
    .from('leases')
    .select(`
      id, agreement_number, status, start_date, end_date, rent_amount, daily_late_fee,
      deposit_amount, down_payment, payment_frequency, payment_day, rent_due_day,
      created_at, updated_at,
      customers:customer_id ( id, full_name, email, phone_number, driver_license ),
      vehicles:vehicle_id ( id, make, model, year, color, license_plate, vin, status )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data || [];

  const headers = [
    'رقم العقد',
    'الحالة',
    'تاريخ البداية',
    'تاريخ النهاية',
    'قيمة الإيجار',
    'غرامة التأخير اليومية',
    'الدفعة المقدمة',
    'التأمين',
    'تكرار الدفع',
    'يوم الدفع',
    'يوم الاستحقاق',
    'اسم العميل',
    'رقم الهوية/الرخصة',
    'هاتف العميل',
    'بريد العميل',
    'لوحة المركبة',
    'المركبة',
    'الشاسيه (VIN)',
    'حالة المركبة',
    'تاريخ الإنشاء',
  ];

  const lines: string[] = [];
  lines.push(headers.map(csvEscape).join(','));

  for (const r of rows as any[]) {
    const vehicleLabel = [r?.vehicles?.year, r?.vehicles?.make, r?.vehicles?.model]
      .filter(Boolean)
      .join(' ');

    const line = [
      csvEscape(r.agreement_number ?? ''),
      csvEscape(toArabicStatus(r.status)),
      csvEscape(r.start_date ?? ''),
      csvEscape(r.end_date ?? ''),
      csvEscape(r.rent_amount ?? ''),
      csvEscape(r.daily_late_fee ?? ''),
      csvEscape(r.down_payment ?? ''),
      csvEscape(r.deposit_amount ?? ''),
      csvEscape(r.payment_frequency ?? ''),
      csvEscape(r.payment_day ?? ''),
      csvEscape(r.rent_due_day ?? ''),
      csvEscape(r.customers?.full_name ?? ''),
      csvEscape(r.customers?.driver_license ?? ''),
      csvEscape(r.customers?.phone_number ?? ''),
      csvEscape(r.customers?.email ?? ''),
      csvEscape(r.vehicles?.license_plate ?? ''),
      csvEscape(vehicleLabel || ''),
      csvEscape(r.vehicles?.vin ?? ''),
      csvEscape(r.vehicles?.status ?? ''),
      csvEscape(r.created_at ?? ''),
    ].join(',');

    lines.push(line);
  }

  const csvContent = '\uFEFF' + lines.join('\n'); // BOM for Excel support
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0,10);
  a.download = `agreements_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
