import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import type { LiveClient, LiveSchema } from "@deepgram/sdk";

// Use the API key provided by the user
const DEEPGRAM_API_KEY = "fe8a6ce2fd13180d7ee7cf17d6d9249926a5bf49";

let connection: LiveClient | null = null;
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
    const deepgram = createClient(DEEPGRAM_API_KEY);
    
    const conn = deepgram.listen.live({
      model: "nova-2",
      language: "en-US",
      smart_format: true,
      interim_results: true,
      puncutate: true
    });
    connection = conn;

    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(mediaStream);

    conn.on(LiveTranscriptionEvents.Open, () => {
      console.log("Deepgram connection opened.");
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && conn.getReadyState() === 1) {
            conn.send(event.data);
            audioChunks.push(event.data); // Also save for download
        }
      };
      
      mediaRecorder.start(250); // Start recording and send data every 250ms
    });

    conn.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel.alternatives[0].transcript;
        if (transcript) {
            onTranscriptUpdate({ transcript, is_final: data.is_final });
        }
    });

    conn.on(LiveTranscriptionEvents.Error, (err) => {
      console.error("Deepgram Error:", err);
      cleanup();
    });

    conn.on(LiveTranscriptionEvents.Close, () => {
      console.log("Deepgram connection closed.");
    });

  } catch (error) {
    console.error("Failed to start microphone or Deepgram connection:", error);
    cleanup();
    throw error;
  }
  
  const stop = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
        if (mediaRecorder) {
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                resolve(audioChunks.length > 0 ? audioBlob : null);
            };
            cleanup();
        } else {
            cleanup();
            resolve(null);
        }
    });
  };

  return { stop };
};