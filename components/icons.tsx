import React from 'react';

// 🟩 REVA AI color palette (Confirmed Green)
// Primary green: #4df755ff
// Secondary mint: #4a9951
// Accent red: #ff4d4d
// Soft gray: #444
// Gradient base: #1a2e1a → #2e7d32

export const LogoIcon: React.FC = () => (
  <div className="bg-gradient-to-r from-[#1a2e1a] to-[#2e7d32] p-3 rounded-lg border border-[#4a9951] shadow-md">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="#4a9951" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 7L12 12" stroke="#5fe66aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 7L12 12" stroke="#6aec75ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 22V12" stroke="#4eee5cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 4.5L17 9.5" stroke="#4bec53ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  </div>
);

export const EvaluateIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#68f36fff"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="hover:stroke-[#4a9951] transition-colors"
  >
    <path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
    <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-1.07 2.4-2.4 2.4" />
    <path d="M12.06 17.94c.92 0 1.66.74 1.66 1.66s-.74 1.66-1.66 1.66" />
  </svg>
);

export const LightbulbIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-[#4a9951]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
);

export const MicrophoneIcon: React.FC<{ isListening?: boolean }> = ({ isListening = false }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-colors ${isListening ? 'text-[#ff4d4d] animate-pulse' : 'text-[#2e7d32]'}`}
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>
);

export const DownloadIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#6df779ff"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="hover:stroke-[#2e7d32] transition-colors"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

export const SpeechToTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 10 2 2 4-4"/>
    <path d="M5 16v-4.2C5 10.5 6.2 9 8 9c.9 0 1.8.4 2.4 1"/>
    <path d="M19 16v-4.2c0-1.3-1.2-2.8-3-2.8-.9 0-1.8.4-2.4 1"/>
    <rect width="18" height="12" x="3" y="6" rx="2"/>
  </svg>
);