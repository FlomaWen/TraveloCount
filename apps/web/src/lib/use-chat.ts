'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { env } from './env';

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
}

interface UseChatOptions {
  tripId: string;
  accessToken: string | undefined;
}

export function useChat({ tripId, accessToken }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    const fetchInitial = async () => {
      try {
        const res = await fetch(`${env.apiUrl}/api/trips/${tripId}/messages?limit=100`, {
          headers: { authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as ChatMessage[];
        if (!cancelled) setMessages(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur');
      }
    };
    fetchInitial();

    const socket = io(`${env.apiUrl}/ws/chat`, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join', { tripId });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => setError(err.message));
    socket.on('message:new', (msg: ChatMessage) => {
      setMessages((prev) => (prev ? [...prev, msg] : [msg]));
    });

    return () => {
      cancelled = true;
      socket.emit('leave', { tripId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tripId, accessToken]);

  const send = async (content: string) => {
    if (!accessToken || content.trim().length === 0) return;
    try {
      const res = await fetch(`${env.apiUrl}/api/trips/${tripId}/messages`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur envoi');
    }
  };

  return { messages, connected, error, send };
}
