import {
    CONTENT_START,
    CONTENT_RESTART,
    CONTENT_QUIZ_DONE,
    CONTENT_EXIT,
    CONTENT_NEXT,
    CONTENT_FINISH
} from "../actions/types";



const initialState = {
    content: null,
    isRunning: false,
    quizPassed: [],
    isFinish: false,
    nbQuiz: 0
}

export const selectContent = state => state.content.content
export const selectIsRunning = state => state.content.isRunning
export const selectIsFinish = state => state.content.isFinish


export const contentReducer = (state = initialState, action) => {
    switch (action.type) {
        case CONTENT_START:
            return {
                ...state,
                content: action.content,
                nbQuiz: action.nbQuiz,
                isRunning: true
            }

        case CONTENT_FINISH:
            return {
                ...state,
                isFinish: true
            }
        case CONTENT_QUIZ_DONE:
            return {
                ...state,
                quizPassed: [...state.quizPassed, action.quiz],
            };


        case CONTENT_RESTART:
            return {
                ...state,
                isRunning: true,
                quizPassed: [],
                isFinish: false
            }
        case CONTENT_NEXT:
            return {
                ...state,
                isRunning: true,
                content: action.content,
                isFinish: false,
                quizPassed: []
            }


        case CONTENT_EXIT:
            return initialState
        default:
            return state;
    }
}

