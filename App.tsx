import React, { useState, useCallback, useRef } from 'react';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import RecordingList from './components/RecordingList';
import { evaluateInteraction } from './services/geminiService';
import { startListening } from './services/deepgramService';
import { convertSpeechToText } from './utils/speechToText';
import type { EvaluationResult, Speaker } from './types';
import { LogoIcon } from './components/icons';
import JitsiMeetComponent from './components/JitsiMeetComponent';

interface Recording {
  id: string;
  name: string;
  date: Date;
  url: string;
  blob: Blob;
  text?: string;
}

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  // State for live transcription
  const [domain, setDomain] = useState<string>('Machine Learning');
  const [interviewerTranscript, setInterviewerTranscript] = useState<string>('What is the difference between supervised and unsupervised learning?');
  const [candidateTranscript, setCandidateTranscript] = useState<string>('Supervised learning uses labeled data to train models, while unsupervised learning works with unlabeled data to find patterns or structures within it. For example, classification is a supervised task, and clustering is an unsupervised one.');
  const [activeListener, setActiveListener] = useState<Speaker | null>(null);
  
  // Ref to store the committed (final) part of the transcript during a recording session
  const committedTranscriptsRef = useRef<Record<Speaker, string>>({ interviewer: '', candidate: '' });
  
  // State for audio recording
  const [recordedBlobs, setRecordedBlobs] = useState<Record<Speaker, Blob | null>>({ interviewer: null, candidate: null });
  const [stopListeningFn, setStopListeningFn] = useState<(() => Promise<Blob | null>) | null>(null);

  // State for Jitsi recordings
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Generate a unique room name for the interview session
  const roomName = `LiveInterviewAIAssistant-${btoa(String(Date.now())).slice(-8)}`;

  const handleEvaluate = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setEvaluationResult(null);

    try {
      const result = await evaluateInteraction(domain, interviewerTranscript, candidateTranscript);
      setEvaluationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during evaluation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscriptUpdate = useCallback((update: { transcript: string; is_final: boolean }): void => {
    if (!activeListener) return;

    const setter = activeListener === 'interviewer' ? setInterviewerTranscript : setCandidateTranscript;
    const committed = committedTranscriptsRef.current[activeListener];

    if (update.is_final && update.transcript.trim()) {
      // When a segment is final, update the ref and the state.
      const newCommitted = (committed ? committed + ' ' : '') + update.transcript;
      committedTranscriptsRef.current[activeListener] = newCommitted;
      setter(newCommitted);
    } else if (!update.is_final) {
      // For interim results, just update the state for display.
      const displayText = (committed ? committed + ' ' : '') + update.transcript;
      setter(displayText);
    }
  }, [activeListener]);

  const toggleListening = useCallback(async (speaker: Speaker): Promise<void> => {
    if (activeListener === speaker) {
      // Stop listening
      if (stopListeningFn) {
        try {
          const audioBlob = await stopListeningFn();
          if (audioBlob) {
            setRecordedBlobs(prev => ({ ...prev, [speaker]: audioBlob }));
          }
        } catch (err) {
          console.error('Error stopping recording:', err);
        }
      }
      setActiveListener(null);
      setStopListeningFn(null);
    } else if (!activeListener) {
      // Start listening
      const transcriptSetter = speaker === 'interviewer' ? setInterviewerTranscript : setCandidateTranscript;
      transcriptSetter(''); 
      committedTranscriptsRef.current[speaker] = ''; // Reset committed transcript
      setRecordedBlobs(prev => ({ ...prev, [speaker]: null }));

      setActiveListener(speaker);
      try {
        const { stop } = await startListening(handleTranscriptUpdate);
        setStopListeningFn(() => stop);
      } catch (err) {
        const errorMessage = err instanceof Error ? `Microphone Error: ${err.message}` : 'Failed to start microphone. Please check permissions.';
        setError(errorMessage);
        setActiveListener(null);
      }
    }
  }, [activeListener, stopListeningFn, handleTranscriptUpdate]);
  
  const handleDownload = (speaker: Speaker): void => {
    const blob = recordedBlobs[speaker];
    if (blob) {
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${speaker}_interview_${new Date().toISOString().slice(0,19).replace('T','_').replace(/:/g,'-')}.wav`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        setError('Failed to download audio file.');
      }
    }
  };

  // Handle Jitsi recording completion
  const handleRecordingComplete = (recordingBlob: Blob, recordingName: string): void => {
    try {
      const newRecording: Recording = {
        id: Date.now().toString(),
        name: recordingName,
        date: new Date(),
        url: URL.createObjectURL(recordingBlob),
        blob: recordingBlob,
      };
      
      setRecordings(prev => [newRecording, ...prev]);
      setError(null);
    } catch (err) {
      setError('Failed to save recording.');
    }
  };

  // Handle speech-to-text conversion
  const handleConvertToText = async (recordingId: string, blob: Blob): Promise<string> => {
    setConvertingId(recordingId);
    try {
      console.log('Converting recording to text:', recordingId);
      const transcribedText = await convertSpeechToText(blob);
      
      setRecordings(prev => prev.map(recording => 
        recording.id === recordingId 
          ? { ...recording, text: transcribedText }
          : recording
      ));
      
      setError(null);
      return transcribedText;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to convert speech to text';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setConvertingId(null);
    }
  };

  // Handle recording download
  const handleDownloadRecording = (recording: Recording): void => {
    try {
      const link = document.createElement('a');
      link.href = recording.url;
      link.download = `${recording.name}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to download recording.');
    }
  };

  // Clear all recordings
  const clearAllRecordings = (): void => {
    // Revoke object URLs to prevent memory leaks
    recordings.forEach(recording => {
      URL.revokeObjectURL(recording.url);
    });
    setRecordings([]);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-7xl mx-auto flex flex-col flex-grow">
        <header className="flex items-center gap-4 mb-6">
          <LogoIcon />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#4a9951]">Live Interview AI Assistant</h1>
            <p className="text-[#2e7d32]">Real-time relevance analysis and question suggestion</p>
          </div>
        </header>
        
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="text-red-700 hover:text-red-900 font-bold text-lg"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {/* Jitsi Meeting Component - ALWAYS as Interviewer (recording enabled) */}
        <div className="h-[60vh] mb-8">
          <JitsiMeetComponent 
            roomName={roomName} 
            displayName="Interviewer"
            onRecordingComplete={handleRecordingComplete}
            isInterviewer={true} // Always true - only interviewer creates meetings
          />
        </div>

        {/* Recordings List Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#2e7d32]">Recordings</h2>
            {recordings.length > 0 && (
              <button
                onClick={clearAllRecordings}
                className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1 border border-red-300 rounded hover:bg-red-50 transition"
              >
                Clear All Recordings
              </button>
            )}
          </div>
          <RecordingList
            recordings={recordings}
            onConvertToText={handleConvertToText}
            onDownload={handleDownloadRecording}
            convertingId={convertingId}
          />
        </div>

        {/* Main Content Area */}
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#1a2e1a]/80 p-6 rounded-2xl border border-[#2e7d32]/40 shadow-2xl shadow-black/50">
            <InputForm
              domain={domain}
              onDomainChange={setDomain}
              interviewerTranscript={interviewerTranscript}
              onInterviewerTranscriptChange={setInterviewerTranscript}
              candidateTranscript={candidateTranscript}
              onCandidateTranscriptChange={setCandidateTranscript}
              onSubmit={handleEvaluate}
              isLoading={isLoading}
              activeListener={activeListener}
              onToggleListening={toggleListening}
              recordedBlobs={recordedBlobs}
              onDownloadAudio={handleDownload}
            />
          </div>
          <div className="bg-[#1a2e1a]/80 p-6 rounded-2xl border border-[#2e7d32]/40 shadow-2xl shadow-black/50">
            <ResultsDisplay
              results={evaluationResult}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </main>

        {/* Room Information Footer */}
        <footer className="mt-8 text-center text-gray-600 text-sm">
          <p>Share this room link with your candidate: <strong className="text-[#2e7d32]">{roomName}</strong></p>
          <p className="mt-1">Candidate will join without recording controls - only you can start/stop recordings.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;