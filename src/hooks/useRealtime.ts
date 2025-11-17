import { useState, useEffect, useRef, useCallback } from 'react';
import { RealtimeService, RealtimeEventHandlers, TranscriptionEvent } from '../services/RealtimeService';

export interface RealtimeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface UseRealtimeOptions {
  apiKey: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  instructions?: string;
  autoConnect?: boolean;
  onTranscript?: (text: string, timestamp: number) => void; // NEW: Callback for transcripts
}

export interface RealtimeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isPartial?: boolean;
}

export function useRealtime(options: UseRealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  
  const serviceRef = useRef<RealtimeService | null>(null);
  const currentMessageRef = useRef<string>('');

  // Initialize service
  useEffect(() => {
    const handlers: RealtimeEventHandlers = {
      onConnected: () => {
        setIsConnected(true);
        setError(null);
        console.log('✅ Realtime connected');
      },
      onDisconnected: () => {
        setIsConnected(false);
        setIsRecording(false);
        console.log('🔌 Realtime disconnected');
      },
      onError: (err) => {
        setError(err);
        console.error('❌ Realtime error:', err);
      },
      onTranscript: (event: TranscriptionEvent) => {
        if (event.type === 'transcript') {
          // User's complete transcript
          const message = {
            id: `user-${Date.now()}`,
            role: 'user' as const,
            content: event.text,
            timestamp: event.timestamp,
          };
          addMessage(message);
          
          // Call external transcript callback
          if (options.onTranscript) {
            options.onTranscript(event.text, event.timestamp);
          }
        } else if (event.type === 'audio_transcript') {
          // Assistant's partial transcript (streaming)
          currentMessageRef.current += event.text;
          updatePartialMessage('assistant', currentMessageRef.current);
        }
      },
      onSpeechStarted: () => {
        setIsSpeaking(true);
      },
      onSpeechEnded: () => {
        setIsSpeaking(false);
      },
    };

    serviceRef.current = new RealtimeService(
      {
        apiKey: options.apiKey,
        voice: options.voice,
        instructions: options.instructions,
      },
      handlers
    );

    // Auto-connect if specified
    if (options.autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [options.apiKey, options.voice, options.instructions]);

  const connect = useCallback(async () => {
    if (!serviceRef.current) return;
    
    try {
      await serviceRef.current.connect();
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (!serviceRef.current) return;
    
    serviceRef.current.disconnect();
    setIsConnected(false);
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (!serviceRef.current || !isConnected) {
      console.warn('Cannot start recording: not connected');
      return;
    }

    try {
      await serviceRef.current.startRecording();
      setIsRecording(true);
    } catch (err) {
      setError(err as Error);
    }
  }, [isConnected]);

  const stopRecording = useCallback(() => {
    if (!serviceRef.current) return;
    
    serviceRef.current.stopRecording();
    setIsRecording(false);
  }, []);

  const sendText = useCallback((text: string) => {
    if (!serviceRef.current || !isConnected) {
      console.warn('Cannot send text: not connected');
      return;
    }

    addMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    });

    serviceRef.current.sendText(text);
    currentMessageRef.current = ''; // Reset for next assistant message
  }, [isConnected]);

  const interrupt = useCallback(() => {
    if (!serviceRef.current) return;
    
    serviceRef.current.interrupt();
    
    // Finalize partial message
    if (currentMessageRef.current) {
      finalizePartialMessage();
    }
  }, []);

  const addMessage = (message: RealtimeMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const updatePartialMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1];
      
      if (lastMessage && lastMessage.role === role && lastMessage.isPartial) {
        // Update existing partial message
        return [
          ...prev.slice(0, -1),
          { ...lastMessage, content },
        ];
      } else {
        // Create new partial message
        return [
          ...prev,
          {
            id: `${role}-${Date.now()}`,
            role,
            content,
            timestamp: Date.now(),
            isPartial: true,
          },
        ];
      }
    });
  };

  const finalizePartialMessage = () => {
    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1];
      
      if (lastMessage && lastMessage.isPartial) {
        return [
          ...prev.slice(0, -1),
          { ...lastMessage, isPartial: false },
        ];
      }
      
      return prev;
    });
    
    currentMessageRef.current = '';
  };

  const clearMessages = useCallback(() => {
    setMessages([]);
    currentMessageRef.current = '';
  }, []);

  return {
    // State
    isConnected,
    isRecording,
    isSpeaking,
    error,
    messages,
    
    // Actions
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendText,
    interrupt,
    clearMessages,
  };
}
