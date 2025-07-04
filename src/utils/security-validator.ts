interface ValidationRule {
  pattern: RegExp;
  message: string;
}

interface SecurityConfig {
  maxInputLength: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  rateLimitRequests: number;
  rateLimitWindow: number;
}

class SecurityValidator {
  private config: SecurityConfig = {
    maxInputLength: 1000,
    allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    rateLimitRequests: 100,
    rateLimitWindow: 60000, // 1 minute
  };

  private requestCounts = new Map<string, { count: number; resetTime: number }>();

  validateInput(input: string, rules: ValidationRule[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (input.length > this.config.maxInputLength) {
      errors.push(`Input too long. Maximum ${this.config.maxInputLength} characters allowed.`);
    }

    for (const rule of rules) {
      if (!rule.pattern.test(input)) {
        errors.push(rule.message);
      }
    }

    if (this.containsSqlInjection(input)) {
      errors.push('Potential SQL injection detected');
    }

    if (this.containsXSS(input)) {
      errors.push('Potential XSS attack detected');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateFile(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.allowedFileTypes.includes(file.type)) {
      errors.push(`File type ${file.type} not allowed`);
    }

    if (file.size > this.config.maxFileSize) {
      errors.push(`File size ${file.size} exceeds maximum ${this.config.maxFileSize}`);
    }

    if (this.containsMaliciousContent(file.name)) {
      errors.push('Potentially malicious filename detected');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const clientData = this.requestCounts.get(clientId);

    if (!clientData || now > clientData.resetTime) {
      this.requestCounts.set(clientId, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow
      });
      return true;
    }

    if (clientData.count >= this.config.rateLimitRequests) {
      return false;
    }

    clientData.count++;
    return true;
  }

  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[;&|`$]/g, '') // Remove command injection chars
      .trim();
  }

  private containsSqlInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(--|\/\*|\*\/)/,
      /(\bOR\b.*=.*\bOR\b)/i,
      /(\bAND\b.*=.*\bAND\b)/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  private containsXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  private containsMaliciousContent(filename: string): boolean {
    const maliciousPatterns = [
      /\.(exe|bat|cmd|scr|pif|com)$/i,
      /\.\./,
      /[<>:"|?*]/
    ];

    return maliciousPatterns.some(pattern => pattern.test(filename));
  }

  generateCSRFToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  validateCSRFToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken) return false;
    return token === expectedToken;
  }
}

export const securityValidator = new SecurityValidator();

export const commonValidationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email format'
  },
  phone: {
    pattern: /^\+?[\d\s-()]+$/,
    message: 'Invalid phone number format'
  },
  arabicText: {
    pattern: /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\d\u060C\u061B\u061F\u0640]+$/,
    message: 'Invalid Arabic text'
  },
  alphanumeric: {
    pattern: /^[a-zA-Z0-9]+$/,
    message: 'Only alphanumeric characters allowed'
  }
};
