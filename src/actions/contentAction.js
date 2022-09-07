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
  console.log('run content');
  dispatch({
    type: CONTENT_START,
    content: content,
    nbQuiz: nbQuiz
  })
}

export const finishContent = () => (dispatch) => {
  console.log('finish content');
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
  console.log('restart content');
  dispatch({
    type: CONTENT_RESTART
  })
}



export const exitContent = () => (dispatch) => {
  console.log('exit content');
  dispatch({
    type: CONTENT_EXIT
  })
}

export const nextContent = (content) => (dispatch) => {
  console.log('next content');
  dispatch({
    type: CONTENT_NEXT,
    content: content
  })
}

