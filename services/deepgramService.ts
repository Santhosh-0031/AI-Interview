// Use the API key provided by the user
const DEEPGRAM_API_KEY = "cac9bbf0a3a3949541d3d0c1ab9d93bf255c1e59"; // Use the same key as speechToText

let connection: any = null;
let mediaStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;

export const startListening = async (
  onTranscriptUpdate: (update: { transcript: string; is_final: boolean }) => void
): Promise<{ stop: () => Promise<Blob | null> }> => {

  if (connection) {
    console.warn("A transcription session is already in progress.");
    return { stop: () => Promise.resolve(null) };
  }

  const audioChunks: Blob[] = [];

  const cleanup = () => {
    if (connection) {
      connection.finish();
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
    // Create connection using fetch API instead of SDK to avoid dependency issues
    const socket = new WebSocket(`wss://api.deepgram.com/v1/listen?model=nova-2&language=en-US&smart_format=true&interim_results=true&punctuate=true`, ['token', DEEPGRAM_API_KEY]);
    
    connection = socket;
    let isConnected = false;

    mediaStream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000,
      } 
    });

    mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: 'audio/webm; codecs=opus'
    });

    socket.onopen = () => {
      console.log("Deepgram WebSocket connection opened.");
      isConnected = true;
      mediaRecorder?.start(250);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'Results' && data.channel?.alternatives?.[0]?.transcript) {
        const transcript = data.channel.alternatives[0].transcript;
        const is_final = data.is_final || false;
        onTranscriptUpdate({ transcript, is_final });
      }
    };

    socket.onerror = (error) => {
      console.error("Deepgram WebSocket error:", error);
      cleanup();
    };

    socket.onclose = () => {
      console.log("Deepgram WebSocket connection closed.");
      isConnected = false;
    };

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && isConnected) {
        socket.send(event.data);
        audioChunks.push(event.data);
      }
    };

  } catch (error) {
    console.error("Failed to start microphone or Deepgram connection:", error);
    cleanup();
    throw error;
  }
  
  const stop = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorder) {
        mediaRecorder.onstop = () => {
          const audioBlob = audioChunks.length > 0 ? new Blob(audioChunks, { type: 'audio/webm' }) : null;
          cleanup();
          resolve(audioBlob);
        };
        mediaRecorder.stop();
      } else {
        cleanup();
        resolve(null);
      }
    });
  };

  return { stop };
};