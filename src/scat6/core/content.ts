import type { Diagnosis, ExamKind, ListId, Neuro, Scat6Step, SportId } from './types';

/**
 * Contenu SCAT6 en français (repris de scat-app : SCAT6 FR, AQMSE juin 2023 ; licence BMJ / CISG considérée acquise).
 *
 * Même contenu que le serveur (app/Support/Scat6/Scat6Content.php) : un libellé ou un code modifié ici
 * doit l'être aussi là-bas, sinon le rapport PDF ne correspond plus à l'écran.
 */
export const CONTENT_VERSION = 'scat6-fr-om-2026.11';

export type Item = { code: string; label: string };

export const SPORTS: { id: SportId; label: string }[] = [
  { id: 'football', label: 'Football' },
  { id: 'judo', label: 'Judo' },
  { id: 'hockey_glace', label: 'Hockey sur glace' },
  { id: 'general', label: 'Général (autre sport)' },
];
export const sportLabel = (id: string | null | undefined) => SPORTS.find((s) => s.id === id)?.label ?? 'Sport inconnu';

export const EXAM_KINDS: { id: ExamKind; label: string; hint: string }[] = [
  { id: 'post_choc', label: 'Après un choc', hint: 'Examen au calme, dans les 72 h idéalement, jusqu’à 7 jours.' },
  { id: 'retest', label: 'Re-test', hint: 'Le lendemain ou avant 72 h, en cas de doute.' },
  { id: 'baseline', label: 'Baseline', hint: 'Référence en début de saison, sans choc récent.' },
];
export const examLabel = (id: string | null | undefined) => EXAM_KINDS.find((k) => k.id === id)?.label ?? '—';

export const NEURO_LABEL: Record<Neuro, string> = { normal: 'Normal', anormal: 'Anormal', non_realise: 'Non réalisé' };
export const DIAGNOSIS_LABEL: Record<Diagnosis, string> = { oui: 'Oui', non: 'Non', differe: 'Différé' };

/** Titre et numéro officiel (le SCAT6 regroupe orientation, mémoire et concentration à l'étape 3). */
export const STEP_INFO: Record<Scat6Step, { number: number; title: string; short: string }> = {
  renseignements: { number: 1, title: 'Renseignements', short: 'Renseignements' },
  symptomes: { number: 2, title: 'Symptômes', short: 'Symptômes' },
  orientation: { number: 3, title: 'Orientation', short: 'Orientation' },
  memoire: { number: 3, title: 'Mémoire immédiate', short: 'Mémoire' },
  concentration: { number: 3, title: 'Concentration', short: 'Concentration' },
  equilibre: { number: 4, title: 'Équilibre (mBESS)', short: 'Équilibre' },
  tandem: { number: 4, title: 'Marche en tandem', short: 'Tandem' },
  'memoire-differee': { number: 5, title: 'Mémoire différée', short: 'Mémoire différée' },
  decision: { number: 6, title: 'Décision', short: 'Décision' },
};

/** Raisons proposées quand une partie n'est pas réalisée. */
export const SKIP_REASONS = ['Le patient ne peut pas ou refuse', 'Conditions non réunies'] as const;

/* ---- Étape 1 ---- */

export const BACKGROUND: Item[] = [
  { code: 'H.1', label: 'Hospitalisation en raison d’une blessure à la tête ?' },
  { code: 'H.2', label: 'Maux de tête ou migraines diagnostiqués ou traités ?' },
  { code: 'H.3', label: 'Trouble d’apprentissage ou dyslexie ?' },
  { code: 'H.4', label: 'Trouble du déficit de l’attention / hyperactivité (TDA/H) ?' },
  { code: 'H.5', label: 'Dépression, anxiété ou autre trouble psychologique ?' },
  { code: 'H.6', label: 'Antécédents neurologiques ?' },
];

/* ---- Étape 2 ---- */

export const SYMPTOMS: Item[] = [
  ['S.1', 'Maux de tête'],
  ['S.2', 'Impression de « pression dans la tête »'],
  ['S.3', 'Douleur au cou'],
  ['S.4', 'Nausée ou vomissements'],
  ['S.5', 'Étourdissements'],
  ['S.6', 'Vision trouble'],
  ['S.7', 'Problèmes d’équilibre'],
  ['S.8', 'Sensibilité à la lumière'],
  ['S.9', 'Sensibilité au bruit'],
  ['S.10', 'Sensation d’être au ralenti'],
  ['S.11', 'Sensation d’être « dans un brouillard »'],
  ['S.12', 'Sensation de « ne pas être dans son assiette »'],
  ['S.13', 'Problème de concentration'],
  ['S.14', 'Problème de mémoire'],
  ['S.15', 'Fatigue ou manque d’énergie'],
  ['S.16', 'Confusion'],
  ['S.17', 'Somnolence'],
  ['S.18', 'Émotivité accrue'],
  ['S.19', 'Irritabilité'],
  ['S.20', 'Tristesse'],
  ['S.21', 'Nervosité ou anxiété'],
  ['S.22', 'Difficulté à s’endormir (si applicable)'],
].map(([code, label]) => ({ code, label }));
export const SYMPTOM_MAX_SEVERITY = 6;
export const SEVERITY_WORDS = ['Aucun', 'Très léger', 'Léger', 'Modéré', 'Modéré +', 'Sévère', 'Très sévère'];

/* ---- Étape 3 ---- */

export const ORIENTATION: Item[] = [
  { code: 'O.1', label: 'Quel mois sommes-nous ?' },
  { code: 'O.2', label: 'Quelle est la date d’aujourd’hui ?' },
  { code: 'O.3', label: 'Quel jour de la semaine sommes-nous ?' },
  { code: 'O.4', label: 'En quelle année sommes-nous ?' },
  { code: 'O.5', label: 'Quelle heure est-il actuellement ? (à l’heure près)' },
];

export const LIST_IDS: ListId[] = ['A', 'B', 'C'];

/** Listes de mots françaises (jamais traduites mot à mot depuis l'anglais). */
export const WORD_LISTS: Record<ListId, string[]> = {
  A: ['Menton', 'Monnaie', 'Rideau', 'Lampe', 'Sucre', 'Feuille', 'Pêche', 'Oiseau', 'Viande', 'Bateau'],
  B: ['Bébé', 'Poisson', 'Parfum', 'Jambe', 'Tapis', 'Pomme', 'Fumée', 'Écran', 'Chaise', 'Balle'],
  C: ['Veste', 'Couteau', 'Chemin', 'Chapeau', 'Miroir', 'Beurre', 'Tissu', 'Film', 'Souris', 'Dessin'],
};

/** Chiffres à l'envers : pour chaque longueur 3 → 6, deux séries (essai 1, essai 2). */
export const DIGIT_LISTS: Record<ListId, [string, string][]> = {
  A: [
    ['4-9-3', '6-2-9'],
    ['3-8-1-4', '3-2-7-9'],
    ['6-2-9-7-1', '1-5-2-8-6'],
    ['7-1-8-4-6-2', '5-3-9-1-4-8'],
  ],
  B: [
    ['5-2-6', '4-1-5'],
    ['1-7-9-5', '4-9-6-8'],
    ['4-8-5-2-7', '6-1-8-4-3'],
    ['8-3-1-9-6-4', '7-2-4-8-5-6'],
  ],
  C: [
    ['1-4-2', '6-5-8'],
    ['6-8-3-1', '3-4-8-1'],
    ['4-9-1-5-3', '6-8-2-5-1'],
    ['3-7-6-5-1-9', '9-2-6-5-1-4'],
  ],
};

export const MONTHS_REVERSED = [
  'Décembre', 'Novembre', 'Octobre', 'Septembre', 'Août', 'Juillet',
  'Juin', 'Mai', 'Avril', 'Mars', 'Février', 'Janvier',
];

/* ---- Étape 4 ---- */

export const MBESS_STANCES = [
  { key: 'double', label: 'Deux pieds', hint: 'Pieds joints, talons et orteils se touchent.' },
  { key: 'tandem', label: 'Tandem', hint: 'Pied non dominant derrière, talon contre orteils.' },
  { key: 'single', label: 'Un pied', hint: 'Sur le pied non dominant.' },
] as const;

export const MBESS_ERRORS = [
  'Main(s) qui quitte(nt) la hanche',
  'Ouverture des yeux',
  'Pas, trébuchement ou chute',
  'Abduction de hanche > 30°',
  'Soulèvement de l’avant-pied ou du talon',
  'Hors position > 5 s',
];

/* ---- Consignes lues au patient ---- */

export const INSTRUCTIONS = {
  symptomsBaseline:
    'Évaluez vos symptômes ci-dessous selon comment vous vous sentez habituellement. « 1 » est un symptôme très léger et « 6 » est un symptôme sévère.',
  symptomsPost:
    'Évaluez vos symptômes ci-dessous selon comment vous vous sentez maintenant. « 1 » est un symptôme très léger et « 6 » est un symptôme sévère.',
  memoryTrial1:
    'Je vais tester votre mémoire. Je vais lire une liste de mots. Quand j’aurai fini, répétez tous les mots dont vous vous souvenez, dans n’importe quel ordre.',
  memoryTrial23:
    'Je vais vous répéter la même liste. Répétez ensuite tous les mots dont vous vous souvenez, dans n’importe quel ordre, y compris les mots que vous avez déjà répétés dans les autres essais.',
  digits:
    'Je vais lire une série de chiffres. Répétez-les dans l’ordre inverse. Par exemple, si je dis 7-1-9, vous diriez 9-1-7.',
  months:
    'À présent, nommez les mois de l’année à l’envers aussi VITE et précisément que possible. Commencez par le dernier mois et revenez en arrière. Vous direz donc « décembre, novembre… ». Allez-y.',
  delayed:
    'Vous souvenez-vous de la liste de mots que j’ai lue quelques fois plus tôt ? Répétez autant de mots que vous le pouvez, dans n’importe quel ordre.',
  tandem:
    'Aussi vite que possible, marchez jusqu’au bout de la ligne en posant le talon juste devant les orteils, puis revenez sans séparer vos pieds ou les poser sur le côté.',
  dualTask:
    'Maintenant marchez en plaçant un pied directement devant l’autre et comptez à rebours à voix haute en soustrayant 7. Commencez à 88. Allez-y.',
  attestation:
    'Je suis un professionnel de santé. J’ai personnellement effectué ou supervisé cette évaluation menée à l’aide du SCAT6.',
};

export const DISCLAIMER =
  'Le SCAT6 ne doit pas être utilisé seul pour poser ou exclure le diagnostic. Un athlète peut être commotionné même avec des scores normaux.';

/* ---- Après une commotion diagnostiquée ou différée ---- */

export const CONSIGNES = {
  surveillance: [
    'Ne restez pas seul·e, surtout pendant les 3 premières heures.',
    'Repos cérébral : limitez les écrans, la lecture et les efforts.',
    'Pas de retour au sport aujourd’hui. Seul un médecin peut autoriser la reprise.',
  ],
  interdits: [
    'Pas d’alcool ni de drogue.',
    'Aucun médicament sans avis médical — en particulier ni aspirine, ni anti-inflammatoires, ni sédatifs, ni opiacés.',
    'Ne conduisez pas tant qu’un professionnel de santé ne l’a pas autorisé.',
  ],
  appelerSi: [
    'Maux de tête qui s’aggravent',
    'Vomissements répétés',
    'Confusion, somnolence, comportement inhabituel',
    'Convulsions, faiblesse d’un membre, vision double',
  ],
};

const GRTP =
  'Reprise progressive en 6 étapes, au moins 24 h par étape sans symptôme ; retour à l’étape précédente si les symptômes réapparaissent.';

/**
 * Règles de reprise de la fédération. Le niveau (pro / amateur, haut niveau) n'est pas demandé au
 * patient : les deux cas sont listés. `age` null = inconnu → toutes les tranches d'âge.
 */
export function returnLines(sport: string, age: number | null): string[] {
  const adult = age === null || age >= 20;
  const young = age === null || age < 20;
  switch (sport) {
    case 'football':
      return [
        'Football professionnel : examen par un médecin expert reconnu par la FFF dans les 72 h.',
        'Football amateur : consulter un médecin généraliste ou un neurologue dans les 48 h.',
        GRTP,
        ...(adult ? ['Après une 1re commotion : pas de compétition avant 7 jours.'] : []),
        ...(young ? ['Moins de 20 ans : pas de reprise avant 3 semaines, avec l’accord d’un neurologue expert.'] : []),
        'Prudence renforcée avant 18 ans ou en cas de commotion dans les 12 derniers mois.',
        'Récidive : délai plus long et avis spécialisé recommandé.',
      ];
    case 'judo':
      return [
        '48 h de repos strict (physique et intellectuel), jamais seul.',
        'Examen médical à 48 h par un médecin référent FFJudo (SCAT6).',
        'Suspicion levée : reprise avec certificat (CACI) et déverrouillage par le médecin.',
        ...(young ? ['Moins de 20 ans : arrêt de 3 semaines, avec accord médical.'] : []),
        ...(adult
          ? [
              'Amateur : pas de reprise avant 10 jours d’arrêt.',
              'Haut niveau (SHN / PPF) : arrêt de 7 jours ; protocole de reprise PRJJ de J3 à J7 (5 jours) ; bilan de reprise à partir de J8.',
            ]
          : []),
        'Récidive dans l’année : 3 semaines d’arrêt ; 3e commotion : 6 semaines et avis spécialisé.',
      ];
    case 'hockey_glace':
      return [
        'Pas de retour au jeu avant 7 jours minimum, avec autorisation médicale.',
        GRTP,
        'Rapport de commotion à transmettre à la FFHG (par les arbitres).',
      ];
    default:
      return [
        'Pas de reprise le jour même ; au moins 24 h de repos relatif.',
        GRTP,
        'Autorisation médicale avant tout contact ou compétition.',
        'Vérifier si la fédération du sport impose un délai minimal.',
      ];
  }
}
