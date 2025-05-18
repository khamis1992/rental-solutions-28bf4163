# Microservice Migration Plan

This document outlines a phased approach for extracting microservices from the existing monolith.
The goal is to gradually split off services that provide the highest benefit when isolated, beginning with the payment functionality.

## Why Extract Microservices?

- **Independent scaling** – critical services like payments often require special scaling or performance tuning.
- **Security** – isolating sensitive payment logic reduces the attack surface and allows tighter controls.
- **Focused deployments** – each service can be updated or deployed without affecting the rest of the system.

## Recommended First Candidate: Payment Service

The [`PaymentService`](../src/services/PaymentService.ts) is a good starting point because:

1. It has clear boundaries as described in [service-boundaries](service-boundaries.md).
2. Payment operations typically involve complex business rules and external integrations.
3. The domain is relatively self‑contained, making it easier to extract.

### Extraction Steps

1. **Define API Contracts** – Document endpoints for recording, updating, listing and deleting payments. This mirrors the current service methods.
2. **Create Dedicated Database Schema** – Move payment tables to a separate database or schema managed by the new service.
3. **Move Code to New Service** – Implement the API in its own repository using the existing logic from `src/services/PaymentService.ts`.
4. **Integrate via HTTP/Events** – Replace direct function calls with API requests. Continue using events such as `payment.recorded` for cross‑service communication.
5. **Incremental Rollout** – Start routing a portion of payment traffic to the new service while monitoring for issues.

## Next Steps After Payments

Once the payment service is stable, evaluate other bounded contexts for extraction based on:

- Business value and need for independent scaling
- Team ownership and expertise
- Dependencies on other services

Candidates might include agreements or vehicle management, but prioritize areas that deliver the most benefit with minimal coupling.

---
This plan should evolve as the system grows. Begin with payments to gain experience, then continue extracting additional services as needed.
