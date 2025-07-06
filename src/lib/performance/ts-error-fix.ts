/**
 * TypeScript error fixes for performance optimization
 * This file contains type definitions and utilities to resolve build errors
 */

// Fix for React import issues - use this import pattern
export const REACT_IMPORT_FIX = `import { FC, ReactNode } from 'react';`;

// Status type fixes
export type LeaseStatus = 'draft' | 'active' | 'terminated' | 'cancelled' | 'expired';
export type VehicleStatus = 'maintenance' | 'available' | 'rented' | 'police_station' | 'accident' | 'stolen' | 'reserved' | 'retired' | 'out_of_service';

// Agreement interface fix
export interface FixedAgreement {
  id: string;
  customer_id: string;
  vehicle_id: string;
  status: LeaseStatus;
  start_date: string;
  end_date: string;
  rent_amount: number;
  agreement_number?: string;
  payment_day?: number;
  rent_due_day?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Remove unused imports utility
export const removeUnusedImports = (fileContent: string): string => {
  return fileContent
    .replace(/import React from 'react';\n/g, '')
    .replace(/import React, \{ /g, 'import { ')
    .replace(/,\s*React\s*\}/g, ' }')
    .replace(/\{\s*React,\s*/g, '{ ');
};

// Type assertion helpers
export const asLeaseStatus = (status: string): LeaseStatus => {
  return status as LeaseStatus;
};

export const asVehicleStatus = (status: string): VehicleStatus => {
  return status as VehicleStatus;
};