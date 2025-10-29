import React, { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface JitsiMeetComponentProps {
  roomName: string;
  displayName: string;
  onRecordingComplete: (recordingBlob: Blob, recordingName: string) => void;
}

const JitsiMeetComponent: React.FC<JitsiMeetComponentProps> = ({ 
  roomName, 
  displayName,
  onRecordingComplete 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (window.JitsiMeetExternalAPI && containerRef.current) {
      const domain = "meet.jit.si";
      const options = {
        roomName,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        userInfo: { displayName },
      };
      
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
    }

    return () => {
      // Stop recording if active when component unmounts
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      apiRef.current?.dispose();
    };
  }, [roomName, displayName]);

  const startBrowserRecording = async (): Promise<void> => {
    try {
      // Get audio stream from browser
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
        video: false 
      });

      audioStreamRef.current = stream;
      recordedChunksRef.current = [];
      
      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const recordingBlob = new Blob(recordedChunksRef.current, { 
          type: 'audio/webm' 
        });
        
        const recordingName = `Interview_${roomName}_${new Date().toISOString().replace(/[:.]/g, '-')}`;
        onRecordingComplete(recordingBlob, recordingName);
        
        // Stop all tracks
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
          audioStreamRef.current = null;
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not start recording. Please check microphone permissions.');
    }
  };

  const stopBrowserRecording = (): void => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = async (): Promise<void> => {
    if (isRecording) {
      stopBrowserRecording();
    } else {
      await startBrowserRecording();
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[#2e7d32]">Live Interview - Room: {roomName}</h3>
        <button
          onClick={toggleRecording}
          disabled={!navigator.mediaDevices}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            isRecording
              ? "bg-[#ff4d4d] text-white hover:bg-[#ff3333]"
              : "bg-[#2e7d32] text-white hover:bg-[#1a2e1a] disabled:bg-gray-400 disabled:cursor-not-allowed"
          }`}
        >
          <span className="flex items-center gap-2">
            {isRecording ? (
              <>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                Stop Recording
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-white rounded-full"></div>
                Start Recording
              </>
            )}
          </span>
        </button>
      </div>
      <div
        ref={containerRef}
        className="flex-1 rounded-2xl border border-[#4a9951]/40 shadow-[0_0_25px_rgba(46,125,50,0.3)] bg-white"
      />
      
      {isRecording && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm text-center">
          🔴 Recording in progress... Don't forget to click "Stop Recording" when the interview ends.
        </div>
      )}
    </div>
  );
};

export default JitsiMeetComponent;