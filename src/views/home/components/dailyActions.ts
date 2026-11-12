import AsyncStorage from '@react-native-async-storage/async-storage';

/* ---- Types ---- */

export type DailyActionType = 'quiz' | 'podcast' | 'infographic';

export interface DailyActionItem {
  type: DailyActionType;
  id: string;
  title: string;
  meta: string[];
  publishedAt: number;
  /** Quiz : pas encore répondu. Podcast / infographie : jamais ouvert sur cet appareil. */
  isNew: boolean;
  /** Quiz uniquement. */
  isDone: boolean;
  raw: any;
}

export interface DailyActionGroup {
  type: DailyActionType;
  items: DailyActionItem[];
  hasNew: boolean;
  /** Tous les quiz sont répondus : la coche verte remplace la pastille. */
  allDone: boolean;
}

/* ---- Thèmes ---- */

const S3_HOME = 'https://content-orthomaster-prod.s3.eu-west-1.amazonaws.com/application-data/settings/home';

export const ACTION_THEMES: Record<DailyActionType, {
  label: string;
  sheetTitle: string;
  background: string;
  edge: string;
  tile: string;
  ink: string;
  image: string;
}> = {
  quiz: {
    label: 'Quiz',
    sheetTitle: 'Quiz du jour',
    background: '#EEF4FC',
    edge: '#DCE7F6',
    tile: '#F0F5FF',
    ink: '#3B6DB0',
    image: `${S3_HOME}/quiz.png`,
  },
  podcast: {
    label: 'Podcast',
    sheetTitle: 'Podcasts du jour',
    background: '#F4F0F8',
    edge: '#E7E0F0',
    tile: '#F4F0F8',
    ink: '#6F528F',
    image: `${S3_HOME}/podcast.png`,
  },
  infographic: {
    label: 'Infographie',
    sheetTitle: 'Infographies du jour',
    background: '#FFF3E0',
    edge: '#FBE7C9',
    tile: '#FFF3E0',
    ink: '#A85A00',
    image: `${S3_HOME}/infographic.png`,
  },
};

// Ordre par défaut quand aucun groupe n'a de nouveauté : la carte principale reste stable.
const TYPE_ORDER: DailyActionType[] = ['quiz', 'podcast', 'infographic'];

/* ---- Contenus vus (podcast / infographie) ---- */

// L'API ne dit pas si un podcast ou une infographie a déjà été ouvert : on le retient sur l'appareil.
const SEEN_KEY = '@daily-action-seen';
const SEEN_LIMIT = 300;

export const seenKey = (type: DailyActionType, id: string) => `${type}:${id}`;

export const loadSeen = async (): Promise<string[]> => {
  try {
    const value = await AsyncStorage.getItem(SEEN_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveSeen = async (keys: string[]) => {
  try {
    await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(keys.slice(-SEEN_LIMIT)));
  } catch {
    // Pas bloquant : au pire la pastille réapparaît.
  }
};

/* ---- Construction des groupes ---- */

const toTime = (value?: string | null) => {
  const time = value ? new Date(value.replace(' ', 'T')).getTime() : NaN;
  return isNaN(time) ? 0 : time;
};

const compact = (values: (string | null | undefined)[]) => values.filter((v): v is string => !!v);

// L'API ne trie pas toujours par date (quiz, infographies) : la plus récente doit venir en tête.
const byNewest = (a: DailyActionItem, b: DailyActionItem) => b.publishedAt - a.publishedAt;

export const buildDailyGroups = (data: any, seen: string[]): DailyActionGroup[] => {
  const seenSet = new Set(seen);

  const quiz: DailyActionItem[] = (data?.questions ?? []).map((entry: any) => ({
    type: 'quiz',
    id: String(entry.question?.id),
    title: entry.question?.title ?? '',
    meta: compact([entry.question?.topic?.label]),
    publishedAt: toTime(entry.question?.published_at),
    isNew: !entry.has_answered,
    isDone: !!entry.has_answered,
    raw: entry,
  }));

  const podcast: DailyActionItem[] = (data?.podcasts ?? []).map((entry: any) => {
    const id = String(entry.podcast?.id);
    return {
      type: 'podcast',
      id,
      title: entry.podcast?.title ?? '',
      meta: compact([entry.podcast?.duration, entry.podcast?.topic?.label]),
      publishedAt: toTime(entry.podcast?.published_at),
      isNew: !seenSet.has(seenKey('podcast', id)),
      isDone: false,
      raw: entry,
    };
  });

  const infographic: DailyActionItem[] = (data?.infographics ?? []).map((entry: any) => {
    const id = String(entry.infographic?.id);
    return {
      type: 'infographic',
      id,
      title: entry.infographic?.title ?? '',
      meta: compact([entry.infographic?.topic?.label]),
      publishedAt: toTime(entry.infographic?.published_at),
      isNew: !seenSet.has(seenKey('infographic', id)),
      isDone: false,
      raw: entry,
    };
  });

  const groups = ([['quiz', quiz], ['podcast', podcast], ['infographic', infographic]] as const)
    .filter(([, items]) => items.length > 0)
    .map(([type, items]) => {
      const sorted = [...items].sort(byNewest);
      return {
        type,
        items: sorted,
        hasNew: sorted.some((item) => item.isNew),
        allDone: type === 'quiz' && sorted.every((item) => item.isDone),
      };
    });

  // Le groupe qui a des nouveautés prend la grande carte ; sinon l'ordre reste fixe.
  return groups.sort((a, b) => {
    if (a.hasNew !== b.hasNew) return a.hasNew ? -1 : 1;
    return TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type);
  });
};

/* ---- Libellés ---- */

export const groupSummary = (group: DailyActionGroup) => {
  const total = group.items.length;
  const fresh = group.items.filter((item) => item.isNew).length;

  if (group.type === 'quiz') {
    const label = `${total} question${total > 1 ? 's' : ''}`;
    return fresh > 0 ? `${label} · ${fresh} à faire` : `${label} · toutes répondues`;
  }
  if (group.type === 'podcast') {
    const label = `${total} épisode${total > 1 ? 's' : ''}`;
    return fresh > 0 ? `${label} · ${fresh} nouveau${fresh > 1 ? 'x' : ''}` : label;
  }
  const label = `${total} infographie${total > 1 ? 's' : ''}`;
  return fresh > 0 ? `${label} · ${fresh} nouvelle${fresh > 1 ? 's' : ''}` : label;
};

export const itemStatusLabel = (item: DailyActionItem) => {
  if (item.type === 'quiz') return item.isDone ? 'Répondu' : 'À faire';
  return item.isNew ? 'Nouveau' : null;
};
