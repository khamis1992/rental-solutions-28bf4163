module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/types.ts',
    '!src/**/financials-types.ts',
  ],
};
