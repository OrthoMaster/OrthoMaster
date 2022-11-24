import {
  CONTENT_START,
  CONTENT_RESTART,
  CONTENT_QUIZ_DONE,
  CONTENT_EXIT,
  CONTENT_NEXT,
  CONTENT_FINISH
} from "./types";

//import { fetchSearchList } from "../services/SearchService";



export const runContent = (content, nbQuiz) => (dispatch) => {
  dispatch({
    type: CONTENT_START,
    content: content,
    nbQuiz: nbQuiz
  })
}

export const finishContent = () => (dispatch) => {
  dispatch({
    type: CONTENT_FINISH
  })
}

export const quizCompleted = (quiz) => (dispatch) => {
  dispatch({
    type: CONTENT_QUIZ_DONE,
    quiz: quiz,
  })
}

export const restartContent = () => (dispatch) => {
  dispatch({
    type: CONTENT_RESTART
  })
}



export const exitContent = () => (dispatch) => {
  dispatch({
    type: CONTENT_EXIT
  })
}

export const nextContent = (content) => (dispatch) => {
  dispatch({
    type: CONTENT_NEXT,
    content: content
  })
}

