"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface UseWebSocketOptions {
  url: string
  onOpen?: (event: WebSocketEventMap["open"]) => void
  onMessage?: (event: WebSocketEventMap["message"]) => void
  onClose?: (event: WebSocketEventMap["close"]) => void
  onError?: (event: WebSocketEventMap["error"]) => void
  reconnectInterval?: number
  reconnectAttempts?: number
  autoReconnect?: boolean
}

interface UseWebSocketReturn {
  sendMessage: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void
  lastMessage: WebSocketEventMap["message"] | null
  readyState: number
  connectionStatus: "connecting" | "open" | "closing" | "closed" | "reconnecting"
  reconnect: () => void
}

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
  const [lastMessage, setLastMessage] = useState<WebSocketEventMap["message"] | null>(null)
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING)
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "open" | "closing" | "closed" | "reconnecting"
  >("connecting")

  const websocketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  // Function to create a new WebSocket connection
  const connect = useCallback(() => {
    // Clean up any existing connection
    if (websocketRef.current) {
      websocketRef.current.close()
    }

    // In a real implementation, we would connect to the actual WebSocket server
    // For this demo, we'll simulate the connection
    setConnectionStatus("connecting")

    // Simulate WebSocket connection
    setTimeout(() => {
      // In a real implementation, this would be:
      // websocketRef.current = new WebSocket(url)

      // For demo purposes, we'll just simulate the connection state
      setReadyState(WebSocket.OPEN)
      setConnectionStatus("open")

      if (onOpen) {
        onOpen({ type: "open" } as unknown as WebSocketEventMap["open"])
      }
    }, 500)

    // In a real implementation, we would set up event handlers:
    /*
    websocketRef.current = new WebSocket(url)
    
    websocketRef.current.onopen = (event) => {
      setReadyState(WebSocket.OPEN)
      setConnectionStatus("open")
      reconnectAttemptsRef.current = 0
      if (onOpen) onOpen(event)
    }
    
    websocketRef.current.onmessage = (event) => {
      setLastMessage(event)
      if (onMessage) onMessage(event)
    }
    
    websocketRef.current.onclose = (event) => {
      setReadyState(WebSocket.CLOSED)
      setConnectionStatus("closed")
      if (onClose) onClose(event)
      
      // Attempt to reconnect if enabled
      if (autoReconnect && reconnectAttemptsRef.current < reconnectAttempts) {
        setConnectionStatus("reconnecting")
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1
          connect()
        }, reconnectInterval)
      }
    }
    
    websocketRef.current.onerror = (event) => {
      if (onError) onError(event)
    }
    */
  }, [url, onOpen, onMessage, onClose, onError, autoReconnect, reconnectAttempts, reconnectInterval])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }

      if (websocketRef.current) {
        websocketRef.current.close()
      }
    }
  }, [connect])

  // Function to send a message through the WebSocket
  const sendMessage = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(data)
    } else {
      console.error("WebSocket is not connected")
    }
  }, [])

  // Function to manually reconnect
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect])

  // Simulate receiving a message (for demo purposes)
  useEffect(() => {
    // This would normally come from the actual WebSocket
    // For demo purposes, we'll simulate receiving a message after 3 seconds
    const timeout = setTimeout(() => {
      const mockMessage = {
        data: JSON.stringify({
          type: "notification",
          notification: {
            id: "ws-" + Date.now(),
            type: "account_expired",
            title: "WebSocket Notification",
            message: "This is a simulated WebSocket notification for demonstration purposes.",
            priority: "high",
          },
        }),
        type: "message",
      } as WebSocketEventMap["message"]

      setLastMessage(mockMessage)
      if (onMessage) onMessage(mockMessage)
    }, 3000)

    return () => clearTimeout(timeout)
  }, [onMessage])

  return {
    sendMessage,
    lastMessage,
    readyState,
    connectionStatus,
    reconnect,
  }
}
