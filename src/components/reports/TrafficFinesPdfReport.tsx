
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  PDFDownloadLink,
} from '@react-pdf/renderer';

// Register Cairo for Arabic/English display with updated URL
Font.register({
  family: 'Cairo',
  // Updated URL to a more reliable Cairo font CDN location
  src: 'https://cdn.jsdelivr.net/npm/@fontsource/cairo@5.0.8/files/cairo-all-400-normal.woff',
  fontWeight: 'normal',
});

// Register Cairo Bold
Font.register({
  family: 'Cairo',
  src: 'https://cdn.jsdelivr.net/npm/@fontsource/cairo@5.0.8/files/cairo-all-700-normal.woff',
  fontWeight: 'bold',
});

// Register Helvetica as a fallback
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf' },
    { 
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf',
      fontWeight: 'bold' 
    }
  ]
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 24,
    fontFamily: 'Cairo',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#ef4444',
    borderBottomStyle: 'solid',
    marginBottom: 18,
    paddingBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: 'Cairo',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Cairo',
  },
  table: {
    flexDirection: 'column',
    width: '100%',
    marginVertical: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    alignItems: 'center',
    minHeight: 24,
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
    fontWeight: 'bold',
    fontSize: 12,
    padding: 5,
    fontFamily: 'Cairo',
  },
  tableCell: {
    fontSize: 10,
    padding: 5,
    flexGrow: 1,
    flexBasis: 0,
    fontFamily: 'Cairo',
  },
  cellRTL: {
    direction: 'rtl',
    textAlign: 'right',
  },
  arabicText: {
    direction: 'rtl',
    textAlign: 'right',
    fontFamily: 'Cairo',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    fontFamily: 'Cairo',
  },
  noData: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  }
});

interface TrafficFinesPdfReportProps {
  fines: Array<{
    customerName?: string;
    licensePlate?: string;
    violationNumber?: string;
    violationDate?: string | Date;
    fineAmount?: number;
    paymentStatus?: string;
  }>;
}

// Helper function to normalize Arabic text for better display
const normalizeArabicText = (text: string): string => {
  // Basic Arabic text normalization
  return text
    .replace(/\u0640/g, '') // Remove tatweel
    .replace(/[\u064B-\u065F]/g, ''); // Remove tashkeel (diacritics)
};

// Helper to safely format dates
const formatDate = (date: string | Date | undefined): string => {
  if (!date) return "--";
  try {
    return new Date(date).toLocaleDateString('en-US');
  } catch (error) {
    console.error("Error formatting date:", error);
    return String(date);
  }
};

export const TrafficFinesPdfDocument = ({ fines }: TrafficFinesPdfReportProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Traffic Fines Report / تقرير المخالفات المرورية</Text>
        <Text style={styles.subtitle}>
          All traffic fines associated with agreements and vehicles {"\n"}
          جميع المخالفات المرورية المرتبطة بالمركبات
        </Text>
      </View>
      {/* Table Headers */}
      <View style={[styles.tableRow, {backgroundColor:'#f1f5f9'}]}>
        <Text style={[styles.tableCell, styles.tableHeader]}>Customer / العميل</Text>
        <Text style={[styles.tableCell, styles.tableHeader]}>Plate / اللوحة</Text>
        <Text style={[styles.tableCell, styles.tableHeader]}>Violation No. / رقم المخالفة</Text>
        <Text style={[styles.tableCell, styles.tableHeader]}>Date / التاريخ</Text>
        <Text style={[styles.tableCell, styles.tableHeader]}>Amount / المبلغ</Text>
        <Text style={[styles.tableCell, styles.tableHeader]}>Payment / الدفع</Text>
      </View>
      {/* Table Data */}
      {fines && fines.length > 0 ? fines.map((fine, idx) => (
        <View key={idx} style={styles.tableRow}>
          <Text style={styles.tableCell} wrap>
            {fine.customerName || "Unassigned"}
          </Text>
          <Text style={styles.tableCell} wrap>
            {fine.licensePlate || "--"}
          </Text>
          <Text style={[styles.tableCell, styles.cellRTL]} wrap>
            {fine.violationNumber || "--"}
          </Text>
          <Text style={styles.tableCell} wrap>
            {formatDate(fine.violationDate)}
          </Text>
          <Text style={styles.tableCell} wrap>
            {typeof fine.fineAmount === "number" ?
              `QAR ${fine.fineAmount.toLocaleString("en-US")}` : "--"}
          </Text>
          <Text style={[styles.tableCell, styles.cellRTL]} wrap>
            {fine.paymentStatus === 'paid' ? 'Paid / مدفوعة' : 'Pending / غير مدفوعة'}
          </Text>
        </View>
      )) : (
        <View style={styles.tableRow}>
          <Text style={styles.noData}>No data found / لا توجد بيانات</Text>
        </View>
      )}
      {/* Footer */}
      <View style={styles.footer} fixed>
        <Text>© 2025 ALARAF CAR RENTAL · Generated on {new Date().toLocaleDateString()} / تم التوليد في {new Date().toLocaleDateString('ar-EG')}</Text>
      </View>
    </Page>
  </Document>
);

/**
 * Utility: Renders a download button for PDF using React PDF
 */
export const TrafficFinesPdfDownloadLink: React.FC<{ fines: TrafficFinesPdfReportProps['fines'] }> = ({ fines }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const handlePdfGeneration = () => {
    setIsLoading(true);
    setError(null);
  };
  
  return (
    <div className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer relative">
      <PDFDownloadLink
        document={<TrafficFinesPdfDocument fines={fines} />}
        fileName={`traffic_fines_report_${new Date().toISOString().slice(0,10)}.pdf`}
        className="no-underline text-white w-full h-full block"
        onClick={handlePdfGeneration}
      >
        {({ loading, error }) => {
          if (loading || isLoading) {
            return "Generating PDF...";
          }
          if (error) {
            setError(error.message);
            setIsLoading(false);
            return "Error generating PDF";
          }
          return "Download PDF";
        }}
      </PDFDownloadLink>
      {error && (
        <div className="absolute bg-red-600 text-white text-xs rounded p-1 -top-8 left-0 right-0">
          Error: {error}
        </div>
      )}
    </div>
  );
};

export default TrafficFinesPdfDownloadLink;
