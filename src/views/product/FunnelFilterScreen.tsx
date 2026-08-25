import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Pressable, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CameraScannerModal } from './components/CameraScannerModal';
import { PathologySummaryModal } from './components/PathologySummaryModal';
import { StepTabs, StepTab } from './components/StepTabs';
import { SearchFilterModal } from './components/SearchFilterModal';
import { PathologyPreviewCard } from './components/PathologyPreviewCard';
import { ConfirmModal } from './components/ConfirmModal';

import { getPathologySummary } from '../../services/v2/ProductService';
import { ChildNode, isChildVisible, MainNode, Selections, toggleSelection } from './lib/Logic';
import { buildOwnership, nodeGate } from './lib/NodeGraph';
import { accentForIndex, Accent, palette } from './lib/Theme';

import {
  countFilteredProducts, getProtocols, getRules, Protocol,
} from '../../services/v2/ProductService';

// Per-root presentation. Nodes not listed fall back to a generic icon
// and sort to the end, so adding a root to rules.json never crashes the
// tab bar — it just looks plain until it gets an entry here.
//
// Both icon variants are spelled out: the filled one for the active
// tab, the outline for the rest. `weight` is the tab's share of the bar
// — "Type de pathologie" needs roughly half again the room of "Patient".
const STEP_CONFIG: Record<string, {
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
  order: number;
  weight: number;
}> = {
  zone: { icon: 'body', iconOutline: 'body-outline', order: 0, weight: 1.05 },
  path_type: { icon: 'clipboard', iconOutline: 'clipboard-outline', order: 1, weight: 1.55 },
  patient: { icon: 'person', iconOutline: 'person-outline', order: 2, weight: 0.9 },
};
const FALLBACK_STEP = {
  icon: 'ellipse' as keyof typeof Ionicons.glyphMap,
  iconOutline: 'ellipse-outline' as keyof typeof Ionicons.glyphMap,
  order: 99,
  weight: 1,
};
const HINT_LABEL: Record<string, string> = {
  localisation: 'Préciser la Localisation',
  local_tronc: 'Préciser la Localisation',
  local_memi: 'Préciser la Localisation',
  local_mems: 'Préciser la Localisation',
  segment: 'Préciser le Segment',
  zone: 'Préciser la Zone',
  path_type: 'Préciser le Type de pathologie',
};

function flattenSelections(selections: Selections): string[] {
  return Object.values(selections).flat();
}

function buildDefaultSelections(nodes: MainNode[]): Selections {
  const result: Selections = {};
  for (const node of nodes) {
    if (node.visibilityRule == null && node.selectionType === 'multi') {
      result[node.id] = node.children.map(c => c.id);
    }
  }
  return result;
}

export const FunnelFilterScreen = ({ navigation, route }: any) => {

  // Control nav
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({ tabBarStyle: { display: 'none' } });
    }, [navigation])
  );

  const { data: rules = [] } = useQuery({
    queryKey: ['product-rules'],
    queryFn: () => getRules(),
    retry: 1,
    retryDelay: 1000,
  });

  const { data: protocols = [] } = useQuery({
    queryKey: ['product-protocols'],
    queryFn: () => getProtocols(),
    retry: 1,
    retryDelay: 1000,
  });

  const [selections, setSelections] = useState<Selections>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [infoChild, setInfoChild] = useState<ChildNode | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  // ---------- step model ----------

  // Roots in display order (Localisation → Pathologie → Patient),
  // driven by STEP_CONFIG rather than the order they happen to sit in
  // rules.json.
  const steps = useMemo(() => {
    return rules
      .filter(n => n.visibilityRule == null)
      .map(node => ({ node, cfg: STEP_CONFIG[node.id] ?? FALLBACK_STEP }))
      .sort((a, b) => a.cfg.order - b.cfg.order)
      .map((s, i) => ({
        node: s.node,
        icon: s.cfg.icon,
        iconOutline: s.cfg.iconOutline,
        weight: s.cfg.weight,
        accent: accentForIndex(i) as Accent,
      }));
  }, [rules]);

  // Accents are keyed by display order, so a step keeps its colour even
  // if rules.json is reordered later.
  const stepNodes = useMemo(() => steps.map(s => s.node), [steps]);

  const ownership = useMemo(
    () => buildOwnership(rules, stepNodes),
    [rules, stepNodes],
  );

  // Node index in the rules array — used to keep sub-cards in authoring
  // order inside a step (root first, then its dependants).
  const orderIndex = useMemo(() => {
    const m = new Map<string, number>();
    rules.forEach((n, i) => m.set(n.id, i));
    return m;
  }, [rules]);

  const nodesForStep = useCallback((rootId: string): MainNode[] => {
    return rules
      .filter(n => ownership.get(n.id) === rootId)
      .sort((a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0));
  }, [rules, ownership, orderIndex]);

  // Selections belonging to a step, excluding the root's own children
  // when that root is a multi indicator — those are auto-ticked defaults
  // and would inflate every badge to a constant.
  const countForStep = useCallback((root: MainNode): number => {
    return nodesForStep(root.id).reduce((sum, n) => {
      if (n.id === root.id && root.selectionType === 'multi') return sum;
      return sum + (selections[n.id]?.length ?? 0);
    }, 0);
  }, [nodesForStep, selections]);

  const tabs: StepTab[] = useMemo(
    () => steps.map(s => ({
      id: s.node.id,
      label: s.node.title,
      icon: s.icon,
      iconOutline: s.iconOutline,
      accent: s.accent,
      weight: s.weight,
      count: countForStep(s.node),
    })),
    [steps, countForStep],
  );

  const activeStep = steps[stepIndex] ?? null;

  // ---------- auto-scroll ----------

  // Height of the floating CTA plus a little breathing room — the part
  // of the viewport that looks visible but isn't.
  const CTA_CLEARANCE = 120;

  const scrollRef = useRef<ScrollView>(null);
  const viewportRef = useRef(0);
  // nodeId → { y, h } from each card wrapper's onLayout.
  const layoutsRef = useRef<Map<string, { y: number; h: number }>>(new Map());

  // Which nodes were on screen last render, and for which step. Keyed by
  // step so switching tabs doesn't count every node as "new".
  const seenRef = useRef<{ stepId: string | null; ids: Set<string> }>({
    stepId: null,
    ids: new Set(),
  });
  // A node that just appeared — align its top to the viewport top.
  const pendingTopRef = useRef<string | null>(null);
  // A node that just grew a preview note — bring its bottom into view.
  const pendingRevealRef = useRef<string | null>(null);

  const revealBottom = useCallback((nodeId: string) => {
    const l = layoutsRef.current.get(nodeId);
    const vh = viewportRef.current;
    if (!l || vh === 0) return;
    const target = l.y + l.h - (vh - CTA_CLEARANCE) + 12;
    if (target > 0) scrollRef.current?.scrollTo({ y: target, animated: true });
  }, []);

  const visibleNodeIds = useMemo(() => {
    if (!activeStep) return [] as string[];
    return nodesForStep(activeStep.node.id)
      .filter(n => nodeGate(n, selections).state !== 'hidden')
      .map(n => n.id);
  }, [activeStep, nodesForStep, selections]);

  useEffect(() => {
    const stepId = activeStep?.node.id ?? null;
    const prev = seenRef.current;

    if (prev.stepId !== stepId) {
      seenRef.current = { stepId, ids: new Set(visibleNodeIds) };
      pendingTopRef.current = null;
      return;
    }

    const fresh = visibleNodeIds.filter(id => !prev.ids.has(id));
    seenRef.current = { stepId, ids: new Set(visibleNodeIds) };
    // First in document order = topmost, so scrolling to it also brings
    // any siblings that appeared alongside into view.
    if (fresh.length > 0) pendingTopRef.current = fresh[0];
  }, [visibleNodeIds, activeStep]);

  // Selected children that carry a memo, as "nodeId:childId" keys. A new
  // entry means a preview note is about to unroll inside that node —
  // usually the last card in the step, so it lands below the fold.
  const memoKeys = useMemo(() => {
    if (!activeStep) return [] as string[];
    const out: string[] = [];
    for (const n of nodesForStep(activeStep.node.id)) {
      const sels = selections[n.id] || [];
      for (const c of n.children) {
        if (c.db_id && sels.includes(c.id)) out.push(`${n.id}:${c.id}`);
      }
    }
    return out;
  }, [activeStep, nodesForStep, selections]);

  const seenMemoRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const fresh = memoKeys.filter(k => !seenMemoRef.current.has(k));
    seenMemoRef.current = new Set(memoKeys);
    if (fresh.length === 0) return;

    const nodeId = fresh[0].split(':')[0];

    // The note stays unmounted while the request is in flight, so the
    // node's height doesn't change until the data lands — there's no
    // intermediate layout pass to hook into. Two delayed passes cover
    // both cases: a warm cache (note appears at once) and a cold one
    // (request, then the 420ms unroll).
    pendingRevealRef.current = nodeId;
    const t1 = setTimeout(() => revealBottom(nodeId), 350);
    const t2 = setTimeout(() => revealBottom(nodeId), 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [memoKeys, revealBottom]);

  const handleCardLayout = useCallback((nodeId: string, y: number, h: number) => {
    layoutsRef.current.set(nodeId, { y, h });

    if (pendingTopRef.current === nodeId) {
      pendingTopRef.current = null;
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
      return;
    }
    if (pendingRevealRef.current === nodeId) {
      pendingRevealRef.current = null;
      revealBottom(nodeId);
    }
  }, [revealBottom]);

  // ---------- defaults, deep links, reset ----------

  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current || rules.length === 0) return;
    didInitRef.current = true;

    const paramSels = route?.params?.selections as Selections | undefined;
    if (paramSels && Object.keys(paramSels).length > 0) return;

    setSelections(buildDefaultSelections(rules));
  }, [rules, route?.params?.selections]);

  useEffect(() => {
    const paramSels = route?.params?.selections as Selections | undefined;
    if (paramSels && typeof paramSels === 'object' && Object.keys(paramSels).length > 0) {
      setSelections(paramSels);
    }
  }, [route?.params?.selections]);

  useEffect(() => {
    if (route?.params?.reset) {
      setSelections(buildDefaultSelections(rules));
      setStepIndex(0);
      navigation.setParams({ reset: undefined });
    }
  }, [route?.params?.reset, navigation, rules]);

  // ---------- product count ----------

  const fetchSeqRef = useRef(0);
  useEffect(() => {
    const mySeq = ++fetchSeqRef.current;
    const flat = flattenSelections(selections);
    const timer = setTimeout(async () => {
      const count = await countFilteredProducts(flat);
      if (mySeq !== fetchSeqRef.current) return;
      setProductCount(typeof count === 'number' ? count : 0);
    }, 300);
    return () => clearTimeout(timer);
  }, [selections]);

  // ---------- handlers ----------

  const handleToggle = useCallback((nodeId: string, childId: string) => {
    setSelections(prev => toggleSelection(rules, prev, nodeId, childId));
  }, [rules]);

  const handleReset = useCallback(() => {
    setSelections(buildDefaultSelections(rules));
    setStepIndex(0);
    setConfirmReset(false);
  }, [rules]);

  const handleClose = useCallback(() => {
    setConfirmClose(false);
    navigation.dispatch(CommonActions.reset({
      index: 0,
      routes: [{ name: 'tools-home' }],
    }));
  }, [navigation]);

  // Cycles: last step wraps back to the first.
  const handleNextStep = useCallback(() => {
    if (steps.length === 0) return;
    setStepIndex(i => (i + 1) % steps.length);
  }, [steps.length]);

  // A locked card's hint points at the node that's still missing; jump
  // to whichever step owns it.
  const jumpToNode = useCallback((nodeId: string) => {
    const rootId = ownership.get(nodeId);
    if (!rootId) return;
    const idx = steps.findIndex(s => s.node.id === rootId);
    if (idx >= 0) setStepIndex(idx);
  }, [ownership, steps]);

  const totalSelected = useMemo(() => {
    let count = 0;
    for (const [nodeId, arr] of Object.entries(selections)) {
      const node = rules.find(n => n.id === nodeId);
      if (!node) continue;
      if (node.visibilityRule == null && node.selectionType === 'multi') continue;
      count += arr.length;
    }
    return count;
  }, [selections, rules]);

  const handleViewProducts = useCallback(() => {
    const protocolId = resolveProtocolId(selections, rules);
    if (protocolId) {
      navigation.navigate('protocol-view', { selections, protocolId });
      return;
    }
    navigation.navigate('products-view', { selections });
  }, [navigation, selections, rules]);

  const handleScanned = useCallback((url: string) => {
    setScannerOpen(false);
    const { filters: flatFilters, groupId } = parseScannedUrl(url);
    if (flatFilters.length === 0 && !groupId) return;

    const scanned = flatToSelections(flatFilters, rules);

    let protocolId: string | null = null;
    let groupLabel: string | null = null;
    if (groupId) {
      const match = protocolForGroup(protocols, groupId);
      if (match) {
        protocolId = match.protocolId;
        groupLabel = match.groupLabel;
      }
    }

    const routes: Array<{ name: string; params?: any }> = [
      { name: 'new-que-choisir', params: { selections: scanned } },
    ];
    if (protocolId) {
      routes.push({ name: 'protocol-view', params: { selections: scanned, protocolId } });
    }
    routes.push({
      name: 'products-view',
      params: {
        selections: scanned,
        groupId: groupId || undefined,
        groupLabel: groupLabel || undefined,
      },
    });

    navigation.dispatch(CommonActions.reset({ index: routes.length - 1, routes }));
  }, [navigation, rules, protocols]);

  // ---------- render ----------

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.cardBg} />

      <View style={styles.headerZone}>
        <View style={styles.headerSurface}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Étape 1</Text>
              <Text style={styles.title}>{"Critères\nPatient"}</Text>
            </View>

            <View style={styles.headerActions}>
              <HeaderIconButton
                label="Mots-clés"
                icon={<Ionicons name="search" size={20} color={palette.textPrimary} />}
                onPress={() => setSearchOpen(true)}
              />
              <View style={styles.headerDivider} />
              <HeaderIconButton
                label="Effacer"
                icon={
                  <AntDesign
                    name="clear"
                    size={20}
                    color={totalSelected > 0 ? palette.textPrimary : palette.textMuted}
                  />
                }
                onPress={() => setConfirmReset(true)}
                disabled={totalSelected === 0}
              />
              <View style={styles.headerDivider} />
              <HeaderIconButton
                label="Fermer"
                icon={<MaterialCommunityIcons name="window-close" size={21} color={palette.textPrimary} />}
                onPress={() => {
                  if (totalSelected === 0) handleClose();
                  else setConfirmClose(true);
                }}
              />
            </View>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.tabsOverlap}>
          <StepTabs
            tabs={tabs}
            activeIndex={stepIndex}
            onSelect={setStepIndex}
          />
        </View>
      </View>

      {/* Body + floating action bar share this container so the pill can
          hover over the scrolling content instead of sitting in its own
          detached footer. */}
      <View style={styles.bodyWrap}>
        <ScrollView
          ref={scrollRef}
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
          onLayout={e => { viewportRef.current = e.nativeEvent.layout.height; }}
        >
          {activeStep && (
            <View style={styles.stepHeader}>
              <View style={[styles.stepBar, { backgroundColor: activeStep.accent.strong }]} />
              <Text style={styles.stepTitle}>{activeStep.node.title}</Text>
              <Text style={styles.stepSub}>
                {countForStep(activeStep.node)} sélection
                {countForStep(activeStep.node) > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {activeStep && nodesForStep(activeStep.node.id).map(node => {
            const gate = nodeGate(node, selections);
            if (gate.state === 'hidden') return null;

            return (
              <View
                key={node.id}
                onLayout={e => handleCardLayout(
                  node.id,
                  e.nativeEvent.layout.y,
                  e.nativeEvent.layout.height,
                )}
              >
                {gate.state === 'locked' ? (
                  <LockedCard
                    node={node}
                    gate={gate}
                    allNodes={rules}
                    ownership={ownership}
                    steps={steps}
                    onJump={jumpToNode}
                  />
                ) : (
                  <OptionCard
                    node={node}
                    selections={selections}
                    accent={activeStep.accent}
                    onToggle={handleToggle}
                    onInfo={setInfoChild}
                  />
                )}
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.floatBar} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.cta, productCount === 0 && styles.ctaDisabled]}
            onPress={handleViewProducts}
            disabled={productCount === 0}
            activeOpacity={0.85}
          >
            <Text style={[styles.ctaText, productCount === 0 && styles.ctaTextDisabled]}>
              {productCount === 0
                ? 'Aucun dispositif ne correspond'
                : `Voir ${productCount} ${productCount > 1 ? 'Dispositifs Médicaux' : 'Dispositif Médical'}`}
            </Text>
            {productCount > 0 &&
              <Ionicons name="arrow-forward" size={22} color='#fff' />
            }
          </TouchableOpacity>
        </View>
      </View>

      <SearchFilterModal
        visible={searchOpen}
        allNodes={rules}
        selections={selections}
        onClose={() => setSearchOpen(false)}
        onSelect={handleToggle}
      />

      <CameraScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleScanned}
      />

      <PathologySummaryModal
        visible={!!infoChild}
        dbId={infoChild?.db_id ?? null}
        fallbackTitle={infoChild?.label ?? ''}
        onClose={() => setInfoChild(null)}
      />

      <ConfirmModal
        visible={confirmReset}
        icon="alert-outline"
        title="Effacer les critères patient ?"
        message={`Vos sélections seront perdues.`}
        confirmLabel="Effacer"
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />

      <ConfirmModal
        visible={confirmClose}
        icon="exit-outline"
        title="Quitter Que Choisir ?"
        message="Vos filtres ne seront pas conservés. Vous devrez recommencer à la prochaine ouverture."
        confirmLabel="Quitter"
        tone="#DC2626"
        onConfirm={handleClose}
        onCancel={() => setConfirmClose(false)}
      />

    </SafeAreaView>
  );
};

// ============================================================
// Sub-cards
// ============================================================

function OptionCard({
  node, selections, accent, onToggle, onInfo,
}: {
  node: MainNode;
  selections: Selections;
  accent: Accent;
  onToggle: (nodeId: string, childId: string) => void;
  onInfo: (child: ChildNode) => void;
}) {
  const sels = selections[node.id] || [];
  const visibleChildren = node.children.filter(c => isChildVisible(c, selections));
  if (visibleChildren.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>{node.title}</Text>
        <Text style={styles.cardMeta}>
          {node.selectionType === 'multi' ? 'Choix multiple' : 'Choix unique'}
        </Text>
      </View>

      <View style={styles.pills}>
        {visibleChildren.map(child => (
          <ChoicePill
            key={child.id}
            child={child}
            selected={sels.includes(child.id)}
            accent={accent}
            onPress={() => onToggle(node.id, child.id)}
          />
        ))}
      </View>

      {/* One preview per selected child that has a memo. path_memi is
          multi-select, so several can stack. */}
      {visibleChildren
        .filter(c => sels.includes(c.id) && !!c.db_id)
        .map(child => (
          <PathologyPreviewCard
            key={`preview-${child.id}`}
            dbId={child.db_id as string}
            fallbackTitle={child.label}
            onOpen={() => onInfo(child)}
          />
        ))}
    </View>
  );
}

function LockedCard({
  node, gate, allNodes, ownership, steps, onJump,
}: {
  node: MainNode;
  gate: { state: 'locked'; total: number; satisfied: number; missing: string[] };
  allNodes: MainNode[];
  ownership: Map<string, string>;
  steps: { node: MainNode; accent: Accent }[];
  onJump: (nodeId: string) => void;
}) {
  return (
    <>
      {gate.missing.map(nid => {
        const target = allNodes.find(n => n.id === nid);
        if (!target) return null;
        const ownerId = ownership.get(nid);
        const ownerStep = steps.find(s => s.node.id === ownerId);

        return (
          <Pressable style={styles.locked} key={'locked' + nid} onPress={() => onJump(nid)}>
            <View style={styles.cardHead}>
              <Ionicons name="lock-closed" size={15} color={palette.textMuted} />
              <Text style={styles.lockedTitle}>{node.title}</Text>
            </View>
            <View key={nid} style={[styles.hint, { borderColor: ownerStep?.accent.strong ?? palette.border }]} >
              <Ionicons
                name={nid == 'path_type' ? 'arrow-up' : 'arrow-back'}
                size={22}
                color={ownerStep?.accent.strong ?? palette.textMuted}
              />
              <Text style={styles.hintText}>
                {HINT_LABEL[nid] ?? `Préciser : ${target.title}`}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </>
  );
}

function ChoicePill({
  child, selected, accent, onPress,
}: {
  child: ChildNode;
  selected: boolean;
  accent: Accent;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const hasMemo = selected && !!child.db_id;

  // Same key as the preview card and the modal — React Query dedupes,
  // so this only reads cache status, it never fires a second request.
  const { isLoading } = useQuery({
    queryKey: ['pathology-summary', child.db_id],
    queryFn: () => getPathologySummary(child.db_id as string),
    enabled: hasMemo,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Badge is a loading indicator only. Once the memo lands the note
  // unrolls below the pill and takes over — leaving an "i" here would
  // just be a second entry point to the same thing.
  const showInfo = hasMemo && isLoading;

  const infoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(infoAnim, {
      toValue: showInfo ? 1 : 0,
      useNativeDriver: true,
      speed: 14,
      bounciness: 10,
    }).start();
  }, [showInfo, infoAnim]);

  const infoScale = infoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    // The wrapper reserves the space the badge overhangs into. Padding
    // is unconditional so pills don't shift when the badge appears, and
    // it keeps the badge inside the parent's bounds — Android clips
    // absolutely-positioned children that spill past their container.
    <Animated.View style={[styles.pillWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 50, bounciness: 0 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 10 }).start()}
        style={[
          styles.pill,
          selected
            ? { backgroundColor: accent.strong, borderColor: accent.strong }
            : { backgroundColor: accent.soft, borderColor: 'transparent' },
        ]}
      >
        <Text
          style={[
            styles.pillText,
            { color: selected ? accent.textOn : accent.text },
            selected && { fontWeight: '700' },
          ]}
        >
          {child.label}
        </Text>
      </Pressable>

      {showInfo && (
        <Animated.View
          style={[
            styles.infoBtnWrap,
            { opacity: infoAnim, transform: [{ scale: infoScale }] },
          ]}
        >
          <View style={styles.infoBtn} accessibilityLabel={`Chargement de la fiche ${child.label}`}>
            <ActivityIndicator size="small" color="#FFFFFF" style={styles.infoSpinner} />
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

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
// Deep-link / scan helpers (ported from SolarFilterScreen)
// ============================================================

function resolveProtocolId(selections: Selections, nodes: MainNode[]): string | null {
  for (const [nodeId, childIds] of Object.entries(selections)) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) continue;
    for (const cid of childIds) {
      const child = node.children.find(c => c.id === cid);
      if (child?.protocolId) return child.protocolId;
    }
  }
  return null;
}

function flatToSelections(flat: string[], nodes: MainNode[]): Selections {
  if (flat.length === 0) return {};
  const set = new Set(flat);
  const result: Selections = {};
  for (const node of nodes) {
    const matched = node.children.filter(c => set.has(c.id)).map(c => c.id);
    if (matched.length > 0) result[node.id] = matched;
  }
  return result;
}

function parseScannedUrl(url: string): { filters: string[]; groupId: string | null } {
  let filtersParam = '';
  let groupParam = '';
  try {
    const parsed = new URL(url);
    filtersParam = parsed.searchParams.get('filters') || '';
    groupParam = parsed.searchParams.get('group') || '';
  } catch {
    const fm = url.match(/[?&]filters=([^&#]+)/);
    if (fm) { try { filtersParam = decodeURIComponent(fm[1]); } catch { filtersParam = fm[1]; } }
    const gm = url.match(/[?&]group=([^&#]+)/);
    if (gm) { try { groupParam = decodeURIComponent(gm[1]); } catch { groupParam = gm[1]; } }
  }
  const filters = filtersParam
    ? filtersParam.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const groupId = groupParam ? groupParam.trim() : null;
  return { filters, groupId: groupId || null };
}

function protocolForGroup(
  protocols: Protocol[],
  groupId: string,
): { protocolId: string; groupLabel: string } | null {
  for (const p of protocols) {
    for (const ph of p.phases) {
      for (const g of ph.groups) {
        if (g.id === groupId) return { protocolId: p.id, groupLabel: g.label };
      }
    }
  }
  return null;
}

// ============================================================

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.cardBg },
  headerZone: {
    backgroundColor: palette.bg,
    zIndex: 10,
  },
  headerSurface: {
    backgroundColor: palette.cardBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerSpacer: { height: 31 },
  tabsOverlap: { marginTop: -31 },
  header: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: '600',
    letterSpacing: 1,
    color: palette.textMuted,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  title: {
    fontSize: 22,
    lineHeight: 25,
    letterSpacing: 0.3,
    fontFamily: 'Poppins-Bold',
    color: palette.textPrimary,
  },
  headerActions: { flexDirection: 'row', alignItems: 'stretch' },
  headerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 56,
  },
  headerBtnDisabled: { opacity: 0.45 },
  headerBtnLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: palette.textPrimary,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  headerBtnLabelDisabled: { color: palette.textMuted },
  headerDivider: {
    width: 1,
    backgroundColor: palette.border,
    marginVertical: 6,
  },

  body: { flex: 1 },
  bodyWrap: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 160,
  },

  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  stepBar: { width: 3, height: 34, borderRadius: 0 },
  stepTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: palette.textPrimary,
  },
  stepSub: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: palette.textSecondary,
    letterSpacing: 0.3
  },

  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginBottom: 9,
    backgroundColor: palette.cardBg,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2,
    color: palette.textPrimary,
    marginTop: 4,
  },
  cardMeta: {
    fontSize: 10.5,
    fontFamily: 'Roboto',
    color: palette.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  locked: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 10,
    marginBottom: 9,
    backgroundColor: palette.bg,
  },
  lockedTitle: {
    flex: 1,
    fontSize: 12.5,
    color: palette.textSecondary,
    fontWeight: '600',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
    marginTop: 9,
  },
  hintText: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: palette.textPrimary,
    letterSpacing: 0.3,
  },
  hintStrong: {
    fontWeight: '700'
  },

  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
    paddingBottom: 4,
  },
  pillWrap: {
    paddingTop: 9,
    paddingRight: 9,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 14,
    fontFamily: 'Roboto',
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  infoBtnWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  infoBtn: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#3b76ba',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#2C5687',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 3.5,
    elevation: 5,
  },
  // ActivityIndicator's smallest size still overflows a 23px circle
  // slightly; scaling it down keeps it inside the border.
  infoSpinner: {
    transform: [{ scale: 0.7 }],
  },

  // Floats over the scrolling body instead of sitting in a footer.
  floatBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  cta: {
    flex: 1,
    flexDirection:'row',
    gap: 6,
    backgroundColor: palette.textPrimary,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 7,
    opacity: 0.9,
  },
  ctaDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.3,
  },
  ctaTextDisabled: { fontFamily: 'Poppins-Medium', color: '#9CA3AF', fontWeight: '600' },
});