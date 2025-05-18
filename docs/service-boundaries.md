# Service Boundaries

This document outlines the logical service boundaries within the monolithic codebase. Each service corresponds to a cohesive domain of the rental management system. Keeping responsibilities well separated helps us migrate features to standalone services in the future.

## Overview

The monolith currently organizes domain logic under `src/services`. Each file exposes business operations for a specific domain:

- **CustomerService** – customer records and profile management
- **VehicleService** – fleet information and maintenance history
- **AgreementService** – rental agreements and lifecycle actions
- **PaymentService** – payment processing and billing

While they live in a single repository, treat each service as an independent boundary with its own database tables and types. Avoid cross‑service data access and share data only through well-defined interfaces.

## Guidelines

1. **No direct data access across services**. A service should read and write only the tables that belong to its domain. Use service method calls when another part of the system needs that data.
2. **Explicit exports**. Each service exposes a small public API. Internal helpers should remain private to the module.
3. **Folder structure**. Services are placed under `src/services`. Subfolders may be used to group related files (repositories, types) inside each domain.
4. **Future extraction**. By honouring these boundaries, we can extract any of the services to its own microservice with minimal changes.

Refer to this document when adding new features or refactoring existing ones. Ensure that new domain logic fits clearly within one of the existing service boundaries or create a new boundary if necessary.
