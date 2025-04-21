
import { Document, Page, Text, View, StyleSheet, PDFViewer, Font } from '@react-pdf/renderer';

// Register Arabic font
Font.register({
  family: 'Arabic',
  src: 'https://fonts.gstatic.com/s/cairo/v20/SLXVc1nY6HkvangtZmpcWmhzfH5lWWgcQyyS4J0.ttf'
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 30
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  arabicText: {
    fontFamily: 'Arabic',
    fontSize: 12,
    textAlign: 'right',
    direction: 'rtl'
  }
});

export const ArabicPDFDocument = ({ content }: { content: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.arabicText}>{content}</Text>
      </View>
    </Page>
  </Document>
);
