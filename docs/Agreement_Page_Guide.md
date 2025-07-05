
# Agreement Page Creation Guide

This guide provides a step-by-step approach to creating and managing agreements in our vehicle rental management system.

## Table of Contents
1. [Introduction](#introduction)
2. [Creating a New Agreement](#creating-a-new-agreement)
3. [Agreement Form Fields](#agreement-form-fields)
4. [Vehicle Selection and Availability](#vehicle-selection-and-availability)
5. [Customer Selection](#customer-selection)
6. [Payment Terms Configuration](#payment-terms-configuration)
7. [Agreement Preview](#agreement-preview)
8. [Template Management](#template-management)
9. [Managing Existing Agreements](#managing-existing-agreements)
10. [Troubleshooting](#troubleshooting)

## Introduction

The Agreement system allows you to create, manage, and track rental contracts between customers and vehicles. Each agreement contains all necessary information including customer details, vehicle information, payment terms, and contract duration.

## Creating a New Agreement

To create a new agreement, follow these steps:

1. Navigate to the Agreements section from the main navigation menu
2. Click the "Add Agreement" button
3. You'll be presented with the agreement creation form
4. Fill in all required information (see [Agreement Form Fields](#agreement-form-fields))
5. Verify the agreement preview
6. Click "Create Agreement" to finalize

### Key Components

The agreement creation page consists of several key components:
- Template verification section
- Agreement details form
- Customer selection
- Vehicle selection with availability check
- Payment terms configuration
- Agreement preview

## Agreement Form Fields

The agreement form contains these essential fields:

### Basic Information
- **Agreement Number**: Automatically generated, follows format `AGR-YYYYMM-XXXX`
- **Start Date**: When the rental period begins
- **Duration**: Agreement length in months (1, 3, 6, 12, 24, or 36 months)
- **End Date**: Automatically calculated based on start date and duration
- **Status**: Current status of the agreement (Draft, Active, Pending)

### Customer & Vehicle Selection
- **Customer**: Dropdown to select existing customer
- **Vehicle**: Dropdown to select available vehicle
  - Shows warning if vehicle is already assigned to another agreement

### Payment Information
- **Monthly Rent Amount**: The recurring payment amount
- **Deposit Amount**: Security deposit for the vehicle
- **Daily Late Fee**: Fee charged for late payments (default: 120)
- **Total Contract Amount**: Automatically calculated (monthly rent × duration + deposit)
- **Notes**: Optional additional information about the agreement

## Vehicle Selection and Availability

When selecting a vehicle, the system performs availability checks:

1. The dropdown shows all vehicles with their current status
2. Vehicles already assigned to active agreements are marked
3. If you select an already assigned vehicle:
   - A warning appears showing the current assignment
   - When saving, the system will automatically close the previous agreement
   - The vehicle's status will be updated to reflect the new assignment

### Vehicle Information Display

After selecting a vehicle, the system displays:
- Make and model
- License plate
- VIN
- Year

## Customer Selection

When selecting a customer, the system:

1. Shows a dropdown of all customers in the system
2. Displays key customer information after selection:
   - Email address
   - Phone number
   - Driver's license number
   - Nationality

## Payment Terms Configuration

Configure the payment terms for the agreement:

1. Set the monthly rent amount
   - This will often be pre-filled based on the vehicle's configured rent amount
2. Set the deposit amount
3. Set the daily late fee (if different from default)
4. The total contract amount is automatically calculated

## Agreement Preview

After completing the agreement form, a preview section shows:

1. Template information status
   - Confirms if the standard template is available
   - Shows any template issues if detected
2. Customer data mapping preview
   - Shows how customer fields will populate in the template
3. Vehicle data mapping preview
   - Shows how vehicle fields will populate in the template
4. Agreement data mapping preview
   - Shows how agreement fields will populate in the template

## Template Management

The system uses document templates for generating agreement documents:

### Template Verification

The system automatically checks for the existence of the standard agreement template:
1. Looks for the template file in the storage system
2. Reports if the template is found and accessible
3. If missing, provides options for uploading a new template

### Template Upload

If the standard template is missing:
1. Use the template upload function to provide a new template file
2. Only .docx format is supported
3. The system will verify the uploaded template
4. Templates can contain placeholders for dynamic data

### Template Placeholders

Templates support these placeholder categories:
- `{{CUSTOMER_NAME}}`, `{{CUSTOMER_EMAIL}}`, etc. - For customer data
- `{{VEHICLE_MAKE}}`, `{{VEHICLE_MODEL}}`, etc. - For vehicle data
- `{{AGREEMENT_NUMBER}}`, `{{START_DATE}}`, etc. - For agreement data

## Managing Existing Agreements

After creating agreements, you can:

1. View them in the Agreements list
2. Search by agreement number, customer name, or vehicle
3. Filter by status
4. View detailed information for each agreement
5. Edit agreements when necessary
6. Generate documents from agreements
7. Track payments associated with agreements

## Troubleshooting

### Template Issues

If you encounter template issues:
1. Check the Template Status section
2. Verify storage bucket permissions
3. Upload a new template if necessary
4. Check for proper placeholder formatting in templates

### Vehicle Availability

If a vehicle shows as unavailable:
1. Check for active agreements using the vehicle
2. Confirm if you want to close the existing agreement
3. Verify that the vehicle status is correct in the vehicles database

### Payment Calculation

If payment calculations appear incorrect:
1. Verify the monthly rent amount
2. Check the agreement duration
3. Confirm the deposit amount
4. Ensure all numbers are entered correctly

---

## Technical Implementation

Behind the scenes, the agreement system:
1. Uses `useAgreements` hook for data management
2. Leverages `AgreementFormWithVehicleCheck` for the form interface
3. Implements real-time validation for all inputs
4. Integrates with template rendering system for document generation
5. Connects to customer and vehicle databases for information
6. Manages vehicle status changes when agreements change

For developers, refer to the following key components:
- `src/components/agreements/AgreementFormWithVehicleCheck.tsx`
- `src/hooks/use-agreements.ts`
- `src/utils/agreementUtils.js`
- `src/pages/AddAgreement.tsx`
