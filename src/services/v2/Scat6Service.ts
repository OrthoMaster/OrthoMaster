import { AxiosError } from 'axios';
import { Platform } from 'react-native';
import axiosInstance, { baseUrl } from './axiosInstance';

import type { Diagnosis, ExamKind, ListId, Neuro, Scat6Data, Scat6Step, Scat6Summary, SportId } from '../../scat6/core/types';

/**
 * API SCAT6 (Outils › SCAT6, médecins seulement). Routes : orthomaster-cms › Scat6Controller.
 * Enveloppe { success, data } ; les erreurs remontent avec le message du serveur (Scat6Error).
 */

export interface Scat6LastAssessment {
  uuid: string;
  exam_kind: ExamKind;
  status: 'draft' | 'completed';
  diagnosis: Diagnosis | null;
  updated_at: string;
}

export interface Scat6Patient {
  id: number;
  name: string;
  birth_year: number;
  age: number | null;
  sport: SportId;
  notes: string | null;
  created_at: string | null;
  assessments_count: number;
  has_baseline: boolean;
  drafts_count: number;
  last_assessment: Scat6LastAssessment | null;
}

export interface Scat6AssessmentRow {
  uuid: string;
  patient_id: number;
  patient_name: string | null;
  patient_sport: SportId | null;
  exam_kind: ExamKind;
  status: 'draft' | 'completed';
  step: Scat6Step | 'resultat' | null;
  word_list: ListId;
  diagnosis: Diagnosis | null;
  neuro: Neuro | null;
  summary: Scat6Summary | null;
  signed_by: string | null;
  injury_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string | null;
}

export interface Scat6PatientDetail extends Scat6Patient {
  assessments: Scat6AssessmentRow[];
}

export interface Scat6AssessmentDetail extends Scat6AssessmentRow {
  content_version: string;
  data: Scat6Data;
  notes: string | null;
  patient: Scat6Patient;
  /** Dernière baseline signée du patient (hors cet examen). */
  baseline: Scat6AssessmentRow | null;
}

export interface Scat6PatientInput {
  name: string;
  birth_year: number;
  sport: SportId;
  notes?: string | null;
}

export interface Scat6DraftInput {
  patient_id: number;
  exam_kind: ExamKind;
  injury_at: string | null;
  word_list: ListId;
  step: Scat6Step;
  started_at?: string;
  data: Scat6Data;
}

export class Scat6Error extends Error {
  status: number | null;
  constructor(message: string, status: number | null) {
    super(message);
    this.status = status;
  }
}

/** Message lisible : erreur métier du serveur, première erreur de validation, ou message générique. */
const toError = (e: AxiosError<any>) => {
  const body = e.response?.data;
  const validation = body?.errors ? (Object.values(body.errors)[0] as string[] | undefined)?.[0] : null;
  const message = body?.error ?? validation ?? body?.message ?? 'Erreur de connexion. Réessayez.';
  return new Scat6Error(message, e.response?.status ?? null);
};

const unwrap = <T,>(promise: Promise<{ data: { success?: boolean; data: T } }>) =>
  promise
    .then((response) => response.data.data)
    .catch((e: AxiosError) => {
      throw toError(e);
    });

/* ---- Patients ---- */

export const getScat6Patients = (q?: string) =>
  unwrap<Scat6Patient[]>(axiosInstance.get(`${baseUrl}/scat/patients`, { params: q ? { q } : undefined }));

export const getScat6Patient = (id: number) => unwrap<Scat6PatientDetail>(axiosInstance.get(`${baseUrl}/scat/patients/${id}`));

export const createScat6Patient = (input: Scat6PatientInput) =>
  unwrap<Scat6Patient>(axiosInstance.post(`${baseUrl}/scat/patients`, input));

export const updateScat6Patient = (id: number, input: Scat6PatientInput) =>
  unwrap<Scat6Patient>(axiosInstance.put(`${baseUrl}/scat/patients/${id}`, input));

export const deleteScat6Patient = (id: number) =>
  unwrap<undefined>(axiosInstance.delete(`${baseUrl}/scat/patients/${id}`));

/* ---- Examens ---- */

export const getScat6Assessments = () => unwrap<Scat6AssessmentRow[]>(axiosInstance.get(`${baseUrl}/scat/assessments`));

export const getScat6Assessment = (uuid: string) =>
  unwrap<Scat6AssessmentDetail>(axiosInstance.get(`${baseUrl}/scat/assessments/${uuid}`));

/** Sauvegarde automatique (crée l'examen au premier appel). */
export const saveScat6Draft = (uuid: string, input: Scat6DraftInput) =>
  unwrap<Scat6AssessmentRow>(axiosInstance.put(`${baseUrl}/scat/assessments/${uuid}`, input));

export const completeScat6Assessment = (
  uuid: string,
  input: { diagnosis: Diagnosis | null; neuro: Neuro | null; notes: string; attested: boolean }
) => unwrap<Scat6AssessmentDetail>(axiosInstance.post(`${baseUrl}/scat/assessments/${uuid}/complete`, input));

export const deleteScat6Draft = (uuid: string) =>
  unwrap<undefined>(axiosInstance.delete(`${baseUrl}/scat/assessments/${uuid}`));

/**
 * Rapport PDF d'un examen signé. Web : téléchargé avec le jeton puis ouvert dans un nouvel onglet
 * (un simple lien ne porterait pas l'en-tête d'authentification).
 */
export const openScat6Report = async (uuid: string, fileName: string) => {
  try {
    const response = await axiosInstance.get(`${baseUrl}/scat/assessments/${uuid}/pdf`, {
      responseType: 'blob',
      timeout: 60000,
    });
    if (Platform.OS !== 'web') return;
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const tab = window.open(url, '_blank');
    // Fenêtre bloquée par le navigateur : téléchargement à la place.
    if (!tab) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (e) {
    throw toError(e as AxiosError);
  }
};
