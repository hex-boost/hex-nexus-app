import type { ServerNotification } from '@/types/types.ts';
import type { Socket } from 'socket.io-client';
import { useUserStore } from '@/stores/useUserStore.ts';
import { useCallback, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

type UseWebSocketOptions = {
  url: string;
  onMessage: (event: ServerNotification) => void;
};

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
    socketRef.current = io(url, {
      auth: {
        token: jwt,
      },
    });
    socketRef.current.on('connect', handleConnect);
    socketRef.current.on('disconnect', handleDisconnect);
    socketRef.current.on('error', handleError);
    socketRef.current.on('message', onMessage);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', handleConnect);
        socketRef.current.off('disconnect', handleDisconnect);
        socketRef.current.off('error', handleError);
        socketRef.current.off('message', onMessage);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [url, jwt, handleConnect, handleDisconnect, handleError, onMessage]);

  return {};
}
