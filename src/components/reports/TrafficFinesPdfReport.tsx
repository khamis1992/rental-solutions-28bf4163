
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
  // Updated URL to a more reliable Cairo font location
  src: 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs0SgZR.ttf',
  fontWeight: 'normal',
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
    minHeight: 20,
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
  footer: {
    marginTop: 28,
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    fontFamily: 'Cairo',
  },
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
            {fine.violationDate
              ? typeof fine.violationDate === "string"
                ? fine.violationDate
                : new Date(fine.violationDate).toLocaleDateString('en-US')
              : "--"}
          </Text>
          <Text style={styles.tableCell} wrap>
            {typeof fine.fineAmount === "number" ?
              `QAR ${fine.fineAmount.toLocaleString("en-US")}` : "--"}
          </Text>
          <Text style={styles.tableCell} wrap>
            {fine.paymentStatus === 'paid' ? 'Paid / مدفوعة' : 'Pending / غير مدفوعة'}
          </Text>
        </View>
      )) : (
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>No data found / لا توجد بيانات</Text>
        </View>
      )}
      {/* Footer */}
      <View style={styles.footer}>
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
  
  return (
    <div className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer">
      <PDFDownloadLink
        document={<TrafficFinesPdfDocument fines={fines} />}
        fileName={`traffic_fines_report_${new Date().toISOString().slice(0,10)}.pdf`}
        className="no-underline text-white w-full h-full block"
        onClick={() => setIsLoading(true)}
      >
        {({ blob, url, loading, error }) => {
          if (error) {
            console.error("PDF generation error:", error);
            return "Error generating PDF";
          }
          
          // When complete, reset loading state
          if (!loading && isLoading) {
            setTimeout(() => setIsLoading(false), 100);
          }
          
          return loading || isLoading ? "Generating..." : "Download PDF";
        }}
      </PDFDownloadLink>
    </div>
  );
};

export default TrafficFinesPdfDownloadLink;
