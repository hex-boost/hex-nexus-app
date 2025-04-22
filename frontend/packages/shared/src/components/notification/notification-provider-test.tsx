import * as AccountStore from '@/stores/useAccountStore.ts';
import { NOTIFICATION_EVENTS } from '@/types/notification.ts';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render } from '@testing-library/react';
import { Utils } from '@utils';
import { toast } from 'sonner';
import { NotificationProvider } from './notification-provider';

// Mock dependencies
jest.mock('@utils', () => ({
  ForceCloseAllClients: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('sonner', () => ({
  toast: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: jest.fn(({ onMessage }) => {
    // Save reference to message handler for testing
    globalThis.mockWebSocketHandler = onMessage;
  }),
}));

// Mock stores
jest.mock('@/stores/useAccountStore.ts', () => ({
  useAccountStore: () => ({
    isNexusAccount: false, // Default to false, will override in specific tests
  }),
}));

jest.mock('@/stores/usePremiumPaymentModalStore', () => {
  const mockOpen = jest.fn();
  return {
    usePremiumPaymentModalStore: () => ({
      open: mockOpen,
    }),
    mockPremiumModalOpen: mockOpen,
  };
});

jest.mock('@/hooks/useMembership.ts', () => ({
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
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    render(
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <div>Test children</div>
        </NotificationProvider>
      </QueryClientProvider>,
    );

    return globalThis.mockWebSocketHandler;
  };

  test('should add regular notification and invalidate queries', () => {
    // Setup
    const handleMessage = renderComponent();
    const queryInvalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    // Regular notification
    const testNotification = {
      documentId: '123',
      event: 'test_event',
      title: 'Test Notification',
      isSeen: false,
    };

    // Call handleNotification via WebSocket handler
    act(() => {
      handleMessage(testNotification);
    });

    // Assertions
    expect(queryInvalidateSpy).toHaveBeenCalledWith({ queryKey: ['users', 'me'] });
  });

  test('should open premium modal for MEMBERSHIP_PAID notification', () => {
    // Setup
    const handleMessage = renderComponent();
    const mockPremiumModalOpen = jest.requireMock('@/stores/usePremiumPaymentModalStore').mockPremiumModalOpen;
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
    expect(mockPremiumModalOpen).toHaveBeenCalledWith({
      amount: 9.99,
      tier: 'Premium',
      paymentMethod: 'credit_card',
    });
  });

  test('should force close clients for ACCOUNT_EXPIRED when is Nexus account', async () => {
    // Mock Nexus account
    jest.spyOn(AccountStore, 'useAccountStore').mockReturnValue({
      isNexusAccount: true,
    });
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
      // Wait for promise resolution
      await Promise.resolve();
    });

    // Assertions
    expect(Utils.ForceCloseAllClients).toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith(
      'Your account has expired, and the league has been closed.',
    );
  });

  test('should not close clients for ACCOUNT_EXPIRED when not Nexus account', async () => {
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
    expect(Utils.ForceCloseAllClients).not.toHaveBeenCalled();
    expect(toast.info).not.toHaveBeenCalled();
  });
});
