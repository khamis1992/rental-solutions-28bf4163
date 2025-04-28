# Test Suite for Rental Solutions

This project uses **Jest** for unit/integration testing and **Cypress** for end-to-end (E2E) testing.

---

## 1. Unit & Integration Tests (Jest)

- All unit/integration tests are located in the `__tests__/` directory.
- Tests cover utility functions, hooks, and business logic.
- Mocks are used for database and API dependencies.

### Running Jest Tests

```
npm install
npm run test
```

- To view code coverage:
```
npm run test -- --coverage
```

---

## 2. End-to-End (E2E) Tests (Cypress)

- E2E tests are located in the `e2e/` directory.
- Simulate real user workflows: authentication, navigation, CRUD, etc.

### Running Cypress Tests

1. Start your dev server (e.g., with Vite):
   ```
npm run dev
```
2. In a new terminal, run:
   ```
npx cypress open
```
   or headless:
   ```
npx cypress run
```

---

## 3. Test Coverage

- Jest coverage reports are output to the `coverage/` directory.
- Aim for >80% coverage on business logic and critical workflows.

---

## 4. Adding Tests

- Place new unit/integration tests in `__tests__/`.
- Place new E2E tests in `e2e/`.
- Use mocks for APIs, database, and external dependencies in unit tests.

---

## 5. Troubleshooting

- If a test fails, check the error output for details.
- Ensure all dependencies are installed and the dev server is running for E2E tests.

---

## 6. Example Scripts (add to package.json if not present)

```
"scripts": {
  "test": "jest --passWithNoTests",
  "test:coverage": "jest --coverage",
  "test:e2e": "cypress run"
}
```

---

## 7. Dependencies
- Jest
- @testing-library/react
- ts-jest
- Cypress

---

For any questions, see the documentation or contact the project maintainer.
