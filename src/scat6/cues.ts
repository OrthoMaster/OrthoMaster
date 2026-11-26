import { Audio } from 'expo-av';

/**
 * Repères sonores des tests chronométrés : le médecin regarde le patient, pas l'écran.
 *  - tick  : décompte 3-2-1, lecture guidée des mots (1 par seconde)
 *  - start : début de la partie chronométrée
 *  - end   : fin (20 s du mBESS, délai de 5 minutes de la mémoire différée)
 * Ne lève jamais d'erreur : un son qui ne joue pas (navigateur sans interaction préalable…)
 * ne doit pas bloquer l'examen.
 */
export type Cue = 'tick' | 'start' | 'end';

const SOURCES: Record<Cue, number> = {
  tick: require('../../assets/scat6/sounds/tick.wav'),
  start: require('../../assets/scat6/sounds/start.wav'),
  end: require('../../assets/scat6/sounds/end.wav'),
};

const sounds: Partial<Record<Cue, Promise<Audio.Sound | null>>> = {};

const load = (kind: Cue) => {
  sounds[kind] ??= Audio.Sound.createAsync(SOURCES[kind])
    .then(({ sound }) => sound)
    .catch(() => null);
  return sounds[kind]!;
};

export const cue = (kind: Cue) => {
  load(kind)
    .then((sound) => sound?.replayAsync())
    .catch(() => undefined);
};

/** Précharge les sons (à l'ouverture d'un examen) : le premier bip part sans délai. */
export const preloadCues = () => {
  (['tick', 'start', 'end'] as Cue[]).forEach(load);
};
