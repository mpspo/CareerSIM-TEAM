/**
 * OpenAI Realtime API Service
 * Handles WebSocket connection, audio streaming, and real-time transcription
 */

export interface RealtimeConfig {
  apiKey: string;
  model?: string; // 'gpt-4o-realtime-preview-2024-10-01'
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  instructions?: string;
}

export interface AudioChunk {
  audio: Int16Array;
  timestamp: number;
}

export interface TranscriptionEvent {
  type: 'transcript' | 'audio_transcript';
  text: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

export interface RealtimeEventHandlers {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  onTranscript?: (event: TranscriptionEvent) => void;
  onAudioData?: (audio: Int16Array) => void;
  onSpeechStarted?: () => void;
  onSpeechEnded?: () => void;
}

export class RealtimeService {
  private ws: WebSocket | null = null;
  private config: RealtimeConfig;
  private handlers: RealtimeEventHandlers;
  private isConnected = false;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioQueue: Int16Array[] = [];
  private isPlaying = false;

  constructor(config: RealtimeConfig, handlers: RealtimeEventHandlers = {}) {
    this.config = {
      model: 'gpt-4o-realtime-preview-2024-10-01',
      voice: 'alloy',
      ...config,
    };
    this.handlers = handlers;
  }

  /**
   * Connect to OpenAI Realtime API
   */
  async connect(): Promise<void> {
    try {
      // Initialize AudioContext
      this.audioContext = new AudioContext({ sampleRate: 24000 });

      // Connect to WebSocket
      const url = 'wss://api.openai.com/v1/realtime?model=' + this.config.model;
      
      this.ws = new WebSocket(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      } as any);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('✅ Connected to OpenAI Realtime API');
        
        // Send session configuration
        this.sendEvent({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: this.config.instructions || 'You are a helpful interview coach.',
            voice: this.config.voice,
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1',
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
          },
        });

        this.handlers.onConnected?.();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.handlers.onError?.(new Error('WebSocket connection error'));
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.log('🔌 Disconnected from OpenAI Realtime API');
        this.handlers.onDisconnected?.();
      };

    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Realtime API
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.isConnected = false;
  }

  /**
   * Start capturing microphone input
   */
  async startRecording(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const audioContext = new AudioContext({ sampleRate: 24000 });
      const source = audioContext.createMediaStreamSource(this.mediaStream);
      
      // Create ScriptProcessor for audio processing
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (!this.isConnected) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = this.floatTo16BitPCM(inputData);
        
        // Send audio to Realtime API
        this.sendAudio(pcm16);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      console.log('🎤 Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop capturing microphone input
   */
  stopRecording(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
      console.log('🎤 Recording stopped');
    }
  }

  /**
   * Send text message to assistant
   */
  sendText(text: string): void {
    if (!this.isConnected || !this.ws) {
      console.warn('Not connected to Realtime API');
      return;
    }

    this.sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text,
          },
        ],
      },
    });

    // Trigger response
    this.sendEvent({
      type: 'response.create',
    });
  }

  /**
   * Send audio data to Realtime API
   */
  private sendAudio(audio: Int16Array): void {
    if (!this.isConnected || !this.ws) return;

    // Convert to ArrayBuffer explicitly
    const buffer = audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength) as ArrayBuffer;
    const base64Audio = this.arrayBufferToBase64(buffer);
    
    this.sendEvent({
      type: 'input_audio_buffer.append',
      audio: base64Audio,
    });
  }

  /**
   * Send event to Realtime API
   */
  private sendEvent(event: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    this.ws.send(JSON.stringify(event));
  }

  /**
   * Handle incoming messages from Realtime API
   */
  private handleMessage(data: string): void {
    try {
      const event = JSON.parse(data);

      switch (event.type) {
        case 'session.created':
          console.log('📡 Session created:', event.session.id);
          break;

        case 'conversation.item.created':
          if (event.item.role === 'assistant') {
            console.log('🤖 Assistant response started');
          }
          break;

        case 'response.audio_transcript.delta':
          // Real-time transcript as assistant speaks
          if (event.delta) {
            this.handlers.onTranscript?.({
              type: 'audio_transcript',
              text: event.delta,
              role: 'assistant',
              timestamp: Date.now(),
            });
          }
          break;

        case 'response.audio.delta':
          // Audio data from assistant
          if (event.delta) {
            const audioData = this.base64ToArrayBuffer(event.delta);
            const pcm16 = new Int16Array(audioData);
            this.queueAudio(pcm16);
          }
          break;

        case 'input_audio_buffer.speech_started':
          console.log('🗣️ User started speaking');
          this.handlers.onSpeechStarted?.();
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log('🤐 User stopped speaking');
          this.handlers.onSpeechEnded?.();
          break;

        case 'conversation.item.input_audio_transcription.completed':
          // User's speech transcription
          if (event.transcript) {
            this.handlers.onTranscript?.({
              type: 'transcript',
              text: event.transcript,
              role: 'user',
              timestamp: Date.now(),
            });
          }
          break;

        case 'response.done':
          console.log('✅ Response completed');
          break;

        case 'error':
          console.error('❌ Realtime API error:', event.error);
          this.handlers.onError?.(new Error(event.error.message));
          break;

        default:
          // Log other events for debugging
          if (event.type) {
            console.log('📨 Event:', event.type);
          }
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  /**
   * Queue audio for playback
   */
  private queueAudio(audio: Int16Array): void {
    this.audioQueue.push(audio);
    
    if (!this.isPlaying) {
      this.playNextAudio();
    }
  }

  /**
   * Play queued audio
   */
  private async playNextAudio(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audio = this.audioQueue.shift()!;

    if (!this.audioContext) return;

    try {
      const audioBuffer = this.audioContext.createBuffer(
        1,
        audio.length,
        this.audioContext.sampleRate
      );

      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < audio.length; i++) {
        channelData[i] = audio[i] / 32768; // Convert to float
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      source.onended = () => {
        this.playNextAudio();
      };

      source.start();

      // Notify handler
      this.handlers.onAudioData?.(audio);

    } catch (error) {
      console.error('Failed to play audio:', error);
      this.playNextAudio(); // Continue with next chunk
    }
  }

  /**
   * Convert Float32Array to 16-bit PCM
   */
  private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return pcm16;
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Check if connected
   */
  isConnectedToAPI(): boolean {
    return this.isConnected;
  }

  /**
   * Interrupt current response
   */
  interrupt(): void {
    if (!this.isConnected) return;

    this.sendEvent({
      type: 'response.cancel',
    });

    // Clear audio queue
    this.audioQueue = [];
    this.isPlaying = false;
  }
}
