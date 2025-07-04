/**
 * Test suite for enhanced license plate search utilities
 */

import {
  extractNumericParts,
  extractAlphabeticParts,
  normalizeLicensePlate,
  calculateLevenshteinDistance,
  calculateSimilarity,
  enhancedLicensePlateMatch,
  doesLicensePlateMatch,
  isLicensePlatePattern,
  enhancedVehicleSearch,
  generateSearchSuggestions
} from './searchUtils';

describe('Enhanced License Plate Search Utilities', () => {
  
  describe('extractNumericParts', () => {
    it('should extract only numeric characters', () => {
      expect(extractNumericParts('ABC123')).toBe('123');
      expect(extractNumericParts('12-34-56')).toBe('123456');
      expect(extractNumericParts('QAT 789')).toBe('789');
      expect(extractNumericParts('')).toBe('');
      expect(extractNumericParts('ABCD')).toBe('');
    });
  });

  describe('extractAlphabeticParts', () => {
    it('should extract only alphabetic characters', () => {
      expect(extractAlphabeticParts('ABC123')).toBe('ABC');
      expect(extractAlphabeticParts('QAT-789')).toBe('QAT');
      expect(extractAlphabeticParts('12345')).toBe('');
      expect(extractAlphabeticParts('')).toBe('');
    });
  });

  describe('normalizeLicensePlate', () => {
    it('should normalize license plates correctly', () => {
      expect(normalizeLicensePlate('ABC-123')).toBe('ABC123');
      expect(normalizeLicensePlate('qat 789')).toBe('QAT789');
      expect(normalizeLicensePlate('12 34 56')).toBe('123456');
      expect(normalizeLicensePlate('')).toBe('');
    });
  });

  describe('calculateLevenshteinDistance', () => {
    it('should calculate correct edit distance', () => {
      expect(calculateLevenshteinDistance('ABC123', 'ABC123')).toBe(0);
      expect(calculateLevenshteinDistance('ABC123', 'ABC124')).toBe(1);
      expect(calculateLevenshteinDistance('ABC123', 'ABD123')).toBe(1);
      expect(calculateLevenshteinDistance('ABC123', 'XYZ789')).toBe(6);
      expect(calculateLevenshteinDistance('', 'ABC')).toBe(3);
      expect(calculateLevenshteinDistance('ABC', '')).toBe(3);
    });
  });

  describe('calculateSimilarity', () => {
    it('should calculate correct similarity percentage', () => {
      expect(calculateSimilarity('ABC123', 'ABC123')).toBe(100);
      expect(calculateSimilarity('ABC123', 'ABC124')).toBeCloseTo(83.33, 0);
      expect(calculateSimilarity('', '')).toBe(100);
      expect(calculateSimilarity('ABC', '')).toBe(0);
    });
  });

  describe('enhancedLicensePlateMatch', () => {
    it('should handle exact matches', () => {
      const result = enhancedLicensePlateMatch('ABC123', 'ABC123');
      expect(result.isMatch).toBe(true);
      expect(result.confidence).toBe(100);
      expect(result.matchType).toBe('exact');
    });

    it('should handle contains matches', () => {
      const result = enhancedLicensePlateMatch('ABC123DEF', 'C123D');
      expect(result.isMatch).toBe(true);
      expect(result.matchType).toBe('contains');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle starts with matches', () => {
      const result = enhancedLicensePlateMatch('ABC123', 'ABC');
      expect(result.isMatch).toBe(true);
      expect(result.matchType).toBe('alpha_exact');
    });

    it('should handle ends with matches', () => {
      const result = enhancedLicensePlateMatch('ABC123', '123');
      expect(result.isMatch).toBe(true);
      expect(result.matchType).toBe('numeric_exact');
    });

    it('should handle numeric-only searches', () => {
      const result = enhancedLicensePlateMatch('ABC123DEF', '123');
      expect(result.isMatch).toBe(true);
      expect(result.matchType).toBe('numeric_exact');
    });

    it('should handle alphabetic-only searches', () => {
      const result = enhancedLicensePlateMatch('ABC123DEF', 'ABC');
      expect(result.isMatch).toBe(true);
      expect(result.matchType).toBe('alpha_exact');
    });

    it('should handle fuzzy matches', () => {
      const result = enhancedLicensePlateMatch('ABC123', 'ABD123');
      expect(result.isMatch).toBe(true);
      expect(result.matchType).toBe('fuzzy');
      expect(result.confidence).toBeGreaterThan(50);
    });

    it('should handle no matches', () => {
      const result = enhancedLicensePlateMatch('ABC123', 'XYZ999');
      expect(result.isMatch).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.matchType).toBe('none');
    });

    it('should handle empty inputs', () => {
      expect(enhancedLicensePlateMatch('', 'ABC')).toEqual({
        isMatch: false,
        confidence: 0,
        matchType: 'none'
      });
      expect(enhancedLicensePlateMatch('ABC', '')).toEqual({
        isMatch: false,
        confidence: 0,
        matchType: 'none'
      });
    });
  });

  describe('doesLicensePlateMatch', () => {
    it('should return true for good matches', () => {
      expect(doesLicensePlateMatch('ABC123', 'ABC123')).toBe(true);
      expect(doesLicensePlateMatch('ABC123DEF', 'ABC')).toBe(true);
      expect(doesLicensePlateMatch('ABC123DEF', '123')).toBe(true);
    });

    it('should return false for poor matches', () => {
      expect(doesLicensePlateMatch('ABC123', 'XYZ999')).toBe(false);
      expect(doesLicensePlateMatch('', 'ABC')).toBe(false);
      expect(doesLicensePlateMatch('ABC', '')).toBe(false);
    });
  });

  describe('isLicensePlatePattern', () => {
    it('should identify license plate patterns', () => {
      expect(isLicensePlatePattern('ABC123')).toBe(true);
      expect(isLicensePlatePattern('QAT789')).toBe(true);
      expect(isLicensePlatePattern('12ABC34')).toBe(true);
    });

    it('should reject non-license plate patterns', () => {
      expect(isLicensePlatePattern('123456')).toBe(false);
      expect(isLicensePlatePattern('ABCDEF')).toBe(false);
      expect(isLicensePlatePattern('A')).toBe(false);
      expect(isLicensePlatePattern('')).toBe(false);
    });
  });

  describe('enhancedVehicleSearch', () => {
    const mockVehicles = [
      {
        id: '1',
        license_plate: 'ABC123',
        vin: 'VIN123456789',
        make: 'Toyota',
        model: 'Camry',
        year: 2020
      },
      {
        id: '2',
        license_plate: 'XYZ789',
        vin: 'VIN987654321',
        make: 'Honda',
        model: 'Civic',
        year: 2021
      },
      {
        id: '3',
        license_plate: 'QAT456',
        vin: 'VIN456789123',
        make: 'Ford',
        model: 'Focus',
        year: 2019
      }
    ];

    it('should find vehicles by exact license plate', () => {
      const results = enhancedVehicleSearch('ABC123', mockVehicles);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
      expect(results[0].matchScore).toBeGreaterThan(0);
    });

    it('should find vehicles by partial license plate', () => {
      const results = enhancedVehicleSearch('123', mockVehicles);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].matchScore).toBeGreaterThan(0);
    });

    it('should find vehicles by make', () => {
      const results = enhancedVehicleSearch('Toyota', mockVehicles);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should find vehicles by model', () => {
      const results = enhancedVehicleSearch('Civic', mockVehicles);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2');
    });

    it('should find vehicles by year', () => {
      const results = enhancedVehicleSearch('2020', mockVehicles);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should return empty array for no matches', () => {
      const results = enhancedVehicleSearch('NOMATCH', mockVehicles);
      expect(results).toHaveLength(0);
    });

    it('should sort results by match score', () => {
      const results = enhancedVehicleSearch('ABC', mockVehicles);
      if (results.length > 1) {
        expect(results[0].matchScore).toBeGreaterThanOrEqual(results[1].matchScore);
      }
    });
  });

  describe('generateSearchSuggestions', () => {
    const mockVehicles = [
      {
        license_plate: 'ABC123',
        make: 'Toyota',
        model: 'Camry'
      },
      {
        license_plate: 'ABC456',
        make: 'Honda',
        model: 'Civic'
      },
      {
        license_plate: 'XYZ789',
        make: 'Ford',
        model: 'Focus'
      }
    ];

    it('should generate license plate suggestions', () => {
      const suggestions = generateSearchSuggestions('ABC', mockVehicles);
      expect(suggestions).toContain('ABC123');
      expect(suggestions).toContain('ABC456');
      expect(suggestions).not.toContain('XYZ789');
    });

    it('should generate make suggestions', () => {
      const suggestions = generateSearchSuggestions('Toy', mockVehicles);
      expect(suggestions).toContain('Toyota');
    });

    it('should generate model suggestions', () => {
      const suggestions = generateSearchSuggestions('Cam', mockVehicles);
      expect(suggestions).toContain('Camry');
    });

    it('should limit suggestions to 10', () => {
      const largeMockVehicles = Array.from({ length: 20 }, (_, i) => ({
        license_plate: `ABC${i}`,
        make: 'Toyota',
        model: 'Camry'
      }));
      
      const suggestions = generateSearchSuggestions('ABC', largeMockVehicles);
      expect(suggestions.length).toBeLessThanOrEqual(10);
    });

    it('should return empty array for short input', () => {
      const suggestions = generateSearchSuggestions('A', mockVehicles);
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('Real-world license plate scenarios', () => {
    it('should handle Qatar license plate formats', () => {
      // Common Qatar formats
      expect(doesLicensePlateMatch('QAT 123456', '123456')).toBe(true);
      expect(doesLicensePlateMatch('123456', 'QAT123456')).toBe(true);
      expect(doesLicensePlateMatch('QAT-123456', 'QAT 123456')).toBe(true);
    });

    it('should handle partial searches common in rental systems', () => {
      // User searches for last 3 digits
      expect(doesLicensePlateMatch('QAT123456', '456')).toBe(true);
      
      // User searches for first letters
      expect(doesLicensePlateMatch('QAT123456', 'QAT')).toBe(true);
      
      // User searches with typos
      expect(enhancedLicensePlateMatch('QAT123456', 'QAT123457').isMatch).toBe(true);
    });

    it('should handle numeric-only searches for rental lookup', () => {
      // Common scenario: user only remembers numbers
      expect(doesLicensePlateMatch('ABC123DEF', '123')).toBe(true);
      expect(doesLicensePlateMatch('QAT789456', '789456')).toBe(true);
      expect(doesLicensePlateMatch('XYZ999', '999')).toBe(true);
    });
  });
});      