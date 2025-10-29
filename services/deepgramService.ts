// Use environment variable for API key
const DEEPGRAM_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;

let connection: WebSocket | null = null;
let mediaStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;

export const startListening = async (
  onTranscriptUpdate: (update: { transcript: string; is_final: boolean }) => void
): Promise<{ stop: () => Promise<Blob | null> }> => {

  if (!DEEPGRAM_API_KEY) {
    throw new Error('Deepgram API key not configured. Please check your environment variables.');
  }

  if (connection) {
    console.warn("A transcription session is already in progress.");
    return { stop: () => Promise.resolve(null) };
  }

  const audioChunks: Blob[] = [];

  const cleanup = () => {
    if (connection) {
      connection.close();
      connection = null;
    }
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder = null;
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }
  };

  try {
    // Create WebSocket connection with proper authentication
    const socket = new WebSocket(
      `wss://api.deepgram.com/v1/listen?model=nova-2&language=en-US&smart_format=true&interim_results=true&punctuate=true`,
      ['token', DEEPGRAM_API_KEY]
    );
    
    connection = socket;
    let isConnected = false;

    // Get microphone access with better settings
    mediaStream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 16000,
      },
      video: false
    });

    // Create media recorder with proper error handling
    const options = { mimeType: 'audio/webm; codecs=opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      throw new Error('Required audio codec not supported');
    }

    mediaRecorder = new MediaRecorder(mediaStream, options);

    socket.onopen = () => {
      console.log("Deepgram WebSocket connection opened.");
      isConnected = true;
      mediaRecorder?.start(250); // Start recording with 250ms chunks
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Deepgram message:', data);
        
        if (data.type === 'Results' && data.channel?.alternatives?.[0]?.transcript) {
          const transcript = data.channel.alternatives[0].transcript;
          const is_final = data.is_final || false;
          onTranscriptUpdate({ transcript, is_final });
        }
      } catch (error) {
        console.error('Error parsing Deepgram message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error("Deepgram WebSocket error:", error);
      cleanup();
    };

    socket.onclose = (event) => {
      console.log("Deepgram WebSocket connection closed:", event.code, event.reason);
      isConnected = false;
      cleanup();
    };

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && isConnected) {
        try {
          socket.send(event.data);
          audioChunks.push(event.data);
        } catch (error) {
          console.error('Error sending audio data:', error);
        }
      }
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      cleanup();
    };

  } catch (error) {
    console.error("Failed to start microphone or Deepgram connection:", error);
    cleanup();
    throw error;
  }
  
  const stop = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.onstop = () => {
          const audioBlob = audioChunks.length > 0 
            ? new Blob(audioChunks, { type: 'audio/webm' }) 
            : null;
          console.log('Recording stopped, blob size:', audioBlob?.size);
          cleanup();
          resolve(audioBlob);
        };
        mediaRecorder.stop();
      } else {
        console.log('No active recording to stop');
        cleanup();
        resolve(null);
      }
    });
  };

  return { stop };
};