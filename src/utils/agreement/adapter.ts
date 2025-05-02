
/**
 * Adapts a simplified agreement object to a full agreement object with related data
 */
export function adaptSimpleToFullAgreement(simpleAgreement: any) {
  return {
    ...simpleAgreement,
    customer: simpleAgreement.customers || {
      id: simpleAgreement.customer_id,
      full_name: simpleAgreement.customer_name || 'N/A'
    },
    vehicle: simpleAgreement.vehicles || {
      id: simpleAgreement.vehicle_id,
      license_plate: simpleAgreement.license_plate || 'N/A',
      make: simpleAgreement.vehicle_make || '',
      model: simpleAgreement.vehicle_model || ''
    }
  };
}
