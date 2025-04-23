import { vi } from 'vitest';

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
