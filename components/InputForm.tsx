import React, { useState } from "react";
import { EvaluateIcon, MicrophoneIcon, DownloadIcon } from "./icons";
import type { Speaker } from "../types";

const InputForm = ({
  domain,
  onDomainChange,
  interviewerTranscript,
  onInterviewerTranscriptChange,
  candidateTranscript,
  onCandidateTranscriptChange,
  onSubmit,
  isLoading,
  activeListener,
  onToggleListening,
  recordedBlobs,
  onDownloadAudio,
}) => {
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!domain.trim() || !interviewerTranscript.trim() || !candidateTranscript.trim()) {
      setError("All fields are required.");
      return;
    }
    setError("");
    onSubmit();
  };

  const inputClass =
    "w-full bg-[#e6f5e6]/90 border border-[#4a9951]/40 rounded-lg p-3 text-[#1a2e1a] focus:ring-2 focus:ring-[#2e7d32] focus:border-[#2e7d32] placeholder-[#4a9951]/60 transition";
  const labelClass = "block text-sm font-semibold text-[#2e7d32] mb-2";

  const AudioControls = ({ speaker }) => {
    const isListening = activeListener === speaker;
    const hasRecording = recordedBlobs[speaker] !== null;
    return (
      <div className="flex items-center gap-2">
        {hasRecording && !isListening && (
          <button
            onClick={() => onDownloadAudio(speaker)}
            type="button"
            className="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-[#2e7d32]/10 text-[#2e7d32] hover:bg-[#2e7d32]/20 transition"
          >
            <DownloadIcon /> Download
          </button>
        )}
        <button
          onClick={() => onToggleListening(speaker)}
          type="button"
          className={`flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full transition ${
            isListening
              ? "bg-[#ff4d4d]/20 text-[#ff4d4d] hover:bg-[#ff4d4d]/30"
              : "bg-[#4a9951]/20 hover:bg-[#2e7d32]/30 text-[#2e7d32]"
          }`}
        >
          <MicrophoneIcon isListening={isListening} />
          {isListening ? "Stop" : "Record"}
        </button>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 rounded-xl bg-white shadow-lg">
      <div>
        <label className={labelClass}>Interview Domain</label>
        <input
          value={domain}
          onChange={(e) => onDomainChange(e.target.value)}
          placeholder="e.g., Cybersecurity, Data Analyst"
          className={inputClass}
          disabled={isLoading || !!activeListener}
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className={labelClass}>Interviewer Question</label>
          <AudioControls speaker="interviewer" />
        </div>
        <textarea
          rows={4}
          value={interviewerTranscript}
          onChange={(e) => onInterviewerTranscriptChange(e.target.value)}
          className={inputClass}
          placeholder="Type or record the interviewer’s question..."
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className={labelClass}>Candidate Answer</label>
          <AudioControls speaker="candidate" />
        </div>
        <textarea
          rows={6}
          value={candidateTranscript}
          onChange={(e) => onCandidateTranscriptChange(e.target.value)}
          className={inputClass}
          placeholder="Type or record the candidate’s answer..."
        />
      </div>

      {error && <p className="text-[#ff4d4d] text-sm">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-[#1a2e1a] to-[#2e7d32] text-white py-3 rounded-lg font-semibold shadow-md hover:scale-105 transition"
      >
        {isLoading ? "Evaluating..." : <><EvaluateIcon /> Evaluate</>}
      </button>
    </form>
  );
};

export default InputForm;
