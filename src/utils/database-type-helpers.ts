export function asTableId(table: string, id: string): string {
  // Ensures that a string ID is treated as a valid UUID in database queries
  return id;
}

export function asLeaseIdColumn(id: string): string {
  // Ensures that a string ID is treated as a valid lease_id in database queries
  return id;
}

export function asAgreementIdColumn(id: string): string {
  // Ensures that a string ID is treated as a valid agreement_id in database queries
  return id;
}

export function asImportIdColumn(id: string): string {
  // Ensures that a string ID is treated as a valid import_id in database queries
  return id;
}

export function asTrafficFineIdColumn(id: string): string {
  // Ensures that a string ID is treated as a valid traffic_fine_id in database queries
  return id;
}
