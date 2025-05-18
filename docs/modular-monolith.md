# Modular Monolith Architecture

This project is organized as a modular monolith. Each domain is implemented as a separate service module under `src/services`.

## Guidelines

- **Strict boundaries**: Service modules must not import from other services directly. Shared code belongs in `src/services/base` or other common utility directories.
- **Public APIs**: Each service exposes a small public API through its main file. Consumers should rely only on these exported functions or classes.
- **Validation**: Run `npm run check-boundaries` to ensure there are no cross-module imports.

Following these rules keeps the codebase maintainable and prepares services for potential extraction into microservices.
