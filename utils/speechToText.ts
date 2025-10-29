export const convertSpeechToText = async (audioBlob: Blob): Promise<string> => {
  try {
    console.log('Converting speech to text using Deepgram...', {
      size: audioBlob.size,
      type: audioBlob.type
    });

    // Validate audio blob
    if (audioBlob.size === 0) {
      throw new Error('Audio recording is empty');
    }

    const DEEPGRAM_API_KEY = 'cac9bbf0a3a3949541d3d0c1ab9d93bf255c1e59';
    
    // Convert blob to array buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    console.log('Audio details:', {
      size: arrayBuffer.byteLength,
      duration: estimateDuration(arrayBuffer),
      sampleRate: '16kHz (estimated)'
    });

    // Use WAV format for better compatibility with speech recognition
    let contentType = 'audio/webm';
    let processedBuffer = arrayBuffer;

    // If the audio is too short, it might not contain speech
    const duration = estimateDuration(arrayBuffer);
    if (duration < 1) {
      throw new Error('Audio recording is too short (less than 1 second)');
    }

    if (duration > 30) {
      console.log('Long audio detected, using faster processing mode');
    }

    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true&language=en', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': contentType,
      },
      body: processedBuffer
    });

    console.log('Deepgram API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepgram API error:', errorText);
      
      if (response.status === 400) {
        throw new Error('Audio format not supported. Please try recording again.');
      } else if (response.status === 413) {
        throw new Error('Audio file too large.');
      } else {
        throw new Error(`Deepgram API error: ${response.status}`);
      }
    }

    const data = await response.json();
    console.log('Full Deepgram response:', data);

    // Extract transcription with better error handling
    const channel = data.results?.channels?.[0];
    const alternative = channel?.alternatives?.[0];
    let transcription = alternative?.transcript;

    // If no transcription, check if there are words but no transcript
    if (!transcription && alternative?.words?.length > 0) {
      transcription = alternative.words.map((word: any) => word.word).join(' ');
      console.log('Reconstructed transcription from words:', transcription);
    }

    // Check utterances
    if (!transcription && data.results?.utterances?.length > 0) {
      transcription = data.results.utterances
        .map((utterance: any) => utterance.transcript)
        .join(' ');
      console.log('Reconstructed transcription from utterances:', transcription);
    }

    if (!transcription) {
      console.warn('No transcription found. Response structure:', {
        hasResults: !!data.results,
        hasChannels: !!data.results?.channels,
        hasAlternatives: !!channel?.alternatives,
        hasWords: !!alternative?.words,
        hasUtterances: !!data.results?.utterances
      });
      
      // Check if there was low confidence
      if (alternative?.confidence && alternative.confidence < 0.5) {
        throw new Error('Speech detected but confidence is low. Please speak more clearly.');
      }
      
      throw new Error('No speech detected in the audio recording. Please ensure you spoke during the recording.');
    }

    console.log('Transcription successful:', transcription);
    return transcription.trim();
    
  } catch (error) {
    console.error('Speech to text conversion failed:', error);
    
    // Provide specific guidance based on error type
    if (error instanceof Error) {
      if (error.message.includes('too short')) {
        throw new Error('Recording is too short. Please record at least 3 seconds of speech.');
      } else if (error.message.includes('No speech detected')) {
        throw new Error('No speech detected. Please ensure:\n1. You spoke clearly during recording\n2. Microphone is working\n3. There is background noise');
      } else {
        throw error;
      }
    }
    
    throw new Error('Speech to text conversion failed. Please try recording again.');
  }
};

// Helper function to estimate audio duration
const estimateDuration = (arrayBuffer: ArrayBuffer): number => {
  // Rough estimation: WebM/Opus at 16kHz, mono
  // Average bitrate for speech is ~24 kbps
  const bytesPerSecond = 3000; // ~24 kbps / 8 bits per byte
  return arrayBuffer.byteLength / bytesPerSecond;
};