import { AxiosError } from 'axios';
import axiosInstance, { baseUrl } from './axiosInstance';


export interface Reference {
    chunkInfo: {
        content: string;
        documentMetadata: {
            title: string;
        };
    };
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correct_index: number;
    explanation?: string;
}

export interface QuizData {
    questions: QuizQuestion[];
}

export const currentSubscription = async () => {
    return axiosInstance
        .get(`${baseUrl}/subscription`)
        .then((response) => {
            if (response.data?.success == true) {
                return response.data.data;
            }
            return null;
        })
        .catch((e: AxiosError) => {
            return null;
        });

}

/**
 * Ask and get answer
 */
export const askNotebook = async (
    question: string,
    session_id: string | null) => {
    return axiosInstance
        .post(`${baseUrl}/chatbot/ask-notebook`, { question, session_id })
        .then((response) => {
            if (response.data?.status == 'skipped' || response.data?.status == 'success') {
                return response.data;
            }

            return null;
        })
        .catch((e: AxiosError) => {
            return null;
        });
};

// ─── Parse quiz JSON blocks embedded in the answer ───────────────────────────
// The AI may return ```json { questions: [...] } ``` blocks inside the answer.
// This helper strips them out and returns the clean text + parsed quiz data.

export function parseQuizFromAnswer(rawAnswer: string): {
    cleanAnswer: string;
    quizData: QuizData | null;
} {
    let cleanAnswer = rawAnswer;
    let quizData: QuizData | null = null;

    const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
    let match: RegExpExecArray | null;

    while ((match = jsonRegex.exec(rawAnswer)) !== null) {
        try {
            const parsed = JSON.parse(match[1]);
            const items: QuizQuestion[] | undefined =
                parsed.questions ?? parsed.quiz ?? undefined;
            if (items && Array.isArray(items)) {
                quizData = { questions: items };
                cleanAnswer = cleanAnswer.replace(match[0], "");
            }
        } catch {
            // Not valid quiz JSON — skip silently
        }
    }

    return { cleanAnswer: cleanAnswer.trim(), quizData };
}