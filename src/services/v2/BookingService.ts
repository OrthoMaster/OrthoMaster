import { AxiosError, AxiosResponse } from 'axios';
import axiosInstance, { baseUrl } from './axiosInstance';

/** Domaine des pages vitrines web des experts. */
const EXPERT_SHOWCASE_BASE = 'https://expert.orthomaster.fr';

/* ---- Types communs ---- */

export type BookingPeriod = 'morning' | 'afternoon';
export type BookingExceptionType = 'add' | 'block';
/** Convention ISO-8601 : 1 = lundi … 7 = dimanche. */
export type BookingWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface BookingDomain {
  id: number;
  name: string;
}

/** Champs communs à la liste et à la fiche. */
interface BookingExpertBase {
  id: number;
  /** Titre affiché au-dessus du nom : « Dr », « Pr »… */
  honorific: string | null;
  name: string;
  /** Références affichées sous le nom. */
  credentials: string | null;
  /** Courte présentation, pour la fiche de l'expert. */
  lede: string | null;
  slug: string | null;
  avatar_url: string | null;
  /** Clé de palette (turquoise, orange…) et sa couleur résolue ; null = couleur par défaut. */
  palette: string | null;
  palette_color: string | null;
}

export interface BookingExpert extends BookingExpertBase {
  domains: BookingDomain[];
  /** Accepte des demandes ; absent dans GET /booking/me. */
  online?: boolean;
}

/** Sans domaines : la liste ne les affiche pas. */
export interface BookingExpertListItem extends BookingExpertBase {
  /** Accepte des demandes : réservation activée, offre active et créneau ouvert. */
  online: boolean;
}

export interface BookingExpertsPage {
  experts: BookingExpertListItem[];
  pagination: { page: number; per_page: number; total: number; has_more: boolean };
}

export interface BookingOffer {
  id: number;
  title: string;
  description: string | null;
  /** Nombre de demi-journées (1 = 0,5 jour). */
  blocks_count: number;
  /** Libellé prêt à afficher : « 1,5 jour ». */
  duration_label: string;
  price: number;
  currency: string;
}

export interface BookingExpertDetail {
  expert: BookingExpert;
  timezone: string;
  /** Premier et dernier jour réservables (Y-m-d, fuseau de l'expert). */
  first_date: string;
  last_date: string;
  offers: BookingOffer[];
}

export interface BookingBlock {
  period: BookingPeriod;
  /** UTC ISO 8601 : à convertir dans le fuseau de l'appareil. */
  start_at: string;
  end_at: string;
  /** HH:MM dans le fuseau de l'expert. */
  start_local: string;
  end_local: string;
}

export interface BookingDay {
  date: string;
  blocks: BookingBlock[];
}

export interface BookingCalendar {
  timezone: string;
  first_date: string;
  last_date: string;
  /** Uniquement les jours ayant au moins une demi-journée libre. */
  days: BookingDay[];
}

/* ---- Types de la configuration expert ---- */

export interface ExpertBookingTimes {
  morning_start: string;
  morning_end: string;
  afternoon_start: string;
  afternoon_end: string;
}

export interface ExpertBookingDefaults extends ExpertBookingTimes {
  min_notice_hours: number;
  max_advance_months: number;
}

export interface ExpertBookingResolved extends ExpertBookingDefaults {
  enabled_flg: boolean;
  timezone: string;
}

/** null = l'expert suit la valeur système. */
export type ExpertBookingOwn = {
  [K in keyof ExpertBookingDefaults]: ExpertBookingDefaults[K] | null;
};

export interface ExpertBookingLimits {
  block_min_minutes: number;
  block_max_minutes: number;
  max_notice_hours: number;
  max_advance_months: number;
  max_blocks_per_offer: number;
  max_exception_days: number;
}

export interface ExpertOwnOffer extends BookingOffer {
  active_flg: boolean;
  order_dsp: number;
}

export interface ExpertAvailabilityRule {
  id: number;
  weekday: BookingWeekday;
  period: BookingPeriod;
  valid_from: string | null;
  valid_until: string | null;
  expired: boolean;
}

export interface ExpertAvailabilityException {
  id: number;
  date: string;
  /** null = journée entière. */
  period: BookingPeriod | null;
  type: BookingExceptionType;
}

export interface ExpertBookingSetup {
  is_expert: true;
  expert_id: number;
  expert: BookingExpert;
  settings: {
    own: ExpertBookingOwn;
    resolved: ExpertBookingResolved;
    defaults: ExpertBookingDefaults;
  };
  limits: ExpertBookingLimits;
  offers: ExpertOwnOffer[];
  rules: ExpertAvailabilityRule[];
  exceptions: ExpertAvailabilityException[];
  /** Présent après un ajout de créneaux ou d'exceptions, pour le toast. */
  result?: { created: number; skipped: number } | { dates: number };
}

export interface NotExpert {
  is_expert: false;
}

/* ---- Saisies ---- */

/** Mise à jour partielle : un champ absent ne change pas, null revient à la valeur système. */
export type ExpertBookingSettingsInput = Partial<ExpertBookingOwn> & {
  enabled_flg?: boolean;
  timezone?: string;
};

export interface ExpertOfferInput {
  title: string;
  description?: string | null;
  blocks_count: number;
  price: number;
  active_flg?: boolean;
  order_dsp?: number | null;
}

export interface ExpertRulesInput {
  weekdays: BookingWeekday[];
  periods: BookingPeriod[];
  valid_from?: string | null;
  valid_until?: string | null;
}

export interface ExpertExceptionsInput {
  date_from: string;
  date_to?: string | null;
  period: BookingPeriod | null;
  type: BookingExceptionType;
}

/* ---- Résultat des écritures ---- */

/**
 * Les écritures de l'expert renvoient le détail de l'échec, contrairement aux autres
 * services : un 422 doit pouvoir s'afficher sous le champ concerné
 * (ex. « Le bloc du matin doit durer entre 3 et 5 heures. »).
 */
export type BookingResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      /** null = pas de réponse du serveur (réseau). */
      status: number | null;
      message: string | null;
      /** Clés Laravel : 'morning_end', 'weekdays', 'weekdays.0'… */
      errors: Record<string, string[]>;
    };

const toResult = <T>(response: AxiosResponse): BookingResult<T> => {
  if (response.data?.success == true) {
    return { ok: true, data: response.data.data };
  }
  return {
    ok: false,
    status: response.status,
    message: response.data?.message ?? null,
    errors: {},
  };
};

const toFailure = (e: AxiosError<any>): BookingResult<never> => ({
  ok: false,
  status: e.response?.status ?? null,
  message: e.response?.data?.message ?? null,
  errors: e.response?.data?.errors ?? {},
});

/* ---- Utilisateur : parcourir les experts ---- */

/**
 * Liste paginée des experts (10 par page) : ceux qui acceptent des demandes en tête.
 * GET /booking/experts?page=&q=
 */
export const getBookingExperts = async (params?: {
  page?: number;
  q?: string;
}): Promise<BookingExpertsPage | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/experts`, { params })
    .then((response) => {
      if (response.data?.success == true) {
        return response.data.data;
      }
      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
};

/**
 * Fiche d'un expert et ses offres actives.
 * Une seule offre : l'écran peut passer directement au calendrier.
 * GET /booking/experts/{expertId}
 */
export const getBookingExpert = async (
  expertId: number | string
): Promise<BookingExpertDetail | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/experts/${expertId}`)
    .then((response) => {
      if (response.data?.success == true) {
        return response.data.data;
      }
      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
};

/**
 * Demi-journées libres d'un expert, regroupées par jour.
 * Sans dates : un mois à partir du premier jour réservable. Plage plafonnée à 62 jours.
 * GET /booking/experts/{expertId}/availability
 * @param params from / to au format Y-m-d
 */
export const getExpertAvailability = async (
  expertId: number | string,
  params?: { from?: string; to?: string }
): Promise<BookingCalendar | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/experts/${expertId}/availability`, { params })
    .then((response) => {
      if (response.data?.success == true) {
        return response.data.data;
      }
      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
};

/* ---- Expert : lecture de sa configuration ---- */

/**
 * Configuration complète de l'expert connecté.
 * Un utilisateur non expert reçoit { is_expert: false } : masquer l'écran.
 * GET /booking/me
 */
export const getMyBookingSetup = async (): Promise<ExpertBookingSetup | NotExpert | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/me`)
    .then((response) => {
      if (response.data?.success == true) {
        return response.data.data;
      }
      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
};

/**
 * Aperçu de la grille telle que les utilisateurs la verront, même réservation désactivée.
 * GET /booking/me/preview
 * @param params from / to au format Y-m-d
 */
export const getMyBookingPreview = async (params?: {
  from?: string;
  to?: string;
}): Promise<BookingCalendar | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/me/preview`, { params })
    .then((response) => {
      if (response.data?.success == true) {
        return response.data.data;
      }
      return null;
    })
    .catch((e: AxiosError) => {
      return null;
    });
};

/* ---- Expert : écritures ---- */
// Chaque écriture renvoie la configuration complète : remplacer l'état local tel quel.

/**
 * PUT /booking/me/settings
 */
export const updateMyBookingSettings = async (
  input: ExpertBookingSettingsInput
): Promise<BookingResult<ExpertBookingSetup>> => {
  return axiosInstance
    .put(`${baseUrl}/booking/me/settings`, input)
    .then((response) => toResult<ExpertBookingSetup>(response))
    .catch(toFailure);
};

/**
 * POST /booking/me/offers
 */
export const createMyOffer = async (
  input: ExpertOfferInput
): Promise<BookingResult<ExpertBookingSetup>> => {
  return axiosInstance
    .post(`${baseUrl}/booking/me/offers`, input)
    .then((response) => toResult<ExpertBookingSetup>(response))
    .catch(toFailure);
};

/**
 * PUT /booking/me/offers/{offerId}
 */
export const updateMyOffer = async (
  offerId: number,
  input: ExpertOfferInput
): Promise<BookingResult<ExpertBookingSetup>> => {
  return axiosInstance
    .put(`${baseUrl}/booking/me/offers/${offerId}`, input)
    .then((response) => toResult<ExpertBookingSetup>(response))
    .catch(toFailure);
};

/**
 * Suppression logique : les rendez-vous déjà pris gardent l'offre.
 * DELETE /booking/me/offers/{offerId}
 */
export const deleteMyOffer = async (
  offerId: number
): Promise<BookingResult<ExpertBookingSetup>> => {
  return axiosInstance
    .delete(`${baseUrl}/booking/me/offers/${offerId}`)
    .then((response) => toResult<ExpertBookingSetup>(response))
    .catch(toFailure);
};

/**
 * Chaque jour est combiné avec chaque demi-journée ; les doublons sont ignorés.
 * data.result = { created, skipped }.
 * POST /booking/me/rules
 */
export const addMyAvailabilityRules = async (
  input: ExpertRulesInput
): Promise<BookingResult<ExpertBookingSetup>> => {
  return axiosInstance
    .post(`${baseUrl}/booking/me/rules`, input)
    .then((response) => toResult<ExpertBookingSetup>(response))
    .catch(toFailure);
};

/**
 * DELETE /booking/me/rules/{ruleId}
 */
export const deleteMyAvailabilityRule = async (
  ruleId: number
): Promise<BookingResult<ExpertBookingSetup>> => {
  return axiosInstance
    .delete(`${baseUrl}/booking/me/rules/${ruleId}`)
    .then((response) => toResult<ExpertBookingSetup>(response))
    .catch(toFailure);
};

/**
 * Ressaisir une date remplace l'exception existante. data.result = { dates }.
 * POST /booking/me/exceptions
 */
export const addMyAvailabilityExceptions = async (
  input: ExpertExceptionsInput
): Promise<BookingResult<ExpertBookingSetup>> => {
  return axiosInstance
    .post(`${baseUrl}/booking/me/exceptions`, input)
    .then((response) => toResult<ExpertBookingSetup>(response))
    .catch(toFailure);
};

/**
 * DELETE /booking/me/exceptions/{exceptionId}
 */
export const deleteMyAvailabilityException = async (
  exceptionId: number
): Promise<BookingResult<ExpertBookingSetup>> => {
  return axiosInstance
    .delete(`${baseUrl}/booking/me/exceptions/${exceptionId}`)
    .then((response) => toResult<ExpertBookingSetup>(response))
    .catch(toFailure);
};

/* ---- Outils ---- */

/** Adresse de la page vitrine web ; null si l'expert n'a pas encore de slug. */
export const expertShowcaseUrl = (slug: string | null | undefined): string | null =>
  slug ? `${EXPERT_SHOWCASE_BASE}/${slug}` : null;

/** Premier message d'erreur d'un champ, en regroupant les clés indexées (weekdays.0 → weekdays). */
export const fieldError = (
  errors: Record<string, string[]>,
  field: string
): string | null => {
  const key = Object.keys(errors).find((k) => k === field || k.startsWith(`${field}.`));
  return key ? errors[key][0] ?? null : null;
};