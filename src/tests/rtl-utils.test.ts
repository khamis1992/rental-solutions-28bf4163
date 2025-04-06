
import { getDirectionalClasses, getDirectionalFlexClass, getDirectionalTextAlign } from '@/utils/rtl-utils';
import { TranslationProvider, useTranslation } from '@/contexts/TranslationContext';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';

// Mock the TranslationContext
jest.mock('@/contexts/TranslationContext', () => ({
  useTranslation: jest.fn(),
  TranslationProvider: ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  }
}));

describe('RTL Utilities', () => {
  test('getDirectionalClasses flips margin and padding classes', () => {
    // Mock isRTL as true
    (useTranslation as jest.Mock).mockReturnValue({ isRTL: true });
    
    // Test margin transformations
    expect(getDirectionalClasses('ml-4')).toBe('mr-4');
    expect(getDirectionalClasses('mr-2')).toBe('ml-2');
    
    // Test padding transformations
    expect(getDirectionalClasses('pl-4')).toBe('pr-4');
    expect(getDirectionalClasses('pr-2')).toBe('pl-2');
    
    // Test with multiple classes
    expect(getDirectionalClasses('ml-4 pr-2')).toBe('mr-4 pl-2');
    
    // Test text alignment
    expect(getDirectionalClasses('text-left')).toBe('text-right');
    expect(getDirectionalClasses('text-right')).toBe('text-left');
    
    // Test border sides
    expect(getDirectionalClasses('border-l-2')).toBe('border-r-2');
    expect(getDirectionalClasses('border-r-2')).toBe('border-l-2');
    
    // Test positioning
    expect(getDirectionalClasses('left-0')).toBe('right-0');
    expect(getDirectionalClasses('right-0')).toBe('left-0');
    
    // Test with non-directional classes should keep them unchanged
    expect(getDirectionalClasses('bg-blue-500 text-white')).toBe('bg-blue-500 text-white');
  });
  
  test('getDirectionalClasses returns original classes when in LTR mode', () => {
    // Mock isRTL as false
    (useTranslation as jest.Mock).mockReturnValue({ isRTL: false });
    
    const testClasses = 'ml-4 pr-2 text-left';
    expect(getDirectionalClasses(testClasses)).toBe(testClasses);
  });
  
  test('getDirectionalFlexClass returns the correct flex direction', () => {
    // Test RTL mode
    (useTranslation as jest.Mock).mockReturnValue({ isRTL: true });
    expect(getDirectionalFlexClass()).toBe('flex-row-reverse');
    
    // Test LTR mode
    (useTranslation as jest.Mock).mockReturnValue({ isRTL: false });
    expect(getDirectionalFlexClass()).toBe('flex-row');
  });
  
  test('getDirectionalTextAlign returns the correct text alignment', () => {
    // Test RTL mode
    (useTranslation as jest.Mock).mockReturnValue({ isRTL: true });
    expect(getDirectionalTextAlign()).toBe('text-right');
    
    // Test LTR mode
    (useTranslation as jest.Mock).mockReturnValue({ isRTL: false });
    expect(getDirectionalTextAlign()).toBe('text-left');
  });
});
