import { AxiosError, AxiosResponse } from 'axios';
import axiosInstance, { baseUrl } from './axiosInstance';

/** Domaine des pages vitrines web des experts. */
const EXPERT_SHOWCASE_BASE = 'https://expert.orthomaster.fr';

/* ---- Types communs ---- */

export type BookingPeriod = 'morning' | 'afternoon';
export type BookingExceptionType = 'add' | 'block';
/** En ligne (visio) ou en présentiel (au cabinet de l'expert). */
export type BookingMode = 'online' | 'onsite';
/** Toutes les demi-journées de la grille, certaines seulement, ou des dates précises. */
export type BookingScheduleType = 'weekly_all' | 'weekly_selected' | 'dates';
/** Convention ISO-8601 : 1 = lundi … 7 = dimanche. */
export type BookingWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface BookingDomain {
  id: number;
  name: string;
}

/** Champs communs à la liste et à la fiche. */
export interface BookingExpertBase {
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
  /** Page vitrine publiée (brochure_published_at renseigné) : seul cas où le lien est montré. */
  showcase_published?: boolean;
}

export interface BookingExpert extends BookingExpertBase {
  domains: BookingDomain[];
  /** Accepte des demandes ; absent dans GET /booking/me. */
  online?: boolean;
}

/** Ligne courte d'une offre sous l'expert, dans la liste. */
export interface BookingOfferSummary {
  id: number;
  title: string;
  duration_label: string;
  /** Modes actifs. */
  modes: BookingMode[];
  /** Prix TTC le plus bas des modes actifs. */
  price_from: number | null;
  currency: string;
}

/** Sans domaines : la liste ne les affiche pas. */
export interface BookingExpertListItem extends BookingExpertBase {
  /** Accepte des demandes : réservation activée, offre active et créneau ouvert. */
  online: boolean;
  /** Offres actives, seulement pour un expert qui accepte des demandes. */
  offers?: BookingOfferSummary[];
}

export interface BookingExpertsPage {
  experts: BookingExpertListItem[];
  pagination: { page: number; per_page: number; total: number; has_more: boolean };
}

/** Image d'illustration d'un thème (schéma, photo opératoire…). */
export interface BookingOfferImage {
  id: number;
  url: string;
  caption: string | null;
  /** Dimensions d'origine si connues : affichage au bon format sans attendre le chargement. */
  width?: number | null;
  height?: number | null;
}

/** Adresse publique d'un lieu, telle que Google l'a fournie. */
export interface BookingLocation {
  id: number;
  /** Nom court choisi par l'expert : « Cabinet A ». */
  label: string;
  address_line: string;
  postal_code: string | null;
  city: string;
  country: string | null;
  lat: number | null;
  lng: number | null;
  /** Itinéraire Google Maps prêt à ouvrir. */
  maps_url: string;
}

/** Une façon de suivre l'offre, avec son prix TTC pour toute l'offre. */
export interface BookingOfferMode {
  mode: BookingMode;
  label: string;
  price: number;
  schedule_type: BookingScheduleType;
  book_ahead_days: number | null;
  /** Présentiel, fiche publique seulement : lieux où l'offre peut se tenir. */
  locations?: BookingLocation[];
}

export interface BookingOffer {
  id: number;
  title: string;
  description: string | null;
  /** Nombre de demi-journées (1 = 0,5 jour). */
  blocks_count: number;
  /** Libellé prêt à afficher : « 1,5 jour ». */
  duration_label: string;
  /** Prix le plus bas des modes actifs (écrans qui n'affichent qu'un prix) ; null sans mode actif. */
  price: number | null;
  currency: string;
  /** Modes actifs uniquement. */
  modes: BookingOfferMode[];
  /** Illustrations, dans l'ordre d'affichage ; vide tant que la table n'existe pas. */
  images: BookingOfferImage[];
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
  /** Présentiel : lieu de la demi-journée (nom court + ville) ; null en ligne. */
  location?: { id: number; label: string; city: string } | null;
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
  /** Jours calendaires : 1 = réservable dès le lendemain matin. */
  min_notice_days: number;
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
  max_notice_days: number;
  max_advance_months: number;
  max_blocks_per_offer: number;
  max_exception_days: number;
  /** « Fermer les réservations N jours avant » (Dates précises). */
  book_ahead?: { min: number; max: number; default: number };
  max_offer_dates?: number;
  location?: { label_max: number; access_max: number };
  /** Recherche d'adresse Google disponible (clé configurée sur le serveur). */
  places?: { enabled: boolean; min_input: number };
  /** Illustrations par thème ; l'ajout se fait depuis le CMS. */
  max_offer_images?: number;
  image_caption_max?: number;
  profile?: {
    honorific_max: number;
    name_max: number;
    credentials_max: number;
    lede_max: number;
    domain_max: number;
  };
}

/** Palette proposée dans le profil (BrochureDraft::PALETTES). */
export interface ExpertPaletteOption {
  key: string;
  name: string;
  color: string;
}

/**
 * Configuration complète d'un mode, active ou non : pré-remplit le formulaire
 * et se renvoie telle quelle à l'enregistrement.
 */
export interface ExpertOfferModeConfig {
  enabled: boolean;
  price: number | null;
  schedule_type: BookingScheduleType;
  book_ahead_days: number;
  /** « jour|période » : « 1|morning ». */
  slots: string[];
  /** « Y-m-d|période » : « 2026-11-12|afternoon ». */
  dates: string[];
}

export interface ExpertOwnOffer extends BookingOffer {
  active_flg: boolean;
  order_dsp: number;
  modes_config: Record<BookingMode, ExpertOfferModeConfig>;
}

export interface ExpertAvailabilityRule {
  id: number;
  weekday: BookingWeekday;
  period: BookingPeriod;
  /** Lieu de la demi-journée ; null = en ligne seulement. */
  location_id: number | null;
  location_label: string | null;
  valid_from: string | null;
  valid_until: string | null;
  expired: boolean;
}

/** Lieu de l'expert, avec ce qu'il peut encore y modifier. */
export interface ExpertLocation extends BookingLocation {
  google_place_id: string | null;
  access_details: string | null;
  archived: boolean;
  rules_count: number;
  /** Des rendez-vous en attente ou à venir s'y tiennent. */
  address_locked: boolean;
}

/** Demi-journée de la grille utilisable pour un mode, avec son lieu s'il y en a un. */
export interface ExpertGridSlot {
  weekday: BookingWeekday;
  period: BookingPeriod;
  location_label: string | null;
}

/** Date proposable pour « Dates précises ». */
export interface ExpertGridDate {
  date: string;
  period: BookingPeriod;
  location_label: string | null;
}

/** Suggestion Google pendant la frappe. */
export interface PlaceSuggestion {
  place_id: string;
  /** Première ligne : « 12 Rue des Lilas ». */
  main: string;
  /** Seconde ligne : « Strasbourg, France ». */
  secondary: string;
  text: string;
}

/** Adresse détaillée d'une suggestion choisie, lue par le serveur chez Google. */
export interface PlaceDetails {
  google_place_id: string;
  name: string | null;
  is_establishment: boolean;
  address_line: string;
  postal_code: string | null;
  city: string;
  country: string | null;
  lat: number | null;
  lng: number | null;
  formatted: string;
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
  palettes?: ExpertPaletteOption[];
  modes?: { key: BookingMode; label: string }[];
  schedule_types?: { key: BookingScheduleType; label: string }[];
  offers: ExpertOwnOffer[];
  locations: ExpertLocation[];
  /** Demi-journées utilisables par mode ; en ligne = toute la grille. */
  grid: Record<BookingMode, ExpertGridSlot[]>;
  rules: ExpertAvailabilityRule[];
  exceptions: ExpertAvailabilityException[];
  /** Présent après certaines écritures, pour le toast ou la sélection. */
  result?:
    | { created: number; skipped: number }
    | { dates: number }
    | { location_id: number }
    | { detached_rules: number };
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

export interface ExpertOfferModeInput {
  enabled: boolean;
  price?: number | null;
  schedule_type?: BookingScheduleType;
  book_ahead_days?: number | null;
  slots?: string[];
  dates?: string[];
  /**
   * Présentiel : lieu des demi-journées de la grille qui n'en ont pas encore
   * (« jour|période » => id du lieu). Fixé dans la grille à l'enregistrement.
   */
  locations?: Record<string, number>;
}

export interface ExpertOfferInput {
  title: string;
  description?: string | null;
  blocks_count: number;
  active_flg?: boolean;
  order_dsp?: number | null;
  modes: Record<BookingMode, ExpertOfferModeInput>;
}

export interface ExpertRulesInput {
  weekdays: BookingWeekday[];
  periods: BookingPeriod[];
  location_id?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
}

/** Nouveau lieu à partir d'une suggestion Google : l'adresse est relue par le serveur. */
export interface ExpertLocationInput {
  place_id: string;
  session?: string | null;
  label: string;
  access_details?: string | null;
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
 * Demi-journées libres d'une offre dans un mode, regroupées par jour ; en présentiel,
 * chaque demi-journée porte son lieu. Sans offre : grille générale de l'expert.
 * Sans dates : un mois à partir du premier jour réservable. Plage plafonnée à 62 jours.
 * GET /booking/experts/{expertId}/availability?offer_id=&mode=&from=&to=
 * @param params from / to au format Y-m-d
 */
export const getExpertAvailability = async (
  expertId: number | string,
  params?: { offer_id?: number; mode?: BookingMode; from?: string; to?: string }
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
 * Aperçu tel que les utilisateurs le verront, même réservation désactivée :
 * grille générale, ou calendrier d'une offre dans un mode (offer_id + mode).
 * GET /booking/me/preview
 * @param params from / to au format Y-m-d
 */
export const getMyBookingPreview = async (params?: {
  from?: string;
  to?: string;
  offer_id?: number;
  mode?: BookingMode;
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

/**
 * Demi-journées proposables pour « Dates précises » : jusqu'à la limite de réservation,
 * dates fermées exclues. En ligne = toute la grille, chaque date avec son lieu s'il y en a un.
 * GET /booking/me/grid-dates?mode=
 */
export const getMyGridDates = async (mode: BookingMode = 'online'): Promise<ExpertGridDate[] | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/me/grid-dates`, { params: { mode } })
    .then((response) => (response.data?.success == true ? response.data.data.dates : null))
    .catch(() => null);
};

/* ---- Expert : recherche d'adresse (Google, via le serveur) ---- */

/**
 * Suggestions pendant la frappe. `session` : même jeton pour toute une recherche,
 * jusqu'au choix (Google facture alors la recherche en une fois).
 * GET /booking/me/places/autocomplete?q=&session=
 */
export const searchPlaces = async (
  q: string,
  session: string
): Promise<BookingResult<{ suggestions: PlaceSuggestion[] }>> => {
  return axiosInstance
    .get(`${baseUrl}/booking/me/places/autocomplete`, { params: { q, session } })
    .then((response) => toResult<{ suggestions: PlaceSuggestion[] }>(response))
    .catch(toFailure);
};

/**
 * Adresse détaillée d'une suggestion, pour l'aperçu avant d'enregistrer le lieu.
 * GET /booking/me/places/{placeId}?session=
 */
export const getPlaceDetails = async (
  placeId: string,
  session: string
): Promise<BookingResult<{ place: PlaceDetails }>> => {
  return axiosInstance
    .get(`${baseUrl}/booking/me/places/${encodeURIComponent(placeId)}`, { params: { session } })
    .then((response) => toResult<{ place: PlaceDetails }>(response))
    .catch(toFailure);
};

/* ---- Expert : écritures ---- */
// Chaque écriture renvoie la configuration complète : remplacer l'état local tel quel.

/**
 * Nouveau lieu depuis une suggestion Google ; data.result.location_id = lieu créé.
 * POST /booking/me/locations
 */
export const createMyLocation = async (
  input: ExpertLocationInput
): Promise<BookingResult<ExpertBookingSetup>> => {
  return axiosInstance
    .post(`${baseUrl}/booking/me/locations`, input)
    .then((response) => toResult<ExpertBookingSetup>(response))
    .catch(toFailure);
};

/**
 * Seuls le nom et les informations d'accès se modifient.
 * PUT /booking/me/locations/{locationId}
 */
export const updateMyLocation = async (
  locationId: number,
  input: { label: string; access_details?: string | null }
): Promise<BookingResult<ExpertBookingSetup>> => {
  return axiosInstance
    .put(`${baseUrl}/booking/me/locations/${locationId}`, input)
    .then((response) => toResult<ExpertBookingSetup>(response))
    .catch(toFailure);
};

/**
 * Lieu d'une demi-journée de la grille ; null = en ligne seulement.
 * Refusé (422) si une offre en présentiel en a besoin.
 * PUT /booking/me/rules/{ruleId}/location
 */
export const setMyRuleLocation = async (
  ruleId: number,
  locationId: number | null
): Promise<BookingResult<ExpertBookingSetup>> => {
  return axiosInstance
    .put(`${baseUrl}/booking/me/rules/${ruleId}/location`, { location_id: locationId })
    .then((response) => toResult<ExpertBookingSetup>(response))
    .catch(toFailure);
};

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

/* ---- Images d'un thème (ajout depuis le CMS) ---- */

/**
 * PUT /booking/me/offers/{offerId}/images/order
 */
export const reorderMyOfferImages = async (
  offerId: number,
  ids: number[]
): Promise<BookingResult<ExpertBookingSetup>> => {
  return axiosInstance
    .put(`${baseUrl}/booking/me/offers/${offerId}/images/order`, { ids })
    .then((response) => toResult<ExpertBookingSetup>(response))
    .catch(toFailure);
};

/**
 * PUT /booking/me/offers/{offerId}/images/{imageId}
 */
export const updateMyOfferImage = async (
  offerId: number,
  imageId: number,
  caption: string | null
): Promise<BookingResult<ExpertBookingSetup>> => {
  return axiosInstance
    .put(`${baseUrl}/booking/me/offers/${offerId}/images/${imageId}`, { caption })
    .then((response) => toResult<ExpertBookingSetup>(response))
    .catch(toFailure);
};

/**
 * DELETE /booking/me/offers/{offerId}/images/{imageId}
 */
export const deleteMyOfferImage = async (
  offerId: number,
  imageId: number
): Promise<BookingResult<ExpertBookingSetup>> => {
  return axiosInstance
    .delete(`${baseUrl}/booking/me/offers/${offerId}/images/${imageId}`)
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

/**
 * Jeton de session Places : un par recherche. Pas de dépendance (crypto.randomUUID
 * n'existe pas partout sous React Native) ; l'unicité suffit, pas la sécurité.
 */
export const newPlacesSession = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

/** Premier message d'erreur d'un champ, en regroupant les clés indexées (weekdays.0 → weekdays). */
export const fieldError = (
  errors: Record<string, string[]>,
  field: string
): string | null => {
  const key = Object.keys(errors).find((k) => k === field || k.startsWith(`${field}.`));
  return key ? errors[key][0] ?? null : null;
};

/* ---- Utilisateur : récapitulatif et paiement d'une demande ---- */

export interface BookingPricing {
  /** Déduit du prix TTC de l'offre par le serveur. */
  amount_ht: number;
  /** En pourcentage : 20 = 20 %. */
  tva_rate: number;
  tva_amount: number;
  amount_ttc: number;
  currency: string;
}

export interface BookingCheckout {
  user: { name: string; email: string };
  mode: BookingMode;
  pricing: BookingPricing;
  /** Politique d'annulation du mode, en vigueur aujourd'hui. */
  policy: { free_cancel_hours: number; late_cancel_penalty_pct: number; user_noshow_refund_pct: number } | null;
  /** Faux : rendez-vous offert (paiement désactivé ou offre à 0 €), la demande part sans paiement. */
  payment_enabled: boolean;
  terms_url: string;
  message_max: number;
}

export type BookingStatus = 'awaiting_payment' | 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';

export interface BookingRequest extends BookingPricing {
  id: number;
  status: BookingStatus;
  offer_title: string;
  payment_required: boolean;
  /** ISO 8601 ; renseigné quand la demande est transmise à l'expert. */
  respond_by: string | null;
  mode: BookingMode;
  blocks: { date: string; period: BookingPeriod; start_local: string; end_local: string; location: BookedLocation | null }[];
}

export interface BookingCheckoutInput {
  offer_id: number;
  mode: BookingMode;
  blocks: { date: string; period: BookingPeriod }[];
  address: string;
  message?: string | null;
}

export type BookingIntent =
  | { requires_payment: false; booking: BookingRequest }
  | {
      requires_payment: true;
      booking: BookingRequest;
      invoice_id: number;
      client_secret: string;
      payment_intent_id: string;
      publishable_key: string;
    };

/** Code renvoyé (409) quand une demi-journée a été prise par une autre demande entre-temps. */
export const SLOT_TAKEN = 'slot_taken';

/** Une réponse 409 garde son code : l'écran renvoie alors au calendrier. */
const toPaymentResult = <T>(response: AxiosResponse): BookingResult<T> & { code?: string } => ({
  ...toResult<T>(response),
  ...(response.data?.code ? { code: response.data.code } : {}),
});

const toPaymentFailure = (e: AxiosError<any>): BookingResult<never> & { code?: string } => ({
  ...toFailure(e),
  ...(e.response?.data?.code ? { code: e.response.data.code } : {}),
});

/**
 * Nom et e-mail de l'utilisateur, montants HT / TVA / TTC du thème dans ce mode.
 * GET /payments/bookings/checkout?offer_id=&mode=
 */
export const getBookingCheckout = async (offerId: number, mode: BookingMode): Promise<BookingCheckout | null> => {
  return axiosInstance
    .get(`${baseUrl}/payments/bookings/checkout`, { params: { offer_id: offerId, mode } })
    .then((response) => (response.data?.success == true ? response.data.data : null))
    .catch(() => null);
};

/**
 * Crée la demande et l'intention de paiement (montant réservé, débité à l'acceptation).
 * Une nouvelle tentative annule la précédente restée sans paiement.
 * POST /payments/bookings/create-intent
 */
export const createBookingPaymentIntent = async (input: BookingCheckoutInput) => {
  return axiosInstance
    .post(`${baseUrl}/payments/bookings/create-intent`, input)
    .then((response) => toPaymentResult<BookingIntent>(response))
    .catch(toPaymentFailure);
};

/**
 * PUT /payments/bookings/{bookingId}/confirm
 */
export const confirmBookingPayment = async (bookingId: number, paymentIntentId: string) => {
  return axiosInstance
    .put(`${baseUrl}/payments/bookings/${bookingId}/confirm`, { payment_intent_id: paymentIntentId })
    .then((response) => toPaymentResult<{ booking: BookingRequest }>(response))
    .catch(toPaymentFailure);
};

/**
 * Abandon avant paiement : libère l'empreinte bancaire éventuelle.
 * PUT /payments/bookings/{bookingId}/cancel
 */
export const cancelBookingPayment = async (bookingId: number): Promise<boolean> => {
  return axiosInstance
    .put(`${baseUrl}/payments/bookings/${bookingId}/cancel`)
    .then((response) => response.data?.success == true)
    .catch(() => false);
};

/* ---- Utilisateur : mes rendez-vous ---- */

/** « completed » = acceptée et passée ; calculé par le serveur. */
export type MyBookingStatus = 'pending' | 'accepted' | 'completed' | 'declined' | 'expired' | 'cancelled';

export interface MyBookingBlock {
  id: number;
  date: string;
  period: BookingPeriod;
  /** HH:MM dans le fuseau de l'expert. */
  start_local: string;
  end_local: string;
  /** ISO 8601 UTC. */
  start_at: string | null;
  end_at: string | null;
  /** Lien Google Meet de la demi-journée ; null tant que l'intégration n'est pas en place. */
  meet_url: string | null;
  /** Présentiel : lieu copié à la réservation ; null en ligne. */
  location?: BookedLocation | null;
}

/**
 * Lieu tel qu'il était au moment de la réservation (présentiel).
 * Informations d'accès seulement une fois le rendez-vous accepté.
 */
export interface BookedLocation {
  label: string | null;
  address_line: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  maps_url: string;
  access_details: string | null;
}

/** Signalement d'absence, du point de vue de la partie qui consulte. */
export interface NoShowInfo {
  can_report: boolean;
  /** Demi-journées déjà commencées, seules déclarables. */
  reportable_block_ids: number[];
  report: { status: 'open' | 'resolved' | 'dismissed'; block_ids: number[]; note: string | null; created_at: string | null } | null;
  note_max: number;
}

export interface MyBooking {
  id: number;
  status: MyBookingStatus;
  offer_title: string;
  mode: BookingMode;
  blocks_count: number;
  expert: BookingExpertBase | null;
  blocks: MyBookingBlock[];
  amount_ttc: number;
  currency: string;
  payment_required: boolean;
  respond_by: string | null;
  requested_at: string | null;
  cancelled_at: string | null;
  cancelled_by: 'user' | 'expert' | 'system' | null;
  /** Vrai tant que l'expert n'a pas répondu : retrait gratuit. */
  can_cancel: boolean;
  /** Montant réellement débité (0 tant que l'expert n'a pas accepté). */
  charged_amount: number;
  /** Cumul déjà remboursé (annulation, absence…). */
  refunded_amount: number;
  refunded_at: string | null;
}

/** Fiche complète (GET /booking/requests/{id}). */
export interface MyBookingDetail extends MyBooking {
  amount_ht: number;
  tva_rate: number;
  tva_amount: number;
  message: string | null;
  client_address: string;
  /** Refus : motif choisi par l'expert et note éventuelle. */
  decline_reason: string | null;
  decline_note: string | null;
  noshow: NoShowInfo;
}

export interface MyBookings {
  pending: MyBooking[];
  upcoming: MyBooking[];
}

export interface MyBookingHistoryPage {
  bookings: MyBooking[];
  pagination: { page: number; per_page: number; total: number; has_more: boolean };
}

/**
 * En attente de réponse et à venir.
 * GET /booking/requests
 */
export const getMyBookings = async (): Promise<MyBookings | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/requests`)
    .then((response) => (response.data?.success == true ? response.data.data : null))
    .catch(() => null);
};

/**
 * Historique paginé, le plus récent d'abord.
 * GET /booking/requests/history?page=
 */
export const getMyBookingHistory = async (page = 1): Promise<MyBookingHistoryPage | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/requests/history`, { params: { page } })
    .then((response) => (response.data?.success == true ? response.data.data : null))
    .catch(() => null);
};

/**
 * GET /booking/requests/{bookingId}
 */
export const getMyBooking = async (bookingId: number): Promise<MyBookingDetail | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/requests/${bookingId}`)
    .then((response) => (response.data?.success == true ? response.data.data : null))
    .catch(() => null);
};

/**
 * Retrait d'une demande sans réponse.
 * POST /booking/requests/{bookingId}/cancel
 */
export const cancelMyBooking = async (bookingId: number): Promise<BookingResult<MyBookingDetail>> => {
  return axiosInstance
    .post(`${baseUrl}/booking/requests/${bookingId}/cancel`)
    .then((response) => toResult<MyBookingDetail>(response))
    .catch(toFailure);
};

/* ---- Expert : demandes reçues ---- */

export interface ExpertRequest {
  id: number;
  status: MyBookingStatus;
  offer_title: string;
  mode: BookingMode;
  blocks_count: number;
  requester: { name: string };
  blocks: MyBookingBlock[];
  respond_by: string | null;
  requested_at: string | null;
  responded_at: string | null;
  cancelled_by: 'user' | 'expert' | 'system' | null;
  /** Vrai tant que la demande attend la réponse de l'expert. */
  can_respond: boolean;
}

export interface ExpertRequestDetail extends ExpertRequest {
  message: string | null;
  payment_required: boolean;
  amount_ht: number;
  /** En pourcentage, copié à la création de la demande. */
  commission_rate: number;
  /** HT reversé à l'expert, commission déduite. */
  payout: number;
  currency: string;
  decline_reason: string | null;
  decline_note: string | null;
  noshow: NoShowInfo;
}

export interface ExpertRequestHistoryPage {
  requests: ExpertRequest[];
  pagination: { page: number; per_page: number; total: number; has_more: boolean };
}

export interface DeclineReasons {
  reasons: { id: number; label: string }[];
  note_max: number;
}

/**
 * Demandes sans réponse, la plus urgente d'abord.
 * GET /booking/me/requests
 */
export const getExpertRequests = async (): Promise<{ pending: ExpertRequest[] } | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/me/requests`)
    .then((response) => (response.data?.success == true ? response.data.data : null))
    .catch(() => null);
};

/**
 * GET /booking/me/requests/history?page=
 */
export const getExpertRequestHistory = async (page = 1): Promise<ExpertRequestHistoryPage | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/me/requests/history`, { params: { page } })
    .then((response) => (response.data?.success == true ? response.data.data : null))
    .catch(() => null);
};

/**
 * GET /booking/me/requests/{bookingId}
 */
export const getExpertRequest = async (bookingId: number): Promise<ExpertRequestDetail | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/me/requests/${bookingId}`)
    .then((response) => (response.data?.success == true ? response.data.data : null))
    .catch(() => null);
};

/**
 * GET /booking/me/decline-reasons
 */
export const getDeclineReasons = async (): Promise<DeclineReasons | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/me/decline-reasons`)
    .then((response) => (response.data?.success == true ? response.data.data : null))
    .catch(() => null);
};

/**
 * Accepte la demande : le montant réservé est débité.
 * POST /booking/me/requests/{bookingId}/accept
 */
export const acceptExpertRequest = async (bookingId: number): Promise<BookingResult<ExpertRequestDetail>> => {
  return axiosInstance
    .post(`${baseUrl}/booking/me/requests/${bookingId}/accept`)
    .then((response) => toResult<ExpertRequestDetail>(response))
    .catch(toFailure);
};

/**
 * Refuse la demande : l'empreinte est libérée.
 * POST /booking/me/requests/{bookingId}/decline
 */
export const declineExpertRequest = async (
  bookingId: number,
  input: { reason_id: number; note?: string | null }
): Promise<BookingResult<ExpertRequestDetail>> => {
  return axiosInstance
    .post(`${baseUrl}/booking/me/requests/${bookingId}/decline`, input)
    .then((response) => toResult<ExpertRequestDetail>(response))
    .catch(toFailure);
};

/* ---- Absences (no-show) ---- */

export interface NoShowInput {
  block_ids: number[];
  note?: string | null;
}

/**
 * Le demandeur signale l'absence de l'expert.
 * POST /booking/requests/{bookingId}/no-show
 */
export const reportMyNoShow = async (bookingId: number, input: NoShowInput): Promise<BookingResult<MyBookingDetail>> => {
  return axiosInstance
    .post(`${baseUrl}/booking/requests/${bookingId}/no-show`, input)
    .then((response) => toResult<MyBookingDetail>(response))
    .catch(toFailure);
};

/**
 * L'expert signale l'absence du confrère.
 * POST /booking/me/requests/{bookingId}/no-show
 */
export const reportExpertNoShow = async (
  bookingId: number,
  input: NoShowInput
): Promise<BookingResult<ExpertRequestDetail>> => {
  return axiosInstance
    .post(`${baseUrl}/booking/me/requests/${bookingId}/no-show`, input)
    .then((response) => toResult<ExpertRequestDetail>(response))
    .catch(toFailure);
};

/* ---- Expert : agenda ---- */

/**
 * Rôle de l'expert connecté dans un rendez-vous de son agenda :
 * host = un confrère a réservé auprès de lui ; guest = il a réservé auprès d'un confrère.
 */
export type AgendaRole = 'host' | 'guest';

export interface AgendaSession {
  role: AgendaRole;
  booking_id: number;
  block_id: number;
  date: string;
  period: BookingPeriod;
  start_local: string;
  end_local: string;
  start_at: string | null;
  end_at: string | null;
  /** Rang de la demi-journée dans le rendez-vous : séance index / total. */
  index: number;
  total: number;
  offer_title: string;
  mode: BookingMode;
  /** Hôte : le confrère qui a réservé. Invité : name = null (c'est l'expert connecté). */
  requester: { name: string | null };
  /** Invité : l'expert rencontré. Hôte : null (c'est l'expert connecté). */
  expert: BookingExpertBase | null;
  meet_url: string | null;
  /** Présentiel : lieu copié à la réservation ; null en ligne. */
  location: BookedLocation | null;
}

/** Demande envoyée par l'expert à un confrère, sans réponse. */
export type AgendaPendingRequest = MyBooking & { role: 'guest' };

export interface ExpertAgenda {
  sessions: AgendaSession[];
  pending: AgendaPendingRequest[];
}

export type AgendaHistoryItem =
  | { role: 'host'; booking: ExpertRequest }
  | { role: 'guest'; booking: MyBooking };

export interface ExpertAgendaHistoryPage {
  items: AgendaHistoryItem[];
  /** Ancienne forme : rendez-vous animés seulement. */
  requests: ExpertRequest[];
  pagination: { page: number; per_page: number; total: number; has_more: boolean };
}

/**
 * Demi-journées à venir des rendez-vous acceptés, des deux côtés, dans l'ordre ;
 * plus les demandes envoyées en attente de réponse.
 * GET /booking/me/agenda
 */
export const getExpertAgenda = async (): Promise<ExpertAgenda | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/me/agenda`)
    .then((response) => (response.data?.success == true ? response.data.data : null))
    .catch(() => null);
};

/**
 * Rendez-vous passés ou clos, des deux côtés, le plus récent d'abord.
 * GET /booking/me/agenda/history?page=
 */
export const getExpertAgendaHistory = async (page = 1): Promise<ExpertAgendaHistoryPage | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/me/agenda/history`, { params: { page } })
    .then((response) => (response.data?.success == true ? response.data.data : null))
    .catch(() => null);
};

/* ---- Expert : profil public ---- */

export interface ExpertProfileInput {
  honorific: string | null;
  name: string;
  credentials: string | null;
  lede: string | null;
  /** null = couleur par défaut de l'application. */
  palette: string | null;
  /** Dans l'ordre d'affichage. */
  domain_ids: number[];
}

/**
 * PUT /booking/me/profile
 */
export const updateMyProfile = async (input: ExpertProfileInput): Promise<BookingResult<ExpertBookingSetup>> => {
  return axiosInstance
    .put(`${baseUrl}/booking/me/profile`, input)
    .then((response) => toResult<ExpertBookingSetup>(response))
    .catch(toFailure);
};

/**
 * Liste commune des domaines.
 * GET /booking/domains
 */
export const getDomains = async (): Promise<BookingDomain[] | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/domains`)
    .then((response) => (response.data?.success == true ? response.data.data.domains : null))
    .catch(() => null);
};

/**
 * Ajoute un domaine à la liste commune (ou renvoie l'existant de même libellé).
 * POST /booking/me/domains
 */
export const createDomain = async (label: string): Promise<BookingResult<{ domain: BookingDomain }>> => {
  return axiosInstance
    .post(`${baseUrl}/booking/me/domains`, { label })
    .then((response) => toResult<{ domain: BookingDomain }>(response))
    .catch(toFailure);
};
/* ---- Messagerie expert ↔ demandeur ---- */

/** host = je suis l'expert de ce fil ; guest = je suis le demandeur. */
export type ChatRole = 'host' | 'guest';

export interface ChatPreview {
  kind: 'text' | 'event';
  mine: boolean;
  body: string;
  created_at: string | null;
}

export interface ChatConversation {
  id: number;
  role: ChatRole;
  /** guest : l'expert (fiche publique). host : null. */
  expert: BookingExpertBase | null;
  /** host : le demandeur (nom seulement). guest : null. */
  requester: { name: string } | null;
  /** Faux tant que le fil n'est pas ouvert (ni contact depuis un thème, ni rendez-vous accepté). */
  can_write: boolean;
  last_message: ChatPreview | null;
  unread: number;
}

export interface ChatConversationDetail extends ChatConversation {
  bookings: {
    id: number;
    offer_title: string;
    mode: BookingMode;
    status: MyBookingStatus;
    first_start: string | null;
    last_end: string | null;
  }[];
}

export interface ChatMessage {
  id: number;
  kind: 'text' | 'event';
  sender: 'user' | 'expert' | 'admin' | 'system';
  /** Toujours faux pour un événement (jamais une bulle). */
  mine: boolean;
  /** Texte du message, ou phrase de l'événement déjà rédigée pour le lecteur. */
  body: string;
  event: {
    /** inquiry = contact depuis un thème ; sinon événement d'un rendez-vous. */
    type: 'inquiry' | 'submitted' | 'accepted' | 'declined' | 'expired' | 'cancelled' | string;
    booking_id: number | null;
    offer: { id: number | null; title: string | null; duration_label: string | null; mode: BookingMode | null } | null;
  } | null;
  client_id: string | null;
  created_at: string | null;
}

export interface ChatMessagesPage {
  messages: ChatMessage[];
  has_more: boolean;
  can_write: boolean;
  /** Dernier message lu par l'autre partie : « Vu » sous mes messages jusqu'à cet id. */
  other_last_read_id: number;
}

/** Code renvoyé (422) quand le message contient des coordonnées (téléphone, e-mail, lien). */
export const CONTACT_BLOCKED = 'contact_blocked';

/**
 * Fils de l'utilisateur, des deux côtés, le plus récent d'abord.
 * GET /booking/conversations?page=
 */
export const getConversations = async (
  page = 1
): Promise<{ items: ChatConversation[]; current_page: number; last_page: number } | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/conversations`, { params: { page } })
    .then((response) => (response.data?.success == true ? response.data.data : null))
    .catch(() => null);
};

/**
 * Badge : total des non-lus.
 * GET /booking/conversations/unread
 */
export const getChatUnread = async (): Promise<{ total: number; conversations: number } | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/conversations/unread`)
    .then((response) => (response.data?.success == true ? response.data.data : null))
    .catch(() => null);
};

/**
 * GET /booking/conversations/{id}
 */
export const getConversation = async (conversationId: number): Promise<ChatConversationDetail | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/conversations/${conversationId}`)
    .then((response) => (response.data?.success == true ? response.data.data : null))
    .catch(() => null);
};

/**
 * « Échanger avec l'expert » depuis un thème : ouvre le fil (et l'encadré du thème).
 * POST /booking/conversations/start
 */
export const startConversation = async (
  offerId: number,
  mode?: BookingMode | null
): Promise<BookingResult<ChatConversationDetail>> => {
  return axiosInstance
    .post(`${baseUrl}/booking/conversations/start`, { offer_id: offerId, mode: mode ?? null })
    .then((response) => toResult<ChatConversationDetail>(response))
    .catch(toFailure);
};

/**
 * Messages : les derniers, la suite (after_id, relève) ou plus anciens (before_id).
 * GET /booking/conversations/{id}/messages
 */
export const getChatMessages = async (
  conversationId: number,
  params?: { after_id?: number; before_id?: number }
): Promise<ChatMessagesPage | null> => {
  return axiosInstance
    .get(`${baseUrl}/booking/conversations/${conversationId}/messages`, { params })
    .then((response) => (response.data?.success == true ? response.data.data : null))
    .catch(() => null);
};

/**
 * POST /booking/conversations/{id}/messages  { body, client_id }
 * Échec avec code « contact_blocked » : coordonnées refusées.
 */
export const sendChatMessage = async (
  conversationId: number,
  body: string,
  clientId: string
): Promise<BookingResult<ChatMessage> & { code?: string }> => {
  return axiosInstance
    .post(`${baseUrl}/booking/conversations/${conversationId}/messages`, { body, client_id: clientId })
    .then((response) => toResult<ChatMessage>(response))
    .catch((e: AxiosError<any>) => ({
      ...toFailure(e),
      ...(e.response?.data?.code ? { code: e.response.data.code } : {}),
    }));
};
