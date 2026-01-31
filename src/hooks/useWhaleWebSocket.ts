import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface WhaleTransaction {
  whale: {
    address: string;
    alias: string | null;
  };
  transaction: {
    tx_id: string;
    type: string;
    intent: 'bullish' | 'bearish' | 'neutral';
    action: string;
    protocol: string | null;
    valueSTX: number;
    valueUSD: number;
    blockHeight: number;
    timestamp: string;
  };
  isSignificant: boolean;
}

const WHALE_SOCKET_URL = import.meta.env.WHALE_SOCKET_URL || 'http://localhost:5181';

export function useWhaleWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [latestTransaction, setLatestTransaction] = useState<WhaleTransaction | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<WhaleTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    console.log('[WhaleWebSocket] Connecting to:', WHALE_SOCKET_URL);
    
    const ws = io(WHALE_SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });

    ws.on('connect', () => {
      console.log('[WhaleWebSocket] ✅ Connected to whale monitor');
      setConnected(true);
      setError(null);
    });

    ws.on('disconnect', (reason) => {
      console.log('[WhaleWebSocket] ⚠️  Disconnected:', reason);
      setConnected(false);
    });

    ws.on('connect_error', (err) => {
      console.error('[WhaleWebSocket] ❌ Connection error:', err.message);
      setError('Unable to connect to whale monitor');
      setConnected(false);
    });

    ws.on('whale:transaction', (data: WhaleTransaction) => {
      console.log('[WhaleWebSocket] 📊 New transaction:', data);
      setLatestTransaction(data);
      setTransactionHistory(prev => [data, ...prev].slice(0, 50)); // Keep last 50
    });

    setSocket(ws);

    return () => {
      console.log('[WhaleWebSocket] Disconnecting...');
      ws.disconnect();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const clearHistory = useCallback(() => {
    setTransactionHistory([]);
  }, []);

  return {
    socket,
    connected,
    latestTransaction,
    transactionHistory,
    error,
    clearHistory
  };
}
