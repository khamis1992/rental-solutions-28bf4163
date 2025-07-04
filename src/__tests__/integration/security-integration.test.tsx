import { describe, it, expect, vi, beforeEach } from 'vitest';
import { securityValidator, commonValidationRules } from '@/utils/security-validator';

describe('Security Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should detect SQL injection attempts', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'/**/OR/**/1=1--",
        "UNION SELECT * FROM passwords"
      ];

      maliciousInputs.forEach(input => {
        const result = securityValidator.validateInput(input, [commonValidationRules.alphanumeric]);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Potential SQL injection detected');
      });
    });

    it('should detect XSS attempts', () => {
      const xssInputs = [
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
        "<img src=x onerror=alert('xss')>",
        "<iframe src='javascript:alert(1)'></iframe>"
      ];

      xssInputs.forEach(input => {
        const result = securityValidator.validateInput(input, []);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Potential XSS attack detected');
      });
    });

    it('should validate Arabic text correctly', () => {
      const validArabicInputs = [
        'أحمد محمد',
        'شركة الإيجار المحدودة',
        'العنوان: الدوحة، قطر'
      ];

      validArabicInputs.forEach(input => {
        const result = securityValidator.validateInput(input, [commonValidationRules.arabicText]);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid Arabic text', () => {
      const invalidInputs = [
        'Ahmed Mohammed',
        'أحمد<script>alert(1)</script>محمد',
        'محمد\'; DROP TABLE users; --'
      ];

      invalidInputs.forEach(input => {
        const result = securityValidator.validateInput(input, [commonValidationRules.arabicText]);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('File Validation', () => {
    it('should validate allowed file types', () => {
      const validFile = new File(['content'], 'document.pdf', {
        type: 'application/pdf'
      });

      const result = securityValidator.validateFile(validFile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject disallowed file types', () => {
      const invalidFile = new File(['content'], 'malware.exe', {
        type: 'application/x-executable'
      });

      const result = securityValidator.validateFile(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File type application/x-executable not allowed');
    });

    it('should enforce file size limits', () => {
      const largeContent = 'x'.repeat(20 * 1024 * 1024);
      const largeFile = new File([largeContent], 'large.pdf', {
        type: 'application/pdf'
      });

      const result = securityValidator.validateFile(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('exceeds maximum'))).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      const clientId = 'test-client-1';
      
      for (let i = 0; i < 50; i++) {
        const allowed = securityValidator.checkRateLimit(clientId);
        expect(allowed).toBe(true);
      }
    });

    it('should block requests exceeding rate limit', () => {
      const clientId = 'test-client-2';
      
      for (let i = 0; i < 100; i++) {
        securityValidator.checkRateLimit(clientId);
      }
      
      const blocked = securityValidator.checkRateLimit(clientId);
      expect(blocked).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize malicious input', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = securityValidator.sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });

    it('should preserve safe Arabic text', () => {
      const arabicInput = 'أحمد محمد الكعبي';
      const sanitized = securityValidator.sanitizeInput(arabicInput);
      
      expect(sanitized).toBe(arabicInput);
    });
  });

  describe('CSRF Protection', () => {
    it('should generate valid CSRF tokens', () => {
      const token1 = securityValidator.generateCSRFToken();
      const token2 = securityValidator.generateCSRFToken();
      
      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });

    it('should validate CSRF tokens correctly', () => {
      const token = securityValidator.generateCSRFToken();
      
      expect(securityValidator.validateCSRFToken(token, token)).toBe(true);
      expect(securityValidator.validateCSRFToken(token, 'invalid')).toBe(false);
      expect(securityValidator.validateCSRFToken('', token)).toBe(false);
    });
  });
});
