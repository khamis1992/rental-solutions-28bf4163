
import { 
  asTableId, asStatus, asLeaseId, asPaymentId, asVehicleId,
  asLeaseStatus, asPaymentStatus, asColumnValue,
  asImportId, asTrafficFineId, asMaintenanceId, asStatusColumn
} from '../database-type-helpers';

describe('Database Type Helpers', () => {
  describe('asTableId', () => {
    it('should cast ID correctly', () => {
      const id = '123';
      const result = asTableId('leases', id);
      expect(result).toBe(id);
    });

    it('should handle null values', () => {
      const result = asTableId('leases', null);
      expect(result).toBe(null);
    });

    it('should handle undefined values', () => {
      const result = asTableId('leases', undefined);
      expect(result).toBe(undefined);
    });
  });

  describe('asStatus', () => {
    it('should cast status correctly', () => {
      const status = 'active';
      const result = asStatus('leases', status);
      expect(result).toBe(status);
    });

    it('should handle null status values', () => {
      const result = asStatus('leases', null);
      expect(result).toBe(null);
    });
  });

  describe('asColumnValue', () => {
    it('should cast column value correctly', () => {
      const value = 'test-value';
      const result = asColumnValue('leases', 'agreement_number', value);
      expect(result).toBe(value);
    });
  });

  describe('asLeaseId', () => {
    it('should cast lease ID correctly', () => {
      const id = '123';
      const result = asLeaseId(id);
      expect(result).toBe(id);
    });
  });

  describe('asPaymentId', () => {
    it('should cast payment ID correctly', () => {
      const id = '456';
      const result = asPaymentId(id);
      expect(result).toBe(id);
    });
  });

  describe('asVehicleId', () => {
    it('should cast vehicle ID correctly', () => {
      const id = '789';
      const result = asVehicleId(id);
      expect(result).toBe(id);
    });
  });

  describe('asTrafficFineId', () => {
    it('should cast traffic fine ID correctly', () => {
      const id = 'abc123';
      const result = asTrafficFineId(id);
      expect(result).toBe(id);
    });
  });

  describe('asImportId', () => {
    it('should cast import ID correctly', () => {
      const id = 'import-123';
      const result = asImportId(id);
      expect(result).toBe(id);
    });
  });

  describe('asMaintenanceId', () => {
    it('should cast maintenance ID correctly', () => {
      const id = 'maint-123';
      const result = asMaintenanceId(id);
      expect(result).toBe(id);
    });
  });

  describe('asLeaseStatus', () => {
    it('should cast lease status correctly', () => {
      const status = 'active';
      const result = asLeaseStatus(status);
      expect(result).toBe(status);
    });
  });

  describe('asPaymentStatus', () => {
    it('should cast payment status correctly', () => {
      const status = 'completed';
      const result = asPaymentStatus(status);
      expect(result).toBe(status);
    });
  });

  describe('asStatusColumn', () => {
    it('should cast status column correctly for any table', () => {
      const status = 'available';
      const result = asStatusColumn('vehicles', status);
      expect(result).toBe(status);
    });
  });
});
