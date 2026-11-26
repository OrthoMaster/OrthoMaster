import { Ionicons } from '@expo/vector-icons';

import type { ExamKind, SportId } from '../../../../scat6/core/types';

type IconName = keyof typeof Ionicons.glyphMap;

export const SPORT_ICON: Record<SportId, IconName> = {
  football: 'football-outline',
  judo: 'body-outline',
  hockey_glace: 'snow-outline',
  general: 'fitness-outline',
};

export const EXAM_ICON: Record<ExamKind, IconName> = {
  post_choc: 'flash-outline',
  retest: 'repeat-outline',
  baseline: 'flag-outline',
};
