# Fleet Management System Database Schema

This document provides a comprehensive overview of the database schema used in the Fleet Management System. It serves as the source of truth for database structure, relationships, and field definitions.

## Core Tables

### vehicles

Stores information about all vehicles in the fleet.

| Column             | Type         | Description                               | Constraints        |
|--------------------|--------------|-------------------------------------------|-------------------|
| id                 | uuid         | Primary key                               | PRIMARY KEY       |
| status             | vehicle_status | Current status of the vehicle           | NOT NULL          |
| make               | text         | Manufacturer of the vehicle               | NOT NULL          |
| model              | text         | Model of the vehicle                      | NOT NULL          |
| year               | integer      | Year of manufacture                       | NOT NULL          |
| license_plate      | text         | License plate number                      | NOT NULL, UNIQUE  |
| vin                | text         | Vehicle identification number             | NOT NULL, UNIQUE  |
| color              | text         | Vehicle color                             | NULL              |
| image_url          | text         | URL to the vehicle image                  | NULL              |
| mileage            | integer      | Current mileage                           | NULL              |
| rent_amount        | numeric      | Daily rental rate                         | NULL              |
| description        | text         | Additional description                    | NULL              |
| location           | text         | Current location/branch                   | NULL              |
| insurance_company  | text         | Insurance provider name                   | NULL              |
| insurance_expiry   | timestamp    | Insurance expiry date                     | NULL              |
| vehicle_type_id    | uuid         | Reference to vehicle types                | FOREIGN KEY       |
| notes              | text         | Additional notes                          | NULL              |
| is_test_data       | boolean      | Indicates if this is test data            | DEFAULT FALSE     |
| created_at         | timestamp    | Creation timestamp                        | DEFAULT now()     |
| updated_at         | timestamp    | Last update timestamp                     | DEFAULT now()     |

### profiles

Stores information about customers and users.

| Column             | Type         | Description                               | Constraints        |
|--------------------|--------------|-------------------------------------------|-------------------|
| id                 | uuid         | Primary key                               | PRIMARY KEY       |
| auth_id            | uuid         | Reference to auth.users                   | NULL              |
| first_name         | text         | First name                                | NOT NULL          |
| last_name          | text         | Last name                                 | NOT NULL          |
| email              | text         | Email address                             | NULL, UNIQUE      |
| phone              | text         | Phone number                              | NULL              |
| id_number          | text         | National ID or passport                   | NULL              |
| address            | text         | Physical address                          | NULL              |
| city               | text         | City                                      | NULL              |
| country            | text         | Country                                   | NULL              |
| postal_code        | text         | Postal code                               | NULL              |
| customer_type      | text         | Type of customer (individual/company)     | NULL              |
| is_active          | boolean      | Whether the profile is active             | DEFAULT TRUE      |
| notes              | text         | Additional notes                          | NULL              |
| created_at         | timestamp    | Creation timestamp                        | DEFAULT now()     |
| updated_at         | timestamp    | Last update timestamp                     | DEFAULT now()     |

### leases

Stores rental agreements between customers and vehicles.

| Column             | Type         | Description                               | Constraints        |
|--------------------|--------------|-------------------------------------------|-------------------|
| id                 | uuid         | Primary key                               | PRIMARY KEY       |
| status             | lease_status | Current status of the agreement           | NOT NULL          |
| customer_id        | uuid         | Reference to customer profile             | FOREIGN KEY       |
| vehicle_id         | uuid         | Reference to vehicle                      | FOREIGN KEY       |
| agreement_number   | text         | Unique agreement identifier               | UNIQUE            |
| start_date         | date         | Agreement start date                      | NULL              |
| end_date           | date         | Agreement end date                        | NULL              |
| rent_amount        | numeric      | Rental amount                             | NULL              |
| total_amount       | numeric      | Total contract value                      | NOT NULL          |
| deposit_amount     | numeric      | Security deposit amount                   | NULL              |
| daily_late_fee     | numeric      | Late payment fee per day                  | NULL              |
| agreement_type     | text         | Type of agreement                         | NOT NULL          |
| agreement_duration | jsonb        | Duration details (frequency, period)      | NULL              |
| rent_due_day       | integer      | Day of month when rent is due             | NULL              |
| notes              | text         | Additional notes                          | NULL              |
| last_payment_date  | timestamp    | Date of last payment                      | NULL              |
| created_at         | timestamp    | Creation timestamp                        | DEFAULT now()     |
| updated_at         | timestamp    | Last update timestamp                     | DEFAULT now()     |

### unified_payments

Central payment tracking for all transactions.

| Column             | Type         | Description                               | Constraints        |
|--------------------|--------------|-------------------------------------------|-------------------|
| id                 | uuid         | Primary key                               | PRIMARY KEY       |
| entity_id          | uuid         | ID of related entity (lease, etc.)        | NOT NULL          |
| entity_type        | text         | Type of entity (lease, maintenance, etc.) | NOT NULL          |
| amount             | numeric      | Payment amount                            | NOT NULL          |
| payment_date       | timestamp    | Date of payment                           | NOT NULL          |
| payment_method     | text         | Method of payment                         | NULL              |
| reference_number   | text         | Payment reference number                  | NULL              |
| description        | text         | Payment description                       | NULL              |
| status             | text         | Payment status                            | NOT NULL          |
| payment_type       | text         | Type of payment (rent, deposit, etc.)     | NOT NULL          |
| created_by         | uuid         | User who created the payment              | NULL              |
| receipt_url        | text         | URL to receipt image                      | NULL              |
| created_at         | timestamp    | Creation timestamp                        | DEFAULT now()     |
| updated_at         | timestamp    | Last update timestamp                     | DEFAULT now()     |

### maintenance

Vehicle maintenance records.

| Column             | Type         | Description                               | Constraints        |
|--------------------|--------------|-------------------------------------------|-------------------|
| id                 | uuid         | Primary key                               | PRIMARY KEY       |
| vehicle_id         | uuid         | Reference to vehicle                      | FOREIGN KEY       |
| maintenance_type   | text         | Type of maintenance                       | NOT NULL          |
| cost               | numeric      | Maintenance cost                          | NULL              |
| status             | text         | Status of the maintenance                 | NOT NULL          |
| start_date         | timestamp    | Start date of maintenance                 | NULL              |
| end_date           | timestamp    | End date of maintenance                   | NULL              |
| description        | text         | Detailed description                      | NULL              |
| service_provider   | text         | Maintenance service provider              | NULL              |
| created_at         | timestamp    | Creation timestamp                        | DEFAULT now()     |
| updated_at         | timestamp    | Last update timestamp                     | DEFAULT now()     |

## Supporting Tables

### payment_schedules

Payment schedule for lease agreements.

| Column             | Type         | Description                               | Constraints        |
|--------------------|--------------|-------------------------------------------|-------------------|
| id                 | uuid         | Primary key                               | PRIMARY KEY       |
| lease_id           | uuid         | Reference to lease                        | FOREIGN KEY       |
| due_date           | date         | Payment due date                          | NOT NULL          |
| amount             | numeric      | Payment amount                            | NOT NULL          |
| status             | text         | Payment status                            | NOT NULL          |
| payment_id         | uuid         | Reference to actual payment               | FOREIGN KEY, NULL |
| created_at         | timestamp    | Creation timestamp                        | DEFAULT now()     |
| updated_at         | timestamp    | Last update timestamp                     | DEFAULT now()     |

### vehicle_types

Vehicle categories and classifications.

| Column             | Type         | Description                               | Constraints        |
|--------------------|--------------|-------------------------------------------|-------------------|
| id                 | uuid         | Primary key                               | PRIMARY KEY       |
| name               | text         | Type name                                 | NOT NULL          |
| description        | text         | Type description                          | NULL              |
| daily_rate         | numeric      | Standard daily rate                       | NULL              |
| is_active          | boolean      | Whether this type is active               | DEFAULT TRUE      |
| created_at         | timestamp    | Creation timestamp                        | DEFAULT now()     |
| updated_at         | timestamp    | Last update timestamp                     | DEFAULT now()     |

### traffic_fines

Traffic violations linked to vehicles.

| Column             | Type         | Description                               | Constraints        |
|--------------------|--------------|-------------------------------------------|-------------------|
| id                 | uuid         | Primary key                               | PRIMARY KEY       |
| vehicle_id         | uuid         | Reference to vehicle                      | FOREIGN KEY       |
| fine_date          | timestamp    | Date of the fine                          | NOT NULL          |
| amount             | numeric      | Fine amount                               | NOT NULL          |
| description        | text         | Fine description                          | NULL              |
| fine_number        | text         | Reference number                          | NULL              |
| location           | text         | Location of violation                     | NULL              |
| status             | text         | Fine status                               | NOT NULL          |
| customer_id        | uuid         | Customer responsible for fine             | FOREIGN KEY, NULL |
| created_at         | timestamp    | Creation timestamp                        | DEFAULT now()     |
| updated_at         | timestamp    | Last update timestamp                     | DEFAULT now()     |

### legal_cases

Legal proceedings related to vehicles or agreements.

| Column             | Type         | Description                               | Constraints        |
|--------------------|--------------|-------------------------------------------|-------------------|
| id                 | uuid         | Primary key                               | PRIMARY KEY       |
| case_number        | text         | Case reference number                     | NULL              |
| case_type          | text         | Type of legal case                        | NOT NULL          |
| vehicle_id         | uuid         | Associated vehicle                        | FOREIGN KEY, NULL |
| customer_id        | uuid         | Associated customer                       | FOREIGN KEY, NULL |
| lease_id           | uuid         | Associated lease                          | FOREIGN KEY, NULL |
| status             | text         | Case status                               | NOT NULL          |
| description        | text         | Case description                          | NULL              |
| filing_date        | timestamp    | Date case was filed                       | NULL              |
| court_date         | timestamp    | Court appearance date                     | NULL              |
| resolution_date    | timestamp    | Date of resolution                        | NULL              |
| resolution_details | text         | Details of resolution                     | NULL              |
| created_at         | timestamp    | Creation timestamp                        | DEFAULT now()     |
| updated_at         | timestamp    | Last update timestamp                     | DEFAULT now()     |

## Enums

### vehicle_status

```sql
CREATE TYPE vehicle_status AS ENUM (
  'available',
  'rented',
  'maintenance',
  'retired',
  'police_station',
  'accident',
  'stolen',
  'reserved'
);
```

### lease_status

```sql
CREATE TYPE lease_status AS ENUM (
  'active',
  'pending',
  'completed',
  'cancelled',
  'pending_payment',
  'pending_deposit',
  'draft',
  'terminated',
  'archived',
  'closed'
);
```

## Database Views

### leases_missing_payments

View that identifies leases with missing payment schedules.

```sql
CREATE VIEW leases_missing_payments AS
SELECT l.id, l.agreement_number, l.customer_id, l.vehicle_id, l.start_date, l.end_date
FROM leases l
LEFT JOIN payment_schedules ps ON ps.lease_id = l.id
WHERE l.status = 'active'
AND (ps.id IS NULL OR (
  SELECT COUNT(*) FROM payment_schedules 
  WHERE lease_id = l.id
) < EXTRACT(EPOCH FROM (l.end_date - l.start_date)) / (60*60*24*30));
```

### vehicle_revenue_summary

View that calculates revenue generated by each vehicle.

```sql
CREATE VIEW vehicle_revenue_summary AS
SELECT 
  v.id,
  v.make,
  v.model,
  v.license_plate,
  COUNT(DISTINCT l.id) AS total_leases,
  SUM(up.amount) AS total_revenue,
  COALESCE(SUM(m.cost), 0) AS maintenance_costs,
  COALESCE(SUM(up.amount), 0) - COALESCE(SUM(m.cost), 0) AS net_revenue
FROM vehicles v
LEFT JOIN leases l ON l.vehicle_id = v.id
LEFT JOIN unified_payments up ON up.entity_id = l.id AND up.entity_type = 'lease'
LEFT JOIN maintenance m ON m.vehicle_id = v.id
GROUP BY v.id, v.make, v.model, v.license_plate;
```

## Relationships and Foreign Keys

- `vehicles.vehicle_type_id` → `vehicle_types.id`
- `leases.customer_id` → `profiles.id` (CASCADE DELETE)
- `leases.vehicle_id` → `vehicles.id`
- `maintenance.vehicle_id` → `vehicles.id`
- `payment_schedules.lease_id` → `leases.id` (CASCADE DELETE)
- `payment_schedules.payment_id` → `unified_payments.id`
- `traffic_fines.vehicle_id` → `vehicles.id`
- `traffic_fines.customer_id` → `profiles.id`
- `legal_cases.vehicle_id` → `vehicles.id`
- `legal_cases.customer_id` → `profiles.id`
- `legal_cases.lease_id` → `leases.id`

## Indexes

- `vehicles` - Indexes on `license_plate`, `vin`, `status`
- `profiles` - Indexes on `email`, `id_number`
- `leases` - Indexes on `agreement_number`, `customer_id`, `vehicle_id`, `status`
- `unified_payments` - Indexes on `entity_id`, `entity_type`, `payment_date`
- `payment_schedules` - Indexes on `lease_id`, `due_date`

This document should be kept updated whenever database schema changes are made to ensure it remains the source of truth for the application.
