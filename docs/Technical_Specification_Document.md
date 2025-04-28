
# Technical Specification Document (TSD)

## 1. Introduction

### 1.1 Purpose
This Technical Specification Document (TSD) describes the architectural design, technology stack, and implementation details for the Rental Solutions Vehicle Management System. It serves as a guide for developers, system architects, and IT operations.

### 1.2 Scope
This document covers the technical architecture, data models, API specifications, security implementation, and deployment considerations for the system.

### 1.3 Definitions and Acronyms
- **API**: Application Programming Interface
- **JWT**: JSON Web Token
- **RBAC**: Role-Based Access Control
- **SPA**: Single Page Application
- **ORM**: Object-Relational Mapping
- **CI/CD**: Continuous Integration/Continuous Deployment
- **DRY**: Don't Repeat Yourself

### 1.4 References
- Functional Specification Document
- Business Requirements Document
- UI/UX Design Documentation
- Supabase Documentation
- React Framework Documentation

## 2. System Architecture

### 2.1 Architectural Overview

The Rental Solutions system is built on a modern, modular architecture with the following key components:

- **Frontend**: React-based SPA with TypeScript
- **Backend**: Supabase backend-as-a-service platform
- **Database**: PostgreSQL relational database via Supabase
- **Authentication**: Supabase Auth with JWT
- **Storage**: Supabase Storage for documents and images
- **Functions**: Serverless functions for complex operations

```
┌─────────────────┐      ┌───────────────┐      ┌─────────────────┐
│                 │      │               │      │                 │
│  React Frontend ├──────┤ Supabase API  ├──────┤  PostgreSQL DB  │
│                 │      │               │      │                 │
└─────────────────┘      └───────┬───────┘      └─────────────────┘
                                 │
                         ┌───────┴───────┐
                         │               │
                         │  Supabase     │
                         │  Functions    │
                         │               │
                         └───────────────┘
```

### 2.2 Technology Stack

#### 2.2.1 Frontend
- **Framework**: React 18.x with TypeScript
- **State Management**: Tanstack Query, Zustand
- **Routing**: React Router v6
- **UI Components**: Shadcn/UI, Radix UI
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Data Visualization**: Recharts
- **Date Handling**: date-fns

#### 2.2.2 Backend
- **Platform**: Supabase
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Functions**: Supabase Edge Functions
- **Realtime**: Supabase Realtime for live updates

#### 2.2.3 DevOps
- **Version Control**: Git
- **CI/CD**: GitHub Actions
- **Hosting**: Vercel / Netlify (Frontend), Supabase (Backend)
- **Monitoring**: Sentry, Supabase Monitoring

### 2.3 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend Application                                        │
│                                                             │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐  │
│  │ Authentication│   │ Component     │   │ State         │  │
│  │ Context       │   │ Library       │   │ Management    │  │
│  └───────┬───────┘   └───────┬───────┘   └───────┬───────┘  │
│          │                   │                   │          │
│  ┌───────┴───────────────────┴───────────────────┴───────┐  │
│  │                                                       │  │
│  │                  React Application                    │  │
│  │                                                       │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │                              │
└──────────────────────────────┼──────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    │   Supabase Client   │
                    │                     │
                    └──────────┬──────────┘
                               │
┌──────────────────────────────┼──────────────────────────────┐
│                              │                              │
│  ┌──────────────┐   ┌────────┴─────────┐   ┌────────────┐   │
│  │              │   │                  │   │            │   │
│  │    Auth      │   │      API         │   │  Storage   │   │
│  │              │   │                  │   │            │   │
│  └──────────────┘   └──────────────────┘   └────────────┘   │
│                                                             │
│                      Supabase Backend                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 System Interactions
The system follows a client-server architecture with the React frontend communicating with the Supabase backend via REST API and WebSockets for real-time updates:

1. Authentication flow uses JWT tokens for secure identity verification
2. Database operations are performed via Supabase's PostgreSQL interface
3. File operations use Supabase Storage
4. Complex business logic is implemented in Edge Functions
5. Real-time updates utilize Supabase's WebSocket-based Realtime functionality

## 3. Database Design

### 3.1 Entity Relationship Diagram

The database consists of multiple interconnected entities representing the core business objects of the rental management system:

```
  profiles
    │
    ├─────┐
    │     │
    ▼     │
  leases  │
    │     │
    ├─────┘
    │
    ▼
  vehicles
    │
    ├───────────┬────────────┬───────────┐
    │           │            │           │
    ▼           ▼            ▼           ▼
unified_payments maintenance traffic_fines legal_cases
```

### 3.2 Table Schemas

#### 3.2.1 vehicles
- id: UUID (PK)
- make: TEXT
- model: TEXT
- year: INTEGER
- vin: TEXT
- plate_number: TEXT
- color: TEXT
- status: TEXT
- current_mileage: INTEGER
- base_rate: DECIMAL
- acquisition_date: DATE
- features: JSONB
- images: TEXT[]
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

#### 3.2.2 profiles
- id: UUID (PK)
- user_id: UUID (FK to auth.users)
- full_name: TEXT
- email: TEXT
- phone: TEXT
- address: TEXT
- driver_license: TEXT
- id_number: TEXT
- status: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

#### 3.2.3 leases
- id: UUID (PK)
- agreement_number: TEXT
- customer_id: UUID (FK to profiles)
- vehicle_id: UUID (FK to vehicles)
- start_date: DATE
- end_date: DATE
- status: TEXT
- rent_amount: DECIMAL
- deposit_amount: DECIMAL
- payment_frequency: TEXT
- notes: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

#### 3.2.4 unified_payments
- id: UUID (PK)
- lease_id: UUID (FK to leases)
- amount: DECIMAL
- amount_paid: DECIMAL
- balance: DECIMAL
- payment_date: DATE
- due_date: DATE
- status: TEXT
- payment_method: TEXT
- reference_number: TEXT
- description: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

#### 3.2.5 maintenance
- id: UUID (PK)
- vehicle_id: UUID (FK to vehicles)
- service_type: TEXT
- description: TEXT
- service_date: DATE
- cost: DECIMAL
- odometer_reading: INTEGER
- performed_by: TEXT
- status: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

#### 3.2.6 traffic_fines
- id: UUID (PK)
- vehicle_id: UUID (FK to vehicles)
- lease_id: UUID (FK to leases)
- fine_date: DATE
- amount: DECIMAL
- violation_type: TEXT
- location: TEXT
- status: TEXT
- paid_date: DATE
- reference_number: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

#### 3.2.7 legal_cases
- id: UUID (PK)
- customer_id: UUID (FK to profiles)
- lease_id: UUID (FK to leases)
- case_type: TEXT
- description: TEXT
- status: TEXT
- priority: TEXT
- amount_owed: DECIMAL
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

### 3.3 Indexes and Performance Considerations

#### 3.3.1 Primary Indexes
- All tables have a primary key on the `id` column

#### 3.3.2 Foreign Key Indexes
- vehicles: foreign key index on maintenance, leases
- profiles: foreign key index on leases, legal_cases
- leases: foreign key index on unified_payments, traffic_fines, legal_cases

#### 3.3.3 Performance Indexes
- vehicles: index on status, make, model
- leases: index on status, start_date, end_date, agreement_number
- unified_payments: index on lease_id, due_date, status
- profiles: index on email, full_name

## 4. API Specification

### 4.1 Authentication API

#### 4.1.1 Sign In
- **Endpoint**: POST /auth/signin
- **Parameters**: email, password
- **Response**: JWT token, user profile
- **Error Codes**: 401 (Unauthorized), 422 (Validation Error)

#### 4.1.2 Sign Out
- **Endpoint**: POST /auth/signout
- **Headers**: Authorization with JWT
- **Response**: Success message

#### 4.1.3 Reset Password
- **Endpoint**: POST /auth/reset-password
- **Parameters**: email
- **Response**: Success message

### 4.2 Vehicle API

#### 4.2.1 Get Vehicles
- **Endpoint**: GET /vehicles
- **Parameters**: status, make, model, page, limit
- **Response**: Array of vehicle objects, pagination metadata

#### 4.2.2 Get Vehicle Detail
- **Endpoint**: GET /vehicles/:id
- **Response**: Detailed vehicle object with relationships

#### 4.2.3 Create Vehicle
- **Endpoint**: POST /vehicles
- **Body**: Vehicle details
- **Response**: Created vehicle object

#### 4.2.4 Update Vehicle
- **Endpoint**: PATCH /vehicles/:id
- **Body**: Updated vehicle fields
- **Response**: Updated vehicle object

#### 4.2.5 Delete Vehicle
- **Endpoint**: DELETE /vehicles/:id
- **Response**: Success message

### 4.3 Agreement API

#### 4.3.1 Get Agreements
- **Endpoint**: GET /agreements
- **Parameters**: status, customer_id, vehicle_id, page, limit
- **Response**: Array of agreement objects, pagination metadata

#### 4.3.2 Get Agreement Detail
- **Endpoint**: GET /agreements/:id
- **Response**: Detailed agreement object with relationships

#### 4.3.3 Create Agreement
- **Endpoint**: POST /agreements
- **Body**: Agreement details
- **Response**: Created agreement object

#### 4.3.4 Update Agreement
- **Endpoint**: PATCH /agreements/:id
- **Body**: Updated agreement fields
- **Response**: Updated agreement object

#### 4.3.5 Delete Agreement
- **Endpoint**: DELETE /agreements/:id
- **Response**: Success message

### 4.4 Payment API

#### 4.4.1 Get Payments
- **Endpoint**: GET /payments
- **Parameters**: lease_id, status, page, limit
- **Response**: Array of payment objects, pagination metadata

#### 4.4.2 Create Payment
- **Endpoint**: POST /payments
- **Body**: Payment details
- **Response**: Created payment object

#### 4.4.3 Update Payment
- **Endpoint**: PATCH /payments/:id
- **Body**: Updated payment fields
- **Response**: Updated payment object

## 5. Security Implementation

### 5.1 Authentication and Authorization

#### 5.1.1 JWT Authentication
- All API requests are authenticated using JWT tokens
- Tokens include user ID, role, and expiration time
- JWT secret is stored securely and rotated periodically

#### 5.1.2 Role-Based Access Control
- Users are assigned one or more roles
- Each role has specific permissions
- API endpoints and UI components check permissions before allowing access

### 5.2 Data Security

#### 5.2.1 Encryption
- Sensitive data is encrypted at rest
- All communication uses HTTPS
- File uploads are scanned for malware

#### 5.2.2 Input Validation
- All user inputs are validated using Zod schema validation
- SQL injection protection via parameterized queries
- Rate limiting to prevent brute force attacks

### 5.3 Audit and Compliance

#### 5.3.1 Audit Logging
- All significant actions are logged with user, timestamp, and action details
- Logs are tamper-resistant and stored securely
- Regular audit log reviews

#### 5.3.2 Compliance Features
- Data retention policies
- User consent tracking
- Export and deletion capabilities for GDPR compliance

## 6. Error Handling

### 6.1 Frontend Error Handling
- Global error boundary for React components
- Toast notifications for error feedback
- Graceful degradation for API failures
- Retry logic for transient errors

### 6.2 API Error Responses
- Standard error format across all endpoints
- HTTP status codes used appropriately
- Detailed error messages in development, generic messages in production
- Error codes for client-side error handling

### 6.3 Logging and Monitoring
- Structured logging for both frontend and backend
- Real-time error alerting
- Error aggregation and analysis
- Performance monitoring

## 7. Testing Strategy

### 7.1 Unit Testing
- Component testing with React Testing Library
- Business logic testing with Jest
- High coverage targets for critical code paths

### 7.2 Integration Testing
- API endpoint testing
- Database interaction testing
- Service integration testing

### 7.3 End-to-End Testing
- Critical user journeys testing
- Cross-browser compatibility testing
- Mobile responsiveness testing

## 8. Deployment and DevOps

### 8.1 Deployment Environments
- Development
- Staging
- Production

### 8.2 CI/CD Pipeline
- Automated testing on pull requests
- Automated builds on merges to main branch
- Automated deployment to staging
- Manual promotion to production

### 8.3 Infrastructure
- Frontend hosted on Vercel/Netlify CDN
- Backend services on Supabase
- Database backups and disaster recovery
- Scaling strategies for high-traffic periods

## 9. Type System and Code Organization

### 9.1 TypeScript Type System
- Strict typing throughout the application
- Type definition files for external libraries
- Shared type definitions between frontend and backend
- Generic utility types for common patterns

### 9.2 Code Structure
- Feature-based organization
- Separation of concerns (components, hooks, utils)
- Clear module boundaries
- Shared utility functions

```
src/
  components/      # UI components
    ui/            # Base UI components
    agreements/    # Agreement-specific components
    vehicles/      # Vehicle-specific components
    ...
  hooks/           # React hooks
  utils/           # Utility functions
  lib/             # Core libraries and integrations
  types/           # TypeScript type definitions
  pages/           # Page components
  contexts/        # React contexts
  providers/       # Context providers
```

## 10. Performance Optimization

### 10.1 Frontend Optimizations
- Code splitting and lazy loading
- Memoization of expensive computations
- Image optimization
- Efficient state management
- Bundle size optimization

### 10.2 Backend Optimizations
- Database query optimization
- Indexes for frequent queries
- Caching strategies
- Rate limiting and throttling
- Efficient data fetching patterns

## 11. Accessibility

### 11.1 Accessibility Standards
- WCAG 2.1 AA compliance
- Semantic HTML
- Keyboard navigation
- Screen reader support
- Color contrast requirements

### 11.2 Testing and Validation
- Automated accessibility testing
- Manual accessibility audits
- User testing with assistive technologies

## 12. Internationalization

### 12.1 Text Localization
- Translation key system
- Language selection interface
- Right-to-left layout support
- Format localization for dates, currencies, etc.

## 13. Maintenance and Support

### 13.1 Documentation
- Code documentation standards
- API documentation
- User guides
- Troubleshooting guides

### 13.2 Monitoring
- Performance monitoring
- Error tracking
- Usage analytics
- Health checks

---

*Document Version: 1.0*  
*Last Updated: April 28, 2025*  
*Approved by: [Pending Approval]*
