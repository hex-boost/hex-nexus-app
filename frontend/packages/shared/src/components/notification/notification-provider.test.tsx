import * as AccountStore from '@/stores/useAccountStore.ts';
import { NOTIFICATION_EVENTS } from '@/types/notification.ts';
import { Manager } from '@leagueManager';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { act, render } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationProvider } from './notification-provider';

// Define hoisted mocks
const mockHandlers = vi.hoisted(() => ({
  mockOpen: vi.fn(),
  // Update the type from null to a function that accepts a notification
  mockWebSocketHandler: vi.fn((_: any) => {}),
}));
type CancellablePromise<T> = Promise<T> & { cancel: () => void };

// Update the useWebSocket mock to use the function
vi.mock('@/hooks/use-websocket', () => ({
  useWebSocket: vi.fn(({ onMessage }) => {
    // Store the real handler in our mock for testing
    mockHandlers.mockWebSocketHandler = onMessage;
  }),
}));
// Mock audio file
vi.mock('@/assets/sounds/notification.ogg', () => ({
  default: 'mocked-audio-file',
}));
// Mock Howler to prevent audio playback errors

const mockHowlInstance = {
  play: vi.fn(),
  unload: vi.fn(),
};

// Update the Howler mock to always return the same instance
vi.mock('howler', () => ({
  Howl: vi.fn(() => mockHowlInstance),
}));// Mock dependencies
vi.mock('@leagueManager', () => ({
  Manager: {
    ForceCloseAllClients: vi.fn().mockImplementation((): CancellablePromise<void> => {
      const promise = Promise.resolve() as CancellablePromise<void>;
      promise.cancel = vi.fn();
      return promise;
    }),
  },
}));
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock stores
vi.mock('@/stores/useAccountStore.ts', () => ({
  useAccountStore: () => ({
    isNexusAccount: false, // Default to false, will override in specific tests
  }),
}));

// Mock premium modal store
vi.mock('@/stores/usePremiumPaymentModalStore', () => ({
  usePremiumPaymentModalStore: () => ({
    open: mockHandlers.mockOpen,
  }),
  mockPremiumModalOpen: mockHandlers.mockOpen,
}));

vi.mock('@/hooks/useMembership.ts', () => ({
  useMembership: () => ({
    pricingPlans: [
      { tier_enum: 'premium', price: 9.99 },
    ],
  }),
}));

describe('handleNotification function', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const renderComponent = () => {
    render(
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <div>Test children</div>
        </NotificationProvider>
      </QueryClientProvider>,
    );

    // Fix: Return the handler from the mockHandlers object, not globalThis
    return mockHandlers.mockWebSocketHandler;
  };

  it('should add regular notification and invalidate queries', () => {
    // Setup
    const handleMessage = renderComponent();
    const queryInvalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // Regular notification
    const testNotification = {
      documentId: '123',
      event: 'test_event',
      title: 'Test Notification',
      isSeen: false,
    };

    // Call handleNotification via WebSocket handler
    act(() => {
      if (handleMessage) {
        handleMessage(testNotification);
      }
    });

    // Assertions
    expect(queryInvalidateSpy).toHaveBeenCalledWith({ queryKey: ['users', 'me'] });
  });

  it('should force close clients for ACCOUNT_EXPIRED when is Nexus account', async () => {
    // Mock Nexus account
    // Mock Nexus account
    vi.spyOn(AccountStore, 'useAccountStore').mockReturnValue({
      isNexusAccount: true,
    });

    let resolvePromise: (value?: unknown) => void;
    const mockPromise: CancellablePromise<void> = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    }) as CancellablePromise<void>;
    mockPromise.cancel = vi.fn();

    // Mock the function to return our controllable promise
    vi.mocked(Manager.ForceCloseAllClients).mockReturnValue(mockPromise);

    // Setup
    const handleMessage = renderComponent();

    // Account expired notification
    const expiredNotification = {
      documentId: '789',
      event: NOTIFICATION_EVENTS.ACCOUNT_EXPIRED,
      title: 'Account Expired',
      isSeen: false,
    };

    // Call handleNotification
    act(() => {
      handleMessage(expiredNotification);
    });

    // Verify ForceCloseAllClients was called
    expect(Manager.ForceCloseAllClients).toHaveBeenCalled();

    // Now resolve the promise to trigger the .then callback
    act(() => {
      resolvePromise();
    });

    // Wait for a tick to ensure the .then callback executes
    await act(async () => {
      await Promise.resolve();
    });

    // Assertions
    expect(toast.info).toHaveBeenCalledWith(
      'Your account has expired, and the league has been closed.',
    );
  });

  it('should not close clients for ACCOUNT_EXPIRED when not Nexus account', async () => {
    // Setup
    const handleMessage = renderComponent();

    // Account expired notification
    const expiredNotification = {
      documentId: '789',
      event: NOTIFICATION_EVENTS.ACCOUNT_EXPIRED,
      title: 'Account Expired',
      isSeen: false,
    };

    // Call handleNotification
    await act(async () => {
      handleMessage(expiredNotification);
      await Promise.resolve();
    });

    // Assertions
    expect(Manager.ForceCloseAllClients).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
  });

  it('should NOT open premium modal for already seen MEMBERSHIP_PAID notification', () => {
    // Setup
    const handleMessage = renderComponent();

    const seenMembershipPaidNotification = {
      documentId: '456',
      event: NOTIFICATION_EVENTS.MEMBERSHIP_PAID,
      title: 'Membership Paid',
      isSeen: true, // Already seen notification
      metadata: {
        tier: 'premium',
        paymentMethod: 'credit_card',
      },
    };

    // Call handleNotification
    act(() => {
      handleMessage(seenMembershipPaidNotification);
    });

    // Verify modal was not opened
    expect(mockHandlers.mockOpen).not.toHaveBeenCalled();
  });

  it('should open premium modal for MEMBERSHIP_PAID notification', () => {
    // Setup
    const handleMessage = renderComponent();

    const membershipPaidNotification = {
      documentId: '456',
      event: NOTIFICATION_EVENTS.MEMBERSHIP_PAID,
      title: 'Membership Paid',
      isSeen: false,
      metadata: {
        tier: 'premium',
        paymentMethod: 'credit_card',
      },
    };

    // Call handleNotification
    act(() => {
      handleMessage(membershipPaidNotification);
    });

    // Assertions
    expect(mockHandlers.mockOpen).toHaveBeenCalledWith({
      amount: 9.99,
      tier: 'Premium',
      paymentMethod: 'credit_card',
    });
  });
});
