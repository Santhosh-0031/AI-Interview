import React from "react";
import { LightbulbIcon } from "./icons";
import ScoreGauge from "./ScoreGauge";

interface EvaluationResult {
  question_relevance_score: number;
  answer_relevance_score: number;
  suggested_questions: string[];
}

interface ResultsDisplayProps {
  results: EvaluationResult | null;
  isLoading: boolean;
  error: string | null;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, isLoading, error }) => {
  if (isLoading) return <p className="text-[#4a9951]">Evaluating...</p>;
  if (error) return <p className="text-[#ff4d4d]">{error}</p>;
  if (!results) return <p className="text-[#444]">No results yet.</p>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold text-[#2e7d32] mb-4">Evaluation Results</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ScoreGauge score={results.question_relevance_score} label="Question Relevance" />
        <ScoreGauge score={results.answer_relevance_score} label="Answer Relevance" />
      </div>

      <h3 className="text-lg font-semibold text-[#4a9951] mb-3 flex items-center gap-2">
        <LightbulbIcon /> Suggested Questions
      </h3>
      <ul className="space-y-3">
        {results.suggested_questions.map((q, i) => (
          <li
            key={i}
            className="bg-white border border-[#4a9951]/40 rounded-lg p-3 text-[#1a2e1a] shadow hover:shadow-lg hover:scale-[1.02] transition"
          >
            {q}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ResultsDisplay;