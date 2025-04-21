
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

// Optional: Register Arabic font if needed for Arabic data
Font.register({
  family: 'Cairo',
  src: 'https://fonts.gstatic.com/s/cairo/v20/SLXVc1nY6HkvangtZmpcWmhzfH5lWWgcQyyS4J0.ttf',
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 24,
    fontFamily: 'Helvetica',
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
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  table: {
    display: 'table',
    width: 'auto',
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
  },
  tableCell: {
    fontSize: 10,
    padding: 5,
    flexGrow: 1,
    flexBasis: 0,
  },
  footer: {
    marginTop: 28,
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
});

interface TrafficFinesPdfReportProps {
  fines: Array<{
    customerName?: string;
    licensePlate?: string;
    agreementNumber?: string;
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
        <Text style={styles.title}>Traffic Fines Report</Text>
        <Text style={styles.subtitle}>
          All traffic fines associated with agreements and vehicles
        </Text>
      </View>
      {/* Table Headers */}
      <View style={[styles.tableRow, {backgroundColor:'#f1f5f9'}]}>
        <Text style={[styles.tableCell, styles.tableHeader]}>Customer</Text>
        <Text style={[styles.tableCell, styles.tableHeader]}>Plate</Text>
        <Text style={[styles.tableCell, styles.tableHeader]}>Agreement</Text>
        <Text style={[styles.tableCell, styles.tableHeader]}>Violation No.</Text>
        <Text style={[styles.tableCell, styles.tableHeader]}>Date</Text>
        <Text style={[styles.tableCell, styles.tableHeader]}>Amount</Text>
        <Text style={[styles.tableCell, styles.tableHeader]}>Payment</Text>
      </View>
      {/* Table Data */}
      {fines && fines.length > 0 ? fines.map((fine, idx) => (
        <View key={idx} style={styles.tableRow}>
          <Text style={styles.tableCell}>{fine.customerName || "Unassigned"}</Text>
          <Text style={styles.tableCell}>{fine.licensePlate || "--"}</Text>
          <Text style={styles.tableCell}>{fine.agreementNumber || "--"}</Text>
          <Text style={styles.tableCell}>{fine.violationNumber || "--"}</Text>
          <Text style={styles.tableCell}>
            {fine.violationDate
              ? typeof fine.violationDate === "string"
                ? fine.violationDate
                : new Date(fine.violationDate).toLocaleDateString()
              : "--"}
          </Text>
          <Text style={styles.tableCell}>
            {typeof fine.fineAmount === "number" ? `QAR ${fine.fineAmount.toLocaleString()}` : "--"}
          </Text>
          <Text style={styles.tableCell}>
            {fine.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
          </Text>
        </View>
      )) : (
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>No data found</Text>
        </View>
      )}
      {/* Footer */}
      <View style={styles.footer}>
        <Text>© 2025 ALARAF CAR RENTAL · Generated on {new Date().toLocaleDateString()}</Text>
      </View>
    </Page>
  </Document>
);

/**
 * Utility: Renders a download button for PDF using React PDF
 */
export const TrafficFinesPdfDownloadLink: React.FC<{ fines: TrafficFinesPdfReportProps['fines'] }> = ({ fines }) => (
  <PDFDownloadLink 
    document={<TrafficFinesPdfDocument fines={fines} />}
    fileName={`traffic_fines_report_${new Date().toISOString().slice(0,10)}.pdf`}
    style={{
      textDecoration: 'none',
      display: 'inline-block'
    }}
  >
    {({ blob, url, loading }) =>
      loading ? "Generating PDF..." : "Download PDF"
    }
  </PDFDownloadLink>
);

export default TrafficFinesPdfDownloadLink;
