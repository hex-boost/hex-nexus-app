import type { Socket } from 'socket.io-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

type UseWebSocketOptions = {
  url: string;
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: Event) => void;
  onError?: (event: Event) => void;
  reconnectInterval?: number;
  reconnectAttempts?: number;
  autoReconnect?: boolean;
};

type UseWebSocketReturn = {
  sendMessage: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
  lastMessage: MessageEvent | null;
  readyState: number;
  connectionStatus: 'connecting' | 'open' | 'closing' | 'closed' | 'reconnecting';
  reconnect: () => void;
};

export function useWebSocket({
  url,
  onOpen,
  onMessage,
  onClose,
  onError,
  reconnectInterval = 5000,
  reconnectAttempts = 5,
  autoReconnect = true,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
        'connecting' | 'open' | 'closing' | 'closed' | 'reconnecting'
  >('connecting');
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);

  const socketRef = useRef<Socket | null>(null);

  // Map connection status to WebSocket readyState constants
  const updateReadyState = useCallback((status: typeof connectionStatus) => {
    const stateMap = {
      connecting: WebSocket.CONNECTING,
      open: WebSocket.OPEN,
      closing: WebSocket.CLOSING,
      closed: WebSocket.CLOSED,
      reconnecting: WebSocket.CONNECTING,
    };
    setReadyState(stateMap[status]);
  }, []);

  const handleConnect = useCallback(() => {
    setConnectionStatus('open');
    updateReadyState('open');
    onOpen?.(new Event('open'));
  }, [onOpen, updateReadyState]);

  const handleDisconnect = useCallback((reason: string) => {
    setConnectionStatus('closed');
    updateReadyState('closed');
    onClose?.(new Event('close'));
  }, [onClose, updateReadyState]);

  const handleError = useCallback((error: Error) => {
    onError?.(new Event('error'));
  }, [onError]);

  const handleMessage = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    const syntheticEvent = {
      data,
      type: 'message',
    } as MessageEvent;
    setLastMessage(syntheticEvent);
    onMessage?.(syntheticEvent);
  }, [onMessage]);

  useEffect(() => {
    socketRef.current = io(url, {
      reconnection: autoReconnect,
      reconnectionAttempts: reconnectAttempts,
      reconnectionDelay: reconnectInterval,
      transports: ['websocket'],
    });

    socketRef.current.on('connect', handleConnect);
    socketRef.current.on('disconnect', handleDisconnect);
    socketRef.current.on('error', handleError);
    socketRef.current.on('message', handleMessage);

    // Socket.io specific status events
    socketRef.current.on('connecting', () => {
      setConnectionStatus('connecting');
      updateReadyState('connecting');
    });

    socketRef.current.on('reconnect_attempt', () => {
      setConnectionStatus('reconnecting');
      updateReadyState('reconnecting');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', handleConnect);
        socketRef.current.off('disconnect', handleDisconnect);
        socketRef.current.off('error', handleError);
        socketRef.current.off('message', handleMessage);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [url, autoReconnect, reconnectAttempts, reconnectInterval, handleConnect, handleDisconnect, handleError, handleMessage, updateReadyState]);

  const sendMessage = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message', data);
    } else {
      console.error('Socket is not connected');
    }
  }, []);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  }, []);

  return {
    sendMessage,
    lastMessage,
    readyState,
    connectionStatus,
    reconnect,
  };
}
