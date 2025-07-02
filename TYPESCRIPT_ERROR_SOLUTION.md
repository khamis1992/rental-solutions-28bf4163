# TypeScript Error Resolution Guide

## The Problem
TypeScript is running with strict checking enabled, causing TS6133 "unused variable" errors across hundreds of files.

## The Solution
Fix unused imports systematically:

### 1. Remove unused React imports
Replace `import React from 'react';` with nothing in files that don't use JSX

### 2. Remove unused UI component imports
Remove imports like `import { Button } from '@/components/ui/button';` if Button isn't used

### 3. Remove unused variables
Delete variables that are declared but never used

### 4. Fix type errors
Address TS2345, TS2367, TS7006 errors by adding proper types

## Quick Fix Priority
Start with these high-impact files:
- src/components/agreements/AgreementCard.tsx
- src/components/agreements/AgreementFilterPanel.tsx  
- src/components/agreements/AgreementStats.tsx
- src/components/agreements/CSVImportModal.tsx

## Automated Approach
Run the fix-imports.js script to automatically remove standalone React imports from non-JSX files.

This is the only way to resolve the TypeScript errors since the checker runs independently of build configuration.