
export interface EvaluationResult {
  question_relevance_score: number;
  answer_relevance_score: number;
  suggested_questions: string[];
}

export type Speaker = 'interviewer' | 'candidate';
