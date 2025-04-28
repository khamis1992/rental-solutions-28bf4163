
# User Stories and Use Cases

## 1. Vehicle Management

### Vehicle Registration

**User Story:** As a fleet manager, I want to add new vehicles to the inventory with detailed specifications so that they are available for rental.

**Acceptance Criteria:**
- I can enter all required vehicle details (make, model, year, VIN, license plate, color)
- I can upload vehicle images
- I can add optional details like features, acquisition cost
- The system validates the VIN and plate number for uniqueness
- I receive confirmation when a vehicle is successfully added
- The new vehicle appears in the inventory with "Available" status

**Use Case:**
1. Fleet manager navigates to "Vehicles" section
2. Fleet manager clicks "Add Vehicle" button
3. Fleet manager fills in vehicle details form
4. Fleet manager uploads vehicle images
5. Fleet manager submits the form
6. System validates the information
7. System confirms successful vehicle registration
8. The vehicle appears in the inventory list

### Vehicle Status Management

**User Story:** As a rental agent, I need to quickly view and update vehicle status so that I can accurately determine vehicle availability for customers.

**Acceptance Criteria:**
- I can see the current status of any vehicle at a glance
- I can filter vehicles by status (Available, Rented, Maintenance, etc.)
- I can change a vehicle's status manually when needed
- Status changes are logged with timestamp and user
- Status changes update in real-time across the system

**Use Case:**
1. Rental agent navigates to "Vehicles" section
2. Rental agent filters list by "Available" status
3. Rental agent selects a vehicle
4. Rental agent changes status to "In Maintenance"
5. Rental agent adds a note about the reason
6. System updates the vehicle status
7. System logs the change in the vehicle history
8. Vehicle no longer appears in "Available" filtered list

## 2. Customer Management

### Customer Registration

**User Story:** As a rental agent, I want to register new customers with their personal and contact information so that I can create rental agreements for them.

**Acceptance Criteria:**
- I can enter all customer details (name, contact info, ID, license)
- I can upload customer documents (ID, license scans)
- System validates email and phone for proper format
- System checks for duplicate customer records
- I receive confirmation when a customer is successfully added
- The new customer appears in the customer database

**Use Case:**
1. Rental agent navigates to "Customers" section
2. Rental agent clicks "Add Customer" button
3. Rental agent fills in customer details form
4. Rental agent uploads ID and license documents
5. Rental agent submits the form
6. System validates the information
7. System confirms successful customer registration
8. The customer appears in the customer list

### Customer Search and History View

**User Story:** As a rental agent, I want to quickly search for existing customers and view their rental history so that I can provide personalized service.

**Acceptance Criteria:**
- I can search customers by name, email, phone, or ID number
- Search results appear as I type
- I can view a customer's complete rental history
- I can see payment history and any outstanding balances
- I can identify any previous issues or special notes

**Use Case:**
1. Rental agent enters customer name in search field
2. System displays matching customer records as agent types
3. Rental agent selects the correct customer
4. System displays customer profile with rental history
5. Rental agent reviews previous rentals and payment patterns
6. Rental agent uses this information to assist the customer

## 3. Agreement Management

### Create New Rental Agreement

**User Story:** As a rental agent, I want to create a new rental agreement by selecting a customer and vehicle so that I can formalize the rental arrangement.

**Acceptance Criteria:**
- I can select from registered customers or add a new one
- I can select from available vehicles
- I can set rental dates, rates, and terms
- System validates there are no conflicts with the selected vehicle
- System calculates fees, taxes, and total amount
- I can generate a rental agreement document for signature
- The agreement is saved with "Active" status once signed

**Use Case:**
1. Rental agent navigates to "Agreements" section
2. Rental agent clicks "New Agreement" button
3. Rental agent selects or adds a customer
4. Rental agent selects an available vehicle
5. Rental agent sets rental period and terms
6. System validates vehicle availability for the period
7. Rental agent reviews the calculated amounts
8. Rental agent generates agreement document
9. Customer signs the agreement
10. Rental agent finalizes and saves the agreement

### Extend Rental Agreement

**User Story:** As a rental agent, I want to extend an existing rental agreement so that customers can keep their vehicles for longer periods when needed.

**Acceptance Criteria:**
- I can search for active agreements
- I can modify the end date of an agreement
- System recalculates fees and payments based on new dates
- System checks vehicle availability for the extended period
- System generates a rental extension document
- The updated agreement is saved with a log of the change

**Use Case:**
1. Customer requests agreement extension
2. Rental agent searches for the active agreement
3. Rental agent selects "Extend Agreement" option
4. Rental agent enters new end date
5. System validates vehicle availability
6. System calculates additional charges
7. Rental agent confirms extension with customer
8. System updates agreement with new end date
9. System generates additional payment items if needed

### Import Bulk Agreements

**User Story:** As a manager, I want to import multiple agreements from a CSV file so that I can quickly set up agreements from legacy data or batch processes.

**Acceptance Criteria:**
- I can upload a CSV file with agreement data
- System validates all required fields are present
- System checks for vehicle availability conflicts
- System provides an error report for invalid entries
- Valid agreements are created in the system
- I can review a summary of imported agreements

**Use Case:**
1. Manager navigates to "Agreements" section
2. Manager selects "Import Agreements" option
3. Manager uploads prepared CSV file
4. System validates the file format and data
5. System displays validation results
6. Manager reviews any errors and confirms import
7. System creates agreements from valid entries
8. System provides an import summary report

## 4. Payment Management

### Record Payment

**User Story:** As a finance officer, I want to record payments received for rental agreements so that I can keep track of customer balances.

**Acceptance Criteria:**
- I can search for an agreement by number or customer name
- I can enter payment amount, date, and method
- I can add a reference number and notes
- System applies payment to the agreement balance
- System updates payment status based on remaining balance
- System generates a payment receipt
- Payment history is updated in the customer record

**Use Case:**
1. Finance officer navigates to "Payments" section
2. Finance officer searches for the agreement
3. Finance officer clicks "Record Payment" button
4. Finance officer enters payment details
5. Finance officer submits the payment
6. System updates agreement balance
7. System generates a receipt
8. System logs the payment in history

### View Payment History

**User Story:** As a finance officer, I want to view payment history for an agreement so that I can track all financial transactions related to a rental.

**Acceptance Criteria:**
- I can see a chronological list of all payments
- I can filter payments by status (Paid, Partial, Overdue)
- I can see payment method and reference numbers
- I can identify late or missed payments
- I can export payment history to PDF or Excel

**Use Case:**
1. Finance officer navigates to agreement details
2. Finance officer selects "Payment History" tab
3. System displays all payments for the agreement
4. Finance officer filters by payment status
5. Finance officer reviews payment patterns
6. Finance officer exports payment report as needed

### Generate Payment Schedule

**User Story:** As a finance officer, I want to generate a payment schedule for recurring payments so that customers know when payments are due.

**Acceptance Criteria:**
- I can set payment frequency (weekly, monthly, etc.)
- I can set first payment date and amount
- System generates all payment dates for the agreement term
- I can adjust individual payment dates or amounts if needed
- I can share the schedule with the customer
- System will use this schedule for payment reminders

**Use Case:**
1. Finance officer creates or edits an agreement
2. Finance officer sets payment terms and frequency
3. Finance officer clicks "Generate Schedule" button
4. System calculates all payment dates and amounts
5. Finance officer reviews the generated schedule
6. Finance officer makes any necessary adjustments
7. Schedule is saved with the agreement

## 5. Vehicle Maintenance

### Schedule Maintenance

**User Story:** As a fleet manager, I want to schedule maintenance for vehicles so that they remain in good condition and comply with safety requirements.

**Acceptance Criteria:**
- I can select a vehicle from inventory
- I can select maintenance type (routine, repair, inspection)
- I can set date and time for maintenance
- I can assign a service provider
- System checks for conflicts with rental agreements
- System updates vehicle status for the maintenance period

**Use Case:**
1. Fleet manager navigates to "Maintenance" section
2. Fleet manager selects "Schedule Maintenance" button
3. Fleet manager selects a vehicle
4. Fleet manager enters maintenance details
5. Fleet manager sets date and time
6. System checks for rental conflicts
7. Fleet manager confirms the schedule
8. System updates vehicle status for that period

### Record Maintenance Completion

**User Story:** As a fleet manager, I want to record completed maintenance activities so that I can track vehicle maintenance history and costs.

**Acceptance Criteria:**
- I can find scheduled maintenance items
- I can enter completion date and actual costs
- I can upload supporting documents (invoices, inspection reports)
- I can add notes about the service performed
- System updates vehicle status back to "Available"
- Maintenance history is updated in the vehicle record

**Use Case:**
1. Fleet manager navigates to "Maintenance" section
2. Fleet manager filters for "In Progress" maintenance
3. Fleet manager selects the completed maintenance item
4. Fleet manager enters completion details and costs
5. Fleet manager uploads supporting documents
6. Fleet manager submits the completion form
7. System updates maintenance status to "Completed"
8. System updates vehicle status to "Available"

## 6. Legal and Compliance

### Create Legal Case

**User Story:** As a legal officer, I want to create and track legal cases related to rentals so that I can manage legal issues efficiently.

**Acceptance Criteria:**
- I can create a new legal case linked to a customer or agreement
- I can categorize the case (payment dispute, accident, damage, etc.)
- I can set priority and status
- I can add detailed case information and documents
- I can assign follow-up dates and reminders
- The case appears in the legal dashboard

**Use Case:**
1. Legal officer navigates to "Legal" section
2. Legal officer clicks "Create Case" button
3. Legal officer selects the related customer and/or agreement
4. Legal officer enters case details and category
5. Legal officer sets priority and status
6. Legal officer uploads relevant documents
7. Legal officer submits the case
8. System creates the legal case record

### Track Traffic Fines

**User Story:** As a legal officer, I want to record and track traffic fines associated with rental vehicles so that I can ensure they are paid and properly assigned.

**Acceptance Criteria:**
- I can enter fine details (date, amount, violation type)
- I can associate the fine with a vehicle and agreement
- I can upload the fine documentation
- I can track fine status (pending, paid, contested)
- I can record payment details when the fine is paid
- Fine history is visible in vehicle and agreement records

**Use Case:**
1. Legal officer receives a traffic fine notice
2. Legal officer navigates to "Traffic Fines" section
3. Legal officer clicks "Record Fine" button
4. Legal officer enters fine details
5. Legal officer associates fine with vehicle and agreement
6. Legal officer uploads fine documentation
7. Legal officer sets status to "Pending"
8. System records the fine in the database

## 7. Reporting

### Generate Financial Report

**User Story:** As a manager, I want to generate financial reports so that I can analyze business performance.

**Acceptance Criteria:**
- I can select report type (revenue, expenses, profit)
- I can set date range for the report
- I can filter by vehicle type, customer type, etc.
- System generates accurate calculations based on filters
- I can view graphical representation of data
- I can export reports to PDF or Excel

**Use Case:**
1. Manager navigates to "Reports" section
2. Manager selects "Financial Report" option
3. Manager sets report parameters and filters
4. Manager clicks "Generate Report" button
5. System processes the data and displays the report
6. Manager reviews the graphical and tabular data
7. Manager exports the report in desired format

### Vehicle Utilization Report

**User Story:** As a fleet manager, I want to view vehicle utilization reports so that I can optimize the fleet composition and identify underperforming assets.

**Acceptance Criteria:**
- I can see utilization percentage for each vehicle
- I can filter by date range, vehicle type, etc.
- I can identify vehicles with low utilization
- I can see revenue generated per vehicle
- I can compare utilization across different periods
- I can export the report for further analysis

**Use Case:**
1. Fleet manager navigates to "Reports" section
2. Fleet manager selects "Vehicle Utilization" report
3. Fleet manager sets date range and filters
4. System generates utilization metrics and visualizations
5. Fleet manager reviews the data to identify trends
6. Fleet manager exports the report for presentation
7. Fleet manager uses insights for fleet optimization decisions

## 8. User Management

### Create User Account

**User Story:** As an administrator, I want to create user accounts with specific roles so that staff members can access appropriate system features.

**Acceptance Criteria:**
- I can create a new user with basic information
- I can assign one or more roles to the user
- I can set initial password or send setup email
- System enforces password complexity requirements
- New user appears in the user management list
- User access is limited to assigned role permissions

**Use Case:**
1. Administrator navigates to "User Management" section
2. Administrator clicks "Add User" button
3. Administrator enters user details
4. Administrator selects appropriate role(s)
5. Administrator chooses password setup method
6. System creates the user account
7. System sends welcome email with setup instructions
8. New user can log in with assigned permissions

### Modify User Permissions

**User Story:** As an administrator, I want to modify user permissions as job roles change so that access remains appropriate and secure.

**Acceptance Criteria:**
- I can search and select any user account
- I can view current role and permission assignments
- I can add or remove roles from the user
- I can modify individual permissions if needed
- Changes take effect immediately
- System logs all permission changes

**Use Case:**
1. Administrator navigates to "User Management" section
2. Administrator searches for the user to modify
3. Administrator views current permissions
4. Administrator changes role assignments
5. Administrator adjusts specific permissions if needed
6. Administrator saves the changes
7. System updates the user's access rights
8. System logs the permission changes

## 9. Mobile Operations

### Mobile Vehicle Inspection

**User Story:** As a field agent, I want to perform vehicle inspections using my mobile device so that I can document vehicle condition efficiently.

**Acceptance Criteria:**
- I can access the inspection form on my mobile device
- I can select the vehicle by scanning a QR code or entering ID
- I can complete a comprehensive inspection checklist
- I can take photos of the vehicle condition
- I can capture customer signature on the inspection
- The inspection is synced to the system when online

**Use Case:**
1. Field agent opens mobile app
2. Field agent navigates to "Inspections" section
3. Field agent scans vehicle QR code or enters ID
4. System loads the inspection form with vehicle details
5. Field agent completes the inspection checklist
6. Field agent takes photos of any damage or issues
7. Customer reviews and signs the inspection
8. Field agent submits the inspection
9. System syncs the inspection to the central database

### Mobile Payment Collection

**User Story:** As a field agent, I want to collect and record payments while in the field so that I can provide immediate service to customers.

**Acceptance Criteria:**
- I can search for customer agreements on my mobile device
- I can view outstanding balances and payment schedule
- I can record cash payments received in the field
- I can process card payments through a mobile terminal
- I can email or SMS receipts to customers
- Payments sync to the central system when online

**Use Case:**
1. Field agent meets customer for payment
2. Field agent opens mobile app and searches for customer
3. Field agent views outstanding balance
4. Field agent enters payment amount and method
5. For card payments, customer pays via mobile terminal
6. Field agent records the payment in the app
7. Field agent sends digital receipt to customer
8. Payment is synced to central system
9. Customer's balance is updated

---

*Document Version: 1.0*  
*Last Updated: April 28, 2025*  
*Approved by: [Pending Approval]*
