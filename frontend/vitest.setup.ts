import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { handlers } from './handlers';
import '@testing-library/jest-dom';

vi.mock('@wailsio/runtime', () => {
  return {
    LogDebug: vi.fn(),
    LogInfo: vi.fn(),
    LogWarning: vi.fn(),
    LogError: vi.fn(),
    WindowSetTitle: vi.fn(),
    // Add any other methods your tests might need
    EventsOn: vi.fn(),
    EventsOff: vi.fn(),
    EventsEmit: vi.fn(),
    // Fix: Structure Call as an object with ByName method
    Call: {
      ByName: vi.fn().mockResolvedValue({}),
    },
  };
});

// Setup MSW server
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());
