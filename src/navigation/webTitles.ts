/**
 * Version WEB : titre de l'onglet du navigateur.
 *
 * Par défaut, react-navigation affiche `options.title` ou, à défaut, le nom technique
 * de l'écran (« experts-list », « expertise-profile »…). Les écrans de l'espace
 * rendez-vous n'ont pas de `title` : on leur donne ici un titre lisible.
 */
const ROUTE_TITLES: Record<string, string> = {
  // Espace rendez-vous
  'rendez-vous': 'Rendez-vous',
  booking: 'Rendez-vous',
  'booking-experts': 'Experts',
  'experts-list': 'Experts',
  'expert-profile': 'Profil de l’expert',
  'expert-offer': 'Détail de l’offre',
  'expert-checkout': 'Récapitulatif',
  'booking-messages': 'Messages',
  'messages-home': 'Messages',
  conversation: 'Messages',
  'booking-requests': 'Demandes',
  'requests-home': 'Demandes',
  'requests-history': 'Historique des demandes',
  'request-detail': 'Détail de la demande',
  'booking-agenda': 'Agenda',
  'agenda-home': 'Agenda',
  'agenda-history': 'Historique',
  'booking-appointments': 'Mes rendez-vous',
  'appointments-home': 'Mes rendez-vous',
  'appointments-history': 'Historique des rendez-vous',
  'appointment-detail': 'Détail du rendez-vous',
  'booking-expertise': 'Mon expertise',
  'expertise-home': 'Mon expertise',
  'expertise-profile': 'Modifier le profil',
  'expertise-offers': 'Mes offres',
  'expertise-offer-form': 'Offre',
  'expertise-availability': 'Disponibilités',
};

const APP_NAME = 'OrthoMaster';

/** Un nom technique (« profile-info ») n'est jamais montré tel quel. */
const looksTechnical = (text: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(text);

export const webDocumentTitle = (options: { title?: string } | undefined, route: { name: string } | undefined) => {
  const name = route?.name ?? '';
  const title = ROUTE_TITLES[name] ?? options?.title ?? name;

  if (!title || looksTechnical(title) || title === APP_NAME) return APP_NAME;
  return `${title} · ${APP_NAME}`;
};
