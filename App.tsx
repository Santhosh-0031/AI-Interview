import React, { useState, useCallback, useRef } from 'react';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import { evaluateInteraction } from './services/geminiService';
import { startListening } from './services/deepgramService';
import type { EvaluationResult, Speaker } from './types';
import { LogoIcon } from './components/icons';
import JitsiMeetComponent from './components/JitsiMeetComponent';

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

  // Generate a unique room name for the interview session
  const roomName = `LiveInterviewAIAssistant-${btoa(String(Date.now())).slice(-8)}`;

  const handleEvaluate = async () => {
    setIsLoading(true);
    setError(null);
    setEvaluationResult(null);

    try {
      const result = await evaluateInteraction(domain, interviewerTranscript, candidateTranscript);
      setEvaluationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscriptUpdate = useCallback((update: { transcript: string; is_final: boolean }) => {
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


  const toggleListening = useCallback(async (speaker: Speaker) => {
    if (activeListener === speaker) {
      if (stopListeningFn) {
        const audioBlob = await stopListeningFn();
        if (audioBlob) {
          setRecordedBlobs(prev => ({ ...prev, [speaker]: audioBlob }));
        }
      }
      setActiveListener(null);
      setStopListeningFn(null);
    } else if (!activeListener) {
      // Clear previous data for the new recording session
      const transcriptSetter = speaker === 'interviewer' ? setInterviewerTranscript : setCandidateTranscript;
      transcriptSetter(''); 
      committedTranscriptsRef.current[speaker] = ''; // Reset committed transcript
      setRecordedBlobs(prev => ({ ...prev, [speaker]: null }));

      setActiveListener(speaker);
      try {
        const { stop } = await startListening(handleTranscriptUpdate);
        setStopListeningFn(() => stop);
      } catch (err) {
        setError(err instanceof Error ? `Microphone Error: ${err.message}` : 'Failed to start microphone.');
        setActiveListener(null);
      }
    }
    // If listening to the other speaker, do nothing to prevent simultaneous recording.
  }, [activeListener, stopListeningFn, handleTranscriptUpdate]);
  
  const handleDownload = (speaker: Speaker) => {
    const blob = recordedBlobs[speaker];
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${speaker}_interview_${new Date().toISOString().slice(0,19).replace('T','_').replace(/:/g,'-')}.wav`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
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
        
        <div className="h-[60vh] mb-8">
           <JitsiMeetComponent roomName={roomName} displayName="Interviewer" />
        </div>

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
      </div>
    </div>
  );
};

export default App;