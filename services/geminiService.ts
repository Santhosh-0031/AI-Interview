import { GoogleGenAI, Type } from "@google/genai";
import type { EvaluationResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const evaluationSchema = {
  type: Type.OBJECT,
  properties: {
    question_relevance_score: { 
        type: Type.INTEGER,
        description: "A score from 0-100 indicating how relevant the interviewer's question is to the specified domain."
    },
    answer_relevance_score: { 
        type: Type.INTEGER,
        description: "A score from 0-100 indicating how relevant the candidate's answer is to the asked question."
    },
    suggested_questions: {
      type: Type.ARRAY,
      description: "An array of three new, domain-relevant interview questions for the interviewer.",
      items: { type: Type.STRING },
    },
  },
  required: ["question_relevance_score", "answer_relevance_score", "suggested_questions"],
};

const systemInstruction = `You are an AI assistant embedded inside a live online interview platform with video powered by Jitsi.
The platform streams live video from both interviewer and candidate.
Speech from each participant is continuously converted to text (speech-to-text) and sent to you in real time.

Your role is to evaluate EVERY individual interviewer question and candidate answer as soon as it arrives.

You will be given a JSON object containing the interview domain, the interviewer's question, and the candidate's answer.

You must perform the following tasks:

1. Check Interviewer Question:
   - Determine if the interviewer’s question belongs to the specified domain.
   - Score the question’s relevance to the domain on a scale of 0 to 100.

2. Check Candidate Answer:
   - Determine if the candidate’s answer correctly and clearly responds to the interviewer’s question.
   - Score the answer’s relevance to the question on a scale of 0 to 100.

3. Suggest New Domain Questions:
   - Provide 3 domain-specific interview questions the interviewer can ask next.
   - These should be practical, moderately challenging, and aligned with the specified domain.

Evaluation Rules:
- ALWAYS evaluate every question and every answer individually.
- Use only the provided domain to judge the interviewer’s question.
- Use only the current interviewer question to judge the candidate’s answer.
- Suggested questions must strictly belong to the domain.
- Keep outputs concise. Your entire response must be a single, valid JSON object that conforms to the provided schema.`;


export const evaluateInteraction = async (domain: string, question: string, answer: string): Promise<EvaluationResult> => {
    const userPrompt = JSON.stringify({
        domain: domain,
        interviewer_question: question,
        candidate_answer: answer,
    });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: evaluationSchema,
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        // Basic validation
        if (typeof result.question_relevance_score !== 'number' ||
            typeof result.answer_relevance_score !== 'number' ||
            !Array.isArray(result.suggested_questions) ||
            result.suggested_questions.length !== 3) {
            throw new Error('Invalid JSON structure received from API.');
        }

        return result as EvaluationResult;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get evaluation from AI. Please check your input and try again.");
    }
};
