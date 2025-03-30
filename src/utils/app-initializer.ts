
import { setupInvoiceTemplatesTable } from "./setupInvoiceTemplates";

export const initializeApp = async () => {
  // Set up database tables and other requirements
  await setupInvoiceTemplatesTable();
  
  // Add other initialization as needed
};

export default initializeApp;
