// frontend/src/hooks/use-websocket.tsx
import type { ServerNotification } from '@/types/types.ts';
import type { Socket } from 'socket.io-client';
import { useUserStore } from '@/stores/useUserStore.ts';
import { useCallback, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

type UseWebSocketOptions = {
  url: string;
  onMessage: (event: ServerNotification) => void;
};

// Global reference to store the socket instance
let globalSocket: Socket | null = null;
let connectionCount = 0;
const NOTIFICATION_EVENTS = {
  SYSTEM_MESSAGE: 'system_message',
  MEMBERSHIP_ENDING: 'membership_ending',
  MEMBERSHIP_ENDED: 'membership_ended',
  MEMBERSHIP_PAID: 'membership_paid',
  ACCOUNT_EXPIRING: 'account_expiring',
  ACCOUNT_EXPIRED: 'account_expired',
  ACCOUNT_RENTED: 'account_rented',
  NEW_UPDATE: 'new_update',
} as const;
export function useWebSocket({
  url,
  onMessage,
}: UseWebSocketOptions) {
  const { jwt } = useUserStore();
  const socketRef = useRef<Socket | null>(null);

  const handleConnect = useCallback(() => {
    console.log('WebSocket connected');
  }, []);

  const handleDisconnect = useCallback((reason: string) => {
    console.log(`WebSocket disconnected. Reason: ${reason}`);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('WebSocket error:', error);
  }, []);

  useEffect(() => {
    // Track active connections
    connectionCount++;

    if (!globalSocket) {
      // Only create a new socket if one doesn't exist
      console.log('Creating new WebSocket connection');
      globalSocket = io(url, {
        auth: { token: jwt },
      });
    } else {
      console.log('Reusing existing WebSocket connection');
      // Update auth token if it changed
      if ('token' in globalSocket.auth && globalSocket.auth.token !== jwt) {
        globalSocket.auth = { token: jwt };
        globalSocket.disconnect().connect();
      }
    }

    socketRef.current = globalSocket;

    // Setup event listeners
    socketRef.current.on('connect', handleConnect);
    socketRef.current.on('disconnect', handleDisconnect);
    socketRef.current.on('error', handleError);
    Object.values(NOTIFICATION_EVENTS).forEach((event) => {
      socketRef.current?.on(event, onMessage);
    });
    return () => {
      // Remove event listeners
      if (socketRef.current) {
        socketRef.current.off('connect', handleConnect);
        socketRef.current.off('disconnect', handleDisconnect);
        socketRef.current.off('error', handleError);
        Object.values(NOTIFICATION_EVENTS).forEach((event) => {
          socketRef.current?.off(event, onMessage);
        });
      }

      // Decrement connection count
      connectionCount--;

      // Only disconnect if no more components are using the socket
      if (connectionCount === 0 && globalSocket) {
        console.log('Closing WebSocket connection - no more subscribers');
        globalSocket.disconnect();
        globalSocket = null;
      }
    };
  }, [url, jwt, handleConnect, handleDisconnect, handleError, onMessage]);

  return {};
}
