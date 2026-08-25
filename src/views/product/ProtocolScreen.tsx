import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Selections } from './lib/Logic';
import { palette } from './lib/Theme';
import {
  getGroupCounts,
  getProtocols,
  Protocol,
  ProtocolGroup,
  ProtocolPhase,
} from '../../services/v2/ProductService';
import { GuidePatientModal } from './components/GuidePatientModal';

// Placeholders for the Guide Patient modal. TODO: move these onto the
// Protocol type as optional `guideImage` / `guideUrl` fields so each
// protocol carries its own guide asset. Until then, every protocol
// shows the same fake QR and URL.
const GUIDE_PATIENT_QR_URL = 'https://placehold.co/300x300/000000/FFFFFF/png?text=QR+GUIDE';
const GUIDE_PATIENT_LINK   = 'https://app.orthomaster.fr/guides/patient';

// ============================================================
// Grid sizing — fixed per screen width. Computed once at module load
// rather than via onLayout so circles snap into place on first render.
// Mobile is portrait-only here; a future tablet/landscape layout would
// recompute on dimension change.
// ============================================================
const SCREEN_WIDTH = Dimensions.get('window').width;
const OUTER_PADDING = 16;     // ProtocolScreen body horizontal padding
const CARD_PADDING  = 14;     // Phase card inner padding
const COLUMNS       = 4;
const GAP           = 8;
const PHASE_INNER_WIDTH = SCREEN_WIDTH - 2 * OUTER_PADDING - 2 * CARD_PADDING;
const ITEM_WIDTH    = Math.floor((PHASE_INNER_WIDTH - (COLUMNS - 1) * GAP) / COLUMNS);
const CIRCLE_SIZE   = ITEM_WIDTH; // circle fills the column width

// ============================================================
// Phase colors — cycled in order so each phase in a protocol gets a
// distinct "key color" for its title banner. If a protocol has more
// phases than colors, we wrap around (modulo). Colors picked for
// reasonable contrast against white text and visual separation.
// ============================================================
const PHASE_COLORS = [
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EC4899', // pink
  '#06B6D4', // cyan
];

function colorForPhase(index: number): string {
  return PHASE_COLORS[index % PHASE_COLORS.length];
}

type RouteParams = {
  protocolId: string;
  selections: Selections;
};

export const ProtocolScreen = ({ navigation, route }) => {
  const { protocolId, selections } = (route?.params ?? {}) as Partial<RouteParams>;
  const [infoGroup, setInfoGroup] = useState<ProtocolGroup | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  // Fetch the full protocol list once (React Query caches). Pick the
  // one matching the route's protocolId. If absent we show an error
  // state — the navigator should never reach this screen without a
  // protocolId, but be defensive.
  const { data: protocols = [], isLoading } = useQuery({
    queryKey: ['product-protocols'],
    queryFn: () => getProtocols(),
    retry: 1,
    retryDelay: 1000,
  });

  const protocol = useMemo<Protocol | null>(() => {
    if (!protocolId) return null;
    return protocols.find(p => p.id === protocolId) ?? null;
  }, [protocols, protocolId]);

  // Flat list of every filter-type group id in this protocol. Used to
  // batch-fetch counts in one round trip — far cheaper than calling
  // /count once per group.
  const filterGroupIds = useMemo<string[]>(() => {
    if (!protocol) return [];
    return protocol.phases.flatMap(ph =>
      ph.groups.filter(g => g.type === 'filter').map(g => g.id)
    );
  }, [protocol]);

  // Flatten the user's pathology selection to a flat id list for the
  // counts request. Same shape the backend's parseFilterParam expects.
  const filterIds = useMemo<string[]>(
    () => Object.values(selections ?? {}).flat() as string[],
    [selections],
  );

  // Counts per group. Cached by (filters, groupIds) — if user navigates
  // back to filters, changes selection, and re-enters this screen with
  // the same protocol but different selections, the cache key changes
  // and we refetch. Disabled while protocol is still loading.
  const { data: groupCounts = {} } = useQuery({
    queryKey: ['group-counts', filterIds.join(','), filterGroupIds.join(',')],
    queryFn: () => getGroupCounts(filterIds, filterGroupIds),
    enabled: !!protocol && filterGroupIds.length > 0,
    retry: 1,
  });

  const handleBack = () => navigation.goBack();

  // Tap on a group circle (or its "Voir produits" button).
  //   - filter group: drill into the products list with both the user's
  //                   pathology filters AND the group id applied
  //   - info group:   pop the markdown modal in place; nav stays here
  const handleTapGroup = useCallback((group: ProtocolGroup) => {
    if (group.type === 'filter') {
      navigation.navigate('products-view', {
        selections: selections ?? {},
        groupId: group.id,
        groupLabel: group.label,
      });
    } else {
      setInfoGroup(group);
    }
  }, [navigation, selections]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.bg} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={10} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={palette.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Protocole</Text>
            <Text style={styles.title} numberOfLines={1}>
              {protocol?.title ?? '—'}
            </Text>
          </View>

          {/* Vertical divider + right-side action button. Mirrors the
              stacked-icon pattern from SolarFilterScreen's header. */}
          <View style={styles.topVerticalDivider} />
          <HeaderIconButton
            label="Guide Patient"
            icon={<MaterialCommunityIcons name="qrcode-scan" size={20} color={palette.textPrimary} />}
            onPress={() => setGuideOpen(true)}
            disabled={!protocol}
          />
        </View>

        {/* Body — owns the palette.bg backdrop. Root stays white so
            the SafeAreaView top/bottom insets fall through cleanly. */}
        <View style={styles.bodyContainer}>
          {isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={palette.fabBg} />
            </View>
          ) : !protocol ? (
            <View style={styles.centered}>
              <Ionicons name="warning-outline" size={36} color={palette.textMuted} />
              <Text style={styles.emptyTitle}>Protocole introuvable</Text>
              <Text style={styles.emptySub}>
                Le protocole demandé n'existe pas ou n'est plus disponible.
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={handleBack} activeOpacity={0.85}>
                <Text style={styles.emptyBtnText}>Retour aux filtres</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {protocol.phases.map((phase, idx) => (
                <PhaseCard
                  key={phase.id}
                  phase={phase}
                  keyColor={colorForPhase(idx)}
                  groupCounts={groupCounts}
                  onTap={handleTapGroup}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>

      {/* Info modal — bottom sheet style. Markdown rendered as plain
          Text for now; will swap to react-native-markdown-display once
          the lib is installed (note in shared TODO). */}
      <Modal
        visible={!!infoGroup}
        animationType="slide"
        transparent
        onRequestClose={() => setInfoGroup(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setInfoGroup(null)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {infoGroup?.label ?? ''}
              </Text>
              <TouchableOpacity onPress={() => setInfoGroup(null)} hitSlop={10} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={palette.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 32 }}>
              <Text style={styles.modalText}>
                {infoGroup?.type === 'info' ? (infoGroup.content ?? '') : ''}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Guide Patient modal — pre-rendered QR + shareable link. Opened
          from the header button on the right. Only meaningful when we
          have a protocol; the header button is disabled otherwise. */}
      <GuidePatientModal
        visible={guideOpen}
        onClose={() => setGuideOpen(false)}
        protocolTitle={protocol?.title ?? null}
        qrImageUri={GUIDE_PATIENT_QR_URL}
        guideUrl={GUIDE_PATIENT_LINK}
      />
    </View>
  );
};

// ============================================================
// Phase card — colored banner header (key color) + 4-col grid of
// group circles inside a white body. `overflow: hidden` on the card
// ensures the banner's color fills cleanly into the top rounded
// corners of the card.
// ============================================================
function PhaseCard({ phase, keyColor, groupCounts, onTap }: {
  phase: ProtocolPhase;
  keyColor: string;
  groupCounts: Record<string, number>;
  onTap: (group: ProtocolGroup) => void;
}) {
  return (
    <View style={styles.phaseCard}>
      <View style={[styles.phaseHeader, { backgroundColor: keyColor }]}>
        <View style={styles.phaseHeaderAccent} />
        <Text style={styles.phaseHeaderText} numberOfLines={2}>
          {phase.title}
        </Text>
      </View>
      <View style={styles.phaseBody}>
        <View style={styles.groupsGrid}>
          {phase.groups.map(g => {
            // Filter groups with 0 matching products are disabled —
            // tapping them would land on an empty product list. Info
            // groups are always enabled (they show text, not products).
            const isEmpty = g.type === 'filter' && groupCounts[g.id] === 0;
            return (
              <GroupCircle
                key={g.id}
                group={g}
                isEmpty={isEmpty}
                onPress={() => onTap(g)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ============================================================
// Group circle — image center, title below, "Choisir" button for
// filter type, ℹ badge top-right for info type. Tap on the circle
// triggers the same onPress as the button below it.
//
// `isEmpty` (filter groups only): no products match this group given
// the user's current pathology filters. We grey out the visuals and
// disable taps so the doctor doesn't bounce into a dead-end screen.
// ============================================================
function GroupCircle({ group, isEmpty, onPress }: {
  group: ProtocolGroup;
  isEmpty?: boolean;
  onPress: () => void;
}) {
  const isFilter      = group.type === 'filter';
  const isDisabled    = !!isEmpty;

  // Color tokens — desaturated slate palette when disabled.
  const circleBg = isDisabled ? '#F1F5F9'
    : isFilter  ? '#EFF6FF'
                : '#FEF3C7';
  const circleBorder = isDisabled ? '#E2E8F0'
    : isFilter  ? '#DBEAFE'
                : '#FDE68A';
  const placeholderTint = isDisabled ? '#94A3B8'
    : isFilter  ? '#3B82F6'
                : '#92400E';

  return (
    <View style={styles.groupItem}>
      {/* Circle (tappable) */}
      <TouchableOpacity
        style={[styles.groupCircleWrap, { width: CIRCLE_SIZE, height: CIRCLE_SIZE }]}
        onPress={onPress}
        activeOpacity={0.85}
        disabled={isDisabled}
      >
        <View style={[
          styles.groupCircle,
          { backgroundColor: circleBg, borderColor: circleBorder },
        ]}>
          {group.image ? (
            <Image
              source={{ uri: group.image }}
              style={[styles.groupImage, isDisabled && { opacity: 0.45 }]}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.groupImagePlaceholder}>
              <Ionicons
                name={isFilter ? 'cube-outline' : 'document-text-outline'}
                size={Math.floor(CIRCLE_SIZE * 0.4)}
                color={placeholderTint}
              />
            </View>
          )}
        </View>

        {/* Info badge — top-right corner. Filter circles get no badge. */}
        {!isFilter && (
          <View style={styles.infoBadge}>
            <Ionicons name="information" size={12} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      {/* Title under circle. minHeight reserves two lines so every
          column lines up vertically regardless of label length. */}
      <Text
        style={[
          styles.groupLabel,
          isDisabled && { color: palette.textMuted },
        ]}
        numberOfLines={2}
      >
        {group.label}
      </Text>

      {/* "Choisir" pill — filter type only. Disabled when no matching
          products; says "Aucun" instead so the doctor sees why. */}
      {isFilter && (
        <TouchableOpacity
          style={[
            styles.viewProductsBtn,
            isDisabled && styles.viewProductsBtnDisabled,
          ]}
          onPress={onPress}
          activeOpacity={0.8}
          disabled={isDisabled}
        >
          <Text
            style={[
              styles.viewProductsBtnText,
              isDisabled && styles.viewProductsBtnTextDisabled,
            ]}
          >
            {isDisabled ? 'Aucun' : 'Choisir'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ============================================================
// Header icon button — stacked icon + label, no border. Mirrors the
// same pattern used in SolarFilterScreen's right-side action group.
// ============================================================
function HeaderIconButton({
  label, icon, onPress, disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.headerBtn, disabled && styles.headerBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      hitSlop={4}
    >
      {icon}
      <Text style={[styles.headerBtnLabel, disabled && styles.headerBtnLabelDisabled]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ============================================================
// Styles
// ============================================================
const styles = StyleSheet.create({
  // White outer container — SafeAreaView top/bottom insets fall through
  // to this color, matching ProductsScreen's pattern.
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  // Body wrapper — palette.bg backdrop for the scroll content.
  bodyContainer: { flex: 1, backgroundColor: palette.bg },

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.cardBg,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },

  // Thin vertical line between the title block and the right-side
  // action group. Stretches to topBar height via alignSelf:stretch.
  topVerticalDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: palette.border,
    marginHorizontal: 10,
  },

  // Right-side stacked icon+label button — same layout as the
  // Scanner/Keywords/Clear buttons on SolarFilterScreen. Two lines
  // of text is fine; we don't cap the width.
  headerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 56,
    maxWidth: 72,
  },
  headerBtnDisabled: {
    opacity: 0.45,
  },
  headerBtnLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: palette.textPrimary,
    marginTop: 3,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  headerBtnLabelDisabled: {
    color: palette.textMuted,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    color: palette.textMuted,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginTop: 1,
    letterSpacing: -0.2,
  },

  scrollContent: {
    paddingTop: 14,
    paddingHorizontal: OUTER_PADDING,
    paddingBottom: 32,
  },

  // Phase card — banner header (key color) + white body. overflow:hidden
  // makes sure the colored banner clips against the rounded card corners
  // and doesn't bleed past the border.
  phaseCard: {
    backgroundColor: palette.cardBg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },

  // Banner header — key color background + white text. The thin accent
  // bar on the left is a slightly lighter (50% alpha white) overlay to
  // give the banner some visual texture without needing a gradient lib.
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 12,
  },
  phaseHeaderAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  phaseHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Phase body — holds the group grid. Padding matches old CARD_PADDING
  // for vertical consistency in grid math.
  phaseBody: {
    paddingVertical: 14,
    paddingHorizontal: CARD_PADDING,
  },

  // 4-column grid using flex-wrap + gap (RN 0.71+).
  groupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  groupItem: {
    width: ITEM_WIDTH,
    alignItems: 'center',
  },

  groupCircleWrap: {
    position: 'relative',
  },
  groupCircle: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupImage: {
    width: '100%',
    height: '100%',
  },
  groupImagePlaceholder: {
    width: '100%', height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBadge: {
    position: 'absolute',
    top: -2, right: -2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#F59E0B',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: palette.cardBg,
  },

  groupLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.textPrimary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
    minHeight: 28, // 2 lines reserved so circles align across rows
  },

  viewProductsBtn: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#3B82F6',
  },
  viewProductsBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  viewProductsBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  viewProductsBtnTextDisabled: {
    color: '#94A3B8',
  },

  // Loading / empty
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyBtn: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: palette.fabBg,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Info modal (bottom-sheet)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: palette.cardBg,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    height: '75%',
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginRight: 12,
    lineHeight: 20,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  modalText: {
    fontSize: 13,
    lineHeight: 20,
    color: palette.textPrimary,
  },
});