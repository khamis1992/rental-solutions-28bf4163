
import { asTableId, asStatus, asLeaseId, asPaymentId } from '../database-type-helpers';

describe('Database Type Helpers', () => {
  describe('asTableId', () => {
    it('should cast ID correctly', () => {
      const id = '123';
      const result = asTableId('leases', id);
      expect(result).toBe(id);
    });
  });

  describe('asStatus', () => {
    it('should cast status correctly', () => {
      const status = 'active';
      const result = asStatus('leases', status);
      expect(result).toBe(status);
    });
  });

  describe('asLeaseId', () => {
    it('should cast lease ID correctly', () => {
      const id = '123';
      const result = asLeaseId(id);
      expect(result).toBe(id);
    });
  });
});
