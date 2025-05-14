---
applyTo: 'Fleet Management System Architecture Overview
1. System Architecture
The system is a fleet management web application built with a modern frontend stack and utilizing Supabase as the backend service, forming a classic client-server architecture with the following key components:

Frontend Framework & Core Technologies
React: Core UI library for building component-based interfaces
Vite: Fast build tool and development server
TypeScript: For static type checking and enhanced developer experience
TanStack React Query: For efficient data fetching, caching, and state management
React Router: For client-side routing
Tailwind CSS: Utility-first CSS framework for styling
Shadcn UI: UI component library based on Radix UI primitives
Backend Services
Supabase: Backend-as-a-Service platform providing:
PostgreSQL database
Authentication services
Storage for files/images
Serverless functions (Edge Functions)
Real-time capabilities
2. Database Design
The database is a PostgreSQL instance hosted on Supabase with a complex schema containing multiple interconnected tables:

Core Domain Tables
vehicles: Fleet inventory with details like make, model, license plate
profiles: User and customer information
leases: Rental agreements connecting vehicles to customers
unified_payments: Payment transactions across the system
maintenance: Vehicle maintenance records
Supporting Tables
traffic_fines: Traffic violations linked to vehicles/customers
legal_cases: Legal proceedings related to agreements
car_installment_contracts: Vehicle purchase installment plans
invoice_templates: Templates for generating invoices
The system uses several database views (e.g., leases_missing_payments) to simplify complex queries and materialized data relationships.

3. Code Organization
The codebase follows a structured organization pattern:

src/
├── components/       # UI components organized by domain
├── contexts/         # React context providers
├── hooks/            # Custom React hooks for business logic
├── integrations/     # Third-party integration code
├── lib/              # Utility libraries and helpers
├── pages/            # Top-level page components
├── services/         # Service layer for API communication
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
4. Key Subsystems
Authentication & User Management
Built on Supabase Auth with JWT-based session management
Role-based access control with protected routes
User profile management with context providers
Vehicle Fleet Management
Vehicle inventory tracking
Vehicle status management (available, rented, maintenance)
Vehicle documents and images storage
Agreement Management
Rental contract creation and management
Customer assignment to vehicles
Contract term tracking
Payment schedule generation
Financial Management
Payment tracking and processing
Financial analytics and reporting
Invoice generation
Car installment contract management
Receipt scanning and expense tracking
Maintenance System
Maintenance scheduling and history
Service records
Parts inventory management
Legal & Compliance
Traffic fine tracking and management
Legal case management for disputes
Document generation and template management
5. API & Data Flow Architecture
The application uses a multi-layered approach to data access:

UI Components: Present data to users and capture interactions
Custom Hooks: Encapsulate business logic and state management
Services Layer: Abstract API communication details
API Client: Handle communication with Supabase
Database: Store and retrieve application data
Data flow follows a predictable pattern:

Components use hooks to access data and trigger actions
Hooks use services and React Query to manage state and perform operations
Services use the Supabase client to make database calls
Responses flow back up through the layers with appropriate transformations
6. Error Handling
The system implements comprehensive error handling:

Enhanced error handling in API calls
Toast notifications for user feedback
Error boundaries for component failures
Automatic retries for network issues with exponential backoff
7. Performance Optimizations
Several performance optimization techniques are employed:

React Query for efficient data fetching and caching
Conditional rendering to minimize unnecessary updates
Database connection monitoring and health checks
Retry mechanisms for network resilience
Pagination for data-heavy tables
8. Common Error-Prone Areas
Type Inconsistencies: Multiple type definitions for the same entity exist across the codebase
Data Transformation Complexity: Transformations between API and UI representations
Status Handling: Inconsistent status enums across components
Database Connection Issues: Related to network reliability and connection management
Missing Payment Records: Logic for payment schedule generation and tracking
9. Bottlenecks and Improvement Areas
Database Schema Consistency: Evolving database schema with potential redundancy
Type Management: Multiple overlapping type definitions causing compatibility issues
Error Handling Standardization: Inconsistent error handling approaches
Cache Invalidation Strategy: Needs more thorough implementation
Code Duplication: Payment processing logic duplicated across components
Testing Coverage: Limited automated testing visible in the codebase
API Abstraction: Inconsistent approach to API interaction patterns
10. Key Dependencies
The system relies on numerous external libraries:

React ecosystem (router, hook-form)
TanStack tools (React Query, React Table)
Supabase client libraries
UI component libraries (Radix UI, Shadcn)
Utilities like date-fns, uuid, and Zod for validation
Improvement Recommendations
Type Consolidation: Create a single source of truth for entity types
Service Layer Standardization: Standardize service interfaces and error handling
Testing Strategy: Implement comprehensive testing for critical paths
Performance Monitoring: Add telemetry for performance tracking
Documentation: Improve component and API documentation
Refactoring: Break large components and functions into smaller, focused units
State Management: Consider more centralized state management for complex workflows
Database Schema Review: Normalize and optimize database schema '
---
Coding standards, domain knowledge, and preferences that AI should follow.