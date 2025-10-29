import React, { useState } from "react";
import { SpeechToTextIcon, DownloadIcon } from "./icons";

interface Recording {
  id: string;
  name: string;
  date: Date;
  url: string;
  blob: Blob;
  text?: string;
}

interface RecordingListProps {
  recordings: Recording[];
  onConvertToText: (recordingId: string, blob: Blob) => Promise<string>;
  onDownload: (recording: Recording) => void;
  convertingId?: string | null;
}

const RecordingList: React.FC<RecordingListProps> = ({ 
  recordings, 
  onConvertToText, 
  onDownload,
  convertingId 
}) => {
  const handleConvertToText = async (recording: Recording): Promise<void> => {
    try {
      await onConvertToText(recording.id, recording.blob);
    } catch (error) {
      console.error('Conversion failed:', error);
    }
  };

  if (!recordings || recordings.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-[#2e7d32] mb-4">Saved Recordings</h2>
        <p className="text-gray-500">No recordings available. Start a recording during your interview to see them here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold text-[#2e7d32] mb-4">Saved Recordings</h2>
      <div className="space-y-4">
        {recordings.map((recording) => (
          <div
            key={recording.id}
            className="border border-[#4a9951]/40 rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-[#1a2e1a]">{recording.name}</h3>
              <span className="text-sm text-gray-500">
                {recording.date.toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <audio controls className="h-8">
                  <source src={recording.url} type="audio/webm" />
                  Your browser does not support the audio element.
                </audio>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => onDownload(recording)}
                  className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-[#2e7d32]/10 text-[#2e7d32] hover:bg-[#2e7d32]/20 transition"
                >
                  <DownloadIcon /> Download
                </button>
                
                <button
                  onClick={() => handleConvertToText(recording)}
                  disabled={convertingId === recording.id || !!recording.text}
                  className={`flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full transition ${
                    recording.text
                      ? "bg-[#4a9951]/20 text-[#2e7d32] cursor-default"
                      : convertingId === recording.id
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-[#2e7d32] text-white hover:bg-[#1a2e1a]"
                  }`}
                >
                  <SpeechToTextIcon />
                  {convertingId === recording.id ? "Converting..." : recording.text ? "Converted" : "Speech to Text"}
                </button>
              </div>
            </div>

            {recording.text && (
              <div className="mt-3 p-3 bg-gray-50 rounded border">
                <h4 className="text-sm font-semibold text-[#2e7d32] mb-2">Transcribed Text:</h4>
                <p className="text-sm text-gray-700">{recording.text}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecordingList;