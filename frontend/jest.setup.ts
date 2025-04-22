// Add Jest extended matchers
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock import.meta.env for tests
// Using process.env as a fallback mechanism for Jest
process.env.VITE_API_URL = 'http://localhost:1337';
process.env.MODE = 'test';
process.env.DEV = 'true';
process.env.PROD = 'false';

// Create a mock object that can be used in place of import.meta.env
globalThis.__VITE_META_ENV__ = {
  VITE_API_URL: 'http://localhost:1337',
  MODE: 'test',
  DEV: true,
  PROD: false,
};

// For compatibility with other code patterns
// Using globalThis instead of global to satisfy ESLint rule
globalThis.process = {
  ...globalThis.process,
  env: {
    VITE_API_URL: 'http://localhost:1337',
  },
};

// Reset all mocks after each test
afterEach(() => {
  jest.resetAllMocks();
});

// Add a Jest mock for import.meta if needed by your tests
jest.mock('@/utils/env', () => ({
  getEnv: key => globalThis.__VITE_META_ENV__[key],
}), { virtual: true });
