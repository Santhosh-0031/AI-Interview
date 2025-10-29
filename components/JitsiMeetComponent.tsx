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
  isInterviewer: boolean; // New prop to identify interviewer
}

const JitsiMeetComponent: React.FC<JitsiMeetComponentProps> = ({ 
  roomName, 
  displayName,
  onRecordingComplete,
  isInterviewer 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (window.JitsiMeetExternalAPI && containerRef.current) {
      const domain = "meet.jit.si";
      const options = {
        roomName,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        userInfo: { displayName },
        configOverwrite: {
          toolbarButtons: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'settings', 
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 
            'shortcuts', 'tileview', 'videobackgroundblur', 'help', 
            'mute-everyone', 'mute-video-everyone', 'security'
          ],
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'settings',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats',
            'shortcuts', 'tileview', 'videobackgroundblur', 'help',
            'mute-everyone', 'mute-video-everyone', 'security'
          ],
          SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          SHOW_POWERED_BY: false,
          SHOW_PROMOTIONAL_CLOSE_PAGE: false,
          DEFAULT_BACKGROUND: '#474747',
          INITIAL_TOOLBAR_TIMEOUT: 20000,
          TOOLBAR_TIMEOUT: 4000,
          DEFAULT_REMOTE_DISPLAY_NAME: 'Guest',
        }
      };
      
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      // Listen for participant role changes
      apiRef.current.on('participantRoleChanged', (participant: any) => {
        console.log('Participant role changed:', participant);
      });

      // Listen for video conference joined
      apiRef.current.on('videoConferenceJoined', (data: any) => {
        console.log('Local participant joined:', data);
      });
    }

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      apiRef.current?.dispose();
    };
  }, [roomName, displayName]);

  const startBrowserRecording = async (): Promise<void> => {
    try {
      console.log('Requesting microphone permission...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000,
        },
        video: false 
      });

      streamRef.current = stream;
      recordedChunksRef.current = [];
      
      const options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/webm';
        console.warn('Opus codec not supported, using default WebM');
      }

      console.log('Using MIME type:', options.mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          console.log('Audio chunk recorded:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped, total chunks:', recordedChunksRef.current.length);
        
        if (recordedChunksRef.current.length > 0) {
          const recordingBlob = new Blob(recordedChunksRef.current, { 
            type: 'audio/webm' 
          });
          
          console.log('Final recording blob:', {
            size: recordingBlob.size,
            type: recordingBlob.type
          });
          
          const recordingName = `Interview_${roomName}_${new Date().toISOString().replace(/[:.]/g, '-')}`;
          onRecordingComplete(recordingBlob, recordingName);
        } else {
          console.error('No audio chunks recorded');
        }
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };

      mediaRecorder.start(500);
      setIsRecording(true);
      console.log('Recording started successfully');

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not start recording. Please check microphone permissions and try again.');
    }
  };

  const stopBrowserRecording = (): void => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log('Stopping recording...');
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
        <h3 className="text-lg font-semibold text-[#2e7d32]">
          Live Interview - Room: {roomName}
          <span className="text-sm font-normal text-gray-600 ml-2">
            ({isInterviewer ? 'Interviewer' : 'Candidate'})
          </span>
        </h3>
        
        {/* Show recording button only for interviewer */}
        {isInterviewer && (
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
        )}
      </div>
      
      {/* Jitsi container with proper height */}
      <div
        ref={containerRef}
        className="flex-1 min-h-[400px] rounded-2xl border border-[#4a9951]/40 shadow-[0_0_25px_rgba(46,125,50,0.3)] bg-white overflow-hidden"
      />
      
      {/* Recording status - only show for interviewer */}
      {isInterviewer && isRecording && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm text-center">
          🔴 Recording in progress... Speak clearly into your microphone.
        </div>
      )}
      
      {/* Info for candidate */}
      {!isInterviewer && (
        <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded-lg text-blue-700 text-sm text-center">
          💡 You are joining as a candidate. The interviewer will manage the recording.
        </div>
      )}
    </div>
  );
};

export default JitsiMeetComponent;