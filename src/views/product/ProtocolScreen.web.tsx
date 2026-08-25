import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

// Web-only style prop not present in React Native's type definitions.
const webClickable = { cursor: 'pointer' } as any;

// Placeholders for the Guide Patient modal.
const GUIDE_PATIENT_QR_URL = 'https://placehold.co/300x300/000000/FFFFFF/png?text=QR+GUIDE';
const GUIDE_PATIENT_LINK   = 'https://app.orthomaster.fr/guides/patient';

// ============================================================
// Grid sizing — WEB. Circles are a fixed 44px and wrap freely; no more
// per-column math against screen width (the web panel width varies and
// the fixed size makes column division unnecessary).
// ============================================================
const CARD_PADDING = 14;     // Phase card inner padding
const GAP          = 8;
const CIRCLE_SIZE  = 80;     // fixed circle diameter
const ITEM_WIDTH   = 96;     // column width per group (holds circle + label)

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

  const filterGroupIds = useMemo<string[]>(() => {
    if (!protocol) return [];
    return protocol.phases.flatMap(ph =>
      ph.groups.filter(g => g.type === 'filter').map(g => g.id)
    );
  }, [protocol]);

  const filterIds = useMemo<string[]>(
    () => Object.values(selections ?? {}).flat() as string[],
    [selections],
  );

  const { data: groupCounts = {} } = useQuery({
    queryKey: ['group-counts', filterIds.join(','), filterGroupIds.join(',')],
    queryFn: () => getGroupCounts(filterIds, filterGroupIds),
    enabled: !!protocol && filterGroupIds.length > 0,
    retry: 1,
  });

  const handleBack = () => navigation.goBack();

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
        {/* Top bar — fixed height 100 */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleBack} style={[styles.backBtn, webClickable]} hitSlop={10} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={palette.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Protocole</Text>
            <Text style={styles.title} numberOfLines={1}>
              {protocol?.title ?? '—'}
            </Text>
          </View>

          <View style={styles.topVerticalDivider} />
          <HeaderIconButton
            label="Guide Patient"
            icon={<MaterialCommunityIcons name="qrcode-scan" size={20} color={palette.textPrimary} />}
            onPress={() => setGuideOpen(true)}
            disabled={!protocol}
          />
        </View>

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
              <TouchableOpacity style={[styles.emptyBtn, webClickable]} onPress={handleBack} activeOpacity={0.85}>
                <Text style={styles.emptyBtnText}>Retour aux filtres</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.phaseGrid}>
                {protocol.phases.map((phase, idx) => (
                  <View key={phase.id} style={styles.phaseCol}>
                    <PhaseCard
                      phase={phase}
                      keyColor={colorForPhase(idx)}
                      groupCounts={groupCounts}
                      onTap={handleTapGroup}
                    />
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </SafeAreaView>

      {/* Info modal */}
      <Modal
        visible={!!infoGroup}
        animationType="fade"
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
              <TouchableOpacity onPress={() => setInfoGroup(null)} hitSlop={10} activeOpacity={0.7} style={webClickable}>
                <Ionicons name="close" size={24} color={palette.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 32 }}>
              <SimpleMarkdown
                content={infoGroup?.type === 'info' ? (infoGroup.content ?? '') : ''}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

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
// Phase card
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
// Group circle — fixed 44px. image center, title below, "Choisir"
// button for filter type, ℹ badge top-right for info type.
// ============================================================
function GroupCircle({ group, isEmpty, onPress }: {
  group: ProtocolGroup;
  isEmpty?: boolean;
  onPress: () => void;
}) {
  const isFilter   = group.type === 'filter';
  const isDisabled = !!isEmpty;

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
      <TouchableOpacity
        style={[styles.groupCircleWrap, webClickable, { width: CIRCLE_SIZE, height: CIRCLE_SIZE }]}
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

        {!isFilter && (
          <View style={styles.infoBadge}>
            <Ionicons name="information" size={10} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      <Text
        style={[
          styles.groupLabel,
          isDisabled && { color: palette.textMuted },
        ]}
        numberOfLines={2}
      >
        {group.label}
      </Text>

      {isFilter && (
        <TouchableOpacity
          style={[
            styles.viewProductsBtn,
            webClickable,
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
// Header icon button
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
      style={[styles.headerBtn, webClickable, disabled && styles.headerBtnDisabled]}
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
// SimpleMarkdown — text-only lightweight markdown for the info modal.
// Supports: # / ## / ### / #### headings, - / * lists, inline **bold**
// and *italic*. No images/tables/links (info content is plain text).
// ============================================================
type MdSeg = { text: string; bold?: boolean; italic?: boolean };

function parseInline(line: string): MdSeg[] {
  const segs: MdSeg[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const tokens = line.split(re).filter(t => t !== '');
  for (const tok of tokens) {
    if (tok.startsWith('**') && tok.endsWith('**') && tok.length >= 4) {
      segs.push({ text: tok.slice(2, -2), bold: true });
    } else if (tok.startsWith('*') && tok.endsWith('*') && tok.length >= 2) {
      segs.push({ text: tok.slice(1, -1), italic: true });
    } else {
      segs.push({ text: tok });
    }
  }
  return segs;
}

function InlineText({ segs, style }: { segs: MdSeg[]; style?: any }) {
  return (
    <Text style={style}>
      {segs.map((s, i) => (
        <Text key={i} style={[s.bold && styles.mdBold, s.italic && styles.mdItalic]}>
          {s.text}
        </Text>
      ))}
    </Text>
  );
}

function SimpleMarkdown({ content }: { content: string }) {
  const lines = (content ?? '').replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let key = 0;

  for (const raw of lines) {
    const trimmed = raw.trim();

    if (trimmed === '') {
      blocks.push(<View key={key++} style={styles.mdSpacer} />);
      continue;
    }

    // Headings — most specific first.
    if (trimmed.startsWith('#### ')) {
      blocks.push(<InlineText key={key++} segs={parseInline(trimmed.slice(5))} style={styles.mdH4} />);
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push(<InlineText key={key++} segs={parseInline(trimmed.slice(4))} style={styles.mdH3} />);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push(<InlineText key={key++} segs={parseInline(trimmed.slice(3))} style={styles.mdH2} />);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      blocks.push(<InlineText key={key++} segs={parseInline(trimmed.slice(2))} style={styles.mdH1} />);
      continue;
    }

    // List item.
    const listMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (listMatch) {
      blocks.push(
        <View key={key++} style={styles.mdListRow}>
          <Text style={styles.mdBullet}>•</Text>
          <InlineText segs={parseInline(listMatch[1])} style={styles.mdListText} />
        </View>,
      );
      continue;
    }

    // Paragraph.
    blocks.push(<InlineText key={key++} segs={parseInline(trimmed)} style={styles.mdParagraph} />);
  }

  return <View>{blocks}</View>;
}

// ============================================================
// Styles
// ============================================================
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  bodyContainer: { flex: 1, backgroundColor: palette.bg },

  // Top bar — fixed height 100, contents vertically centered.
  topBar: {
    height: 100,
    paddingHorizontal: 16,
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

  topVerticalDivider: {
    width: 1,
    height: 44,
    alignSelf: 'center',
    backgroundColor: palette.border,
    marginHorizontal: 10,
  },

  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerBtnDisabled: {
    opacity: 0.45,
  },
  headerBtnLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: palette.textPrimary,
    marginLeft: 12,
    letterSpacing: 0.2,
    textAlign: 'left',
  },
  headerBtnLabelDisabled: {
    color: palette.textMuted,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.4,
    color: palette.textMuted,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: -0.4,
  },

  scrollContent: {
    paddingTop: 14,
    paddingHorizontal: 9,
    paddingBottom: 32,
  },

  // Two-column phase grid. Each column takes ~half the row; the gap
  // between columns and rows is created by phaseCol's padding.
  phaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  phaseCol: {
    width: '50%',
    paddingHorizontal: 7,
    marginBottom: 14,
  },

  phaseCard: {
    backgroundColor: palette.cardBg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },

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
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  phaseBody: {
    paddingVertical: 14,
    paddingHorizontal: CARD_PADDING,
  },

  // Group grid — wrapping row of fixed-size items.
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
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#F59E0B',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: palette.cardBg,
  },

  groupLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: palette.textPrimary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
    minHeight: 28,
  },

  viewProductsBtn: {
    marginTop: 8,
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
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    letterSpacing: 0.2,
  },
  viewProductsBtnTextDisabled: {
    color: '#94A3B8',
  },

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
    fontSize: 14,
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

  // Info modal — centered on web.
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '75%',
    backgroundColor: palette.cardBg,
    borderRadius: 18,
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
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: palette.textPrimary,
    marginRight: 12,
    lineHeight: 20,
  },
  modalBody: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },

  // Markdown styles for the info modal.
  mdH1: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: palette.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 25,
    marginTop: 12,
    marginBottom: 6,
  },
  mdH2: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: palette.textPrimary,
    letterSpacing: -0.2,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 5,
  },
  mdH3: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: palette.textPrimary,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  mdH4: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: palette.textPrimary,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 3,
  },
  mdParagraph: {
    fontSize: 13,
    lineHeight: 20,
    color: palette.textPrimary,
    marginBottom: 8,
  },
  mdListRow: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingRight: 4,
  },
  mdBullet: {
    fontSize: 13,
    lineHeight: 20,
    color: palette.textSecondary,
    marginRight: 8,
  },
  mdListText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: palette.textPrimary,
  },
  mdBold: {
    fontWeight: '700',
    color: palette.textPrimary,
  },
  mdItalic: {
    fontStyle: 'italic',
  },
  mdSpacer: {
    height: 8,
  },
});