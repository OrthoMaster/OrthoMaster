import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, NativeScrollEvent, NativeSyntheticEvent, Pressable,
  ScrollView, StyleSheet, Text, TouchableOpacity, View, ViewStyle, useWindowDimensions,
} from 'react-native';

import { ConfirmModal } from './components/ConfirmModal';
import { PathologyPreviewCard } from './components/PathologyPreviewCard';
import { PathologySummaryModal } from './components/PathologySummaryModal';
import { SearchFilterModal } from './components/SearchFilterModal';
import { StepTab, StepTabs } from './components/StepTabs';

import { getPathologySummary } from '../../services/v2/ProductService';
import { ChildNode, isChildVisible, MainNode, Selections, toggleSelection } from './lib/Logic';
import { buildOwnership, nodeGate } from './lib/NodeGraph';
import { Accent, accentForIndex, palette } from './lib/Theme';

import {
  countFilteredProducts, getProtocols, getRules, Protocol,
} from '../../services/v2/ProductService';

// ============================================================
// Web sibling of FunnelFilterScreen.tsx.
//
// Metro resolves *.web.tsx first on web, so this file replaces the
// native screen wholesale — the import path stays `./FunnelFilterScreen`
// everywhere else. Shared logic still comes from ./lib, so rules,
// gating and selection semantics stay in one place.
//
// What changes on web, and why:
//   · Above 1024px there's room for every step at once, so the funnel
//     stops being a wizard. The left rail turns into a progress index
//     and the three roots become sections in one scrolling column, with
//     the CTA on a footer bar under that column.
//   · Below 1024px (tablet portrait, phone browser) the native
//     one-step-at-a-time flow is kept, tabs and floating CTA included.
//   · No native driver, no StatusBar, no SafeAreaView.
//   · Pointer affordances: hover states and cursors, which the native
//     file has no reason to carry.
// ============================================================

const BREAKPOINT = 1024;
const RAIL_WIDTH = 307; // 236 + 30%
const COLUMN_MAX = 760;

// `cursor` and `boxShadow` are react-native-web extensions and aren't in
// the RN style types, so they live here behind one cast instead of
// scattering `as any` through the stylesheet.
const clickable = { cursor: 'pointer' } as unknown as ViewStyle;
const notAllowed = { cursor: 'not-allowed' } as unknown as ViewStyle;
// Takes the edge off the highlight swap on hover and on arrival.
const smoothTint = {
  transitionProperty: 'background-color, border-color',
  transitionDuration: '160ms',
} as unknown as ViewStyle;

// Per-root presentation. Nodes not listed fall back to a generic icon
// and sort to the end, so adding a root to rules.json never breaks the
// rail — it just looks plain until it gets an entry here.
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

type Step = {
  node: MainNode;
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
  weight: number;
  accent: Accent;
};

export const FunnelFilterScreen = ({ navigation, route }: any) => {
  const { width } = useWindowDimensions();
  const isWide = width >= BREAKPOINT;

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
  const [infoChild, setInfoChild] = useState<ChildNode | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  // ---------- step model ----------

  const steps: Step[] = useMemo(() => {
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

  const stepNodes = useMemo(() => steps.map(s => s.node), [steps]);

  const ownership = useMemo(
    () => buildOwnership(rules, stepNodes),
    [rules, stepNodes],
  );

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

  // ---------- scrolling ----------

  const scrollRef = useRef<ScrollView>(null);
  const viewportRef = useRef(0);
  const layoutsRef = useRef<Map<string, { y: number; h: number }>>(new Map());
  // Section boxes in the wide layout, measured against the scroll content.
  const sectionRef = useRef<Map<string, { y: number; h: number }>>(new Map());
  const wideViewportRef = useRef(0);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  // Blank space after the last section. Without it the scroll bottoms out
  // before "Patient" reaches the top of the viewport — the click looks
  // like it did nothing, and the rail never highlights it either.
  const [tailSpace, setTailSpace] = useState(0);

  const currentSectionId = activeSectionId ?? steps[0]?.node.id ?? null;

  const recomputeTail = useCallback(() => {
    const last = steps[steps.length - 1];
    const vh = wideViewportRef.current;
    if (!last || vh === 0) return;
    const box = sectionRef.current.get(last.node.id);
    if (!box) return;
    const needed = Math.max(0, vh - box.h - 46);
    setTailSpace(prev => (Math.abs(prev - needed) < 2 ? prev : needed));
  }, [steps]);

  const onSectionLayout = useCallback((rootId: string, y: number, h: number) => {
    sectionRef.current.set(rootId, { y, h });
    recomputeTail();
  }, [recomputeTail]);

  // While a click-driven scroll animates, the offset sweeps through every
  // section between here and the target, so onScroll would repaint the
  // rail two or three times before settling. The lock parks the highlight
  // on the target and ignores scroll events until we arrive.
  const scrollLockRef = useRef<{ id: string; y: number } | null>(null);
  const scrollLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const releaseScrollLock = useCallback(() => {
    scrollLockRef.current = null;
    if (scrollLockTimer.current) {
      clearTimeout(scrollLockTimer.current);
      scrollLockTimer.current = null;
    }
  }, []);

  useEffect(() => releaseScrollLock, [releaseScrollLock]);

  const onWideScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;

    const lock = scrollLockRef.current;
    if (lock) {
      // Arrived — hand control back to the scroll position.
      if (Math.abs(y - lock.y) < 4) releaseScrollLock();
      return;
    }

    let current: string | null = null;
    for (const s of steps) {
      const box = sectionRef.current.get(s.node.id);
      if (!box) continue;
      if (box.y - 140 <= y) current = s.node.id;
    }
    setActiveSectionId(prev => (prev === current ? prev : current));
  }, [steps, releaseScrollLock]);

  const scrollToSection = useCallback((rootId: string) => {
    const box = sectionRef.current.get(rootId);
    if (!box) return;
    const target = Math.max(0, box.y - 20);

    // A target near the bottom can be clamped, so the offset never
    // reaches it exactly and the 4px check above never fires. The timer
    // is the backstop that always releases the lock.
    scrollLockRef.current = { id: rootId, y: target };
    if (scrollLockTimer.current) clearTimeout(scrollLockTimer.current);
    scrollLockTimer.current = setTimeout(() => { scrollLockRef.current = null; }, 900);

    setActiveSectionId(rootId);
    scrollRef.current?.scrollTo({ y: target, animated: true });
  }, []);

  // --- narrow-only auto-scroll (unchanged from native) ---

  const CTA_CLEARANCE = 120;

  const seenRef = useRef<{ stepId: string | null; ids: Set<string> }>({
    stepId: null,
    ids: new Set(),
  });
  const pendingTopRef = useRef<string | null>(null);
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
    if (isWide) return;
    const stepId = activeStep?.node.id ?? null;
    const prev = seenRef.current;

    if (prev.stepId !== stepId) {
      seenRef.current = { stepId, ids: new Set(visibleNodeIds) };
      pendingTopRef.current = null;
      return;
    }

    const fresh = visibleNodeIds.filter(id => !prev.ids.has(id));
    seenRef.current = { stepId, ids: new Set(visibleNodeIds) };
    if (fresh.length > 0) pendingTopRef.current = fresh[0];
  }, [visibleNodeIds, activeStep, isWide]);

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
    if (isWide) return;
    const fresh = memoKeys.filter(k => !seenMemoRef.current.has(k));
    seenMemoRef.current = new Set(memoKeys);
    if (fresh.length === 0) return;

    const nodeId = fresh[0].split(':')[0];
    pendingRevealRef.current = nodeId;
    const t1 = setTimeout(() => revealBottom(nodeId), 350);
    const t2 = setTimeout(() => revealBottom(nodeId), 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [memoKeys, revealBottom, isWide]);

  const handleCardLayout = useCallback((nodeId: string, y: number, h: number) => {
    // In the wide layout a card's y is relative to its section, not the
    // scroll content, so the measurements would be meaningless — and the
    // whole funnel is on screen anyway.
    if (isWide) return;
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
  }, [revealBottom, isWide]);

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
      scrollRef.current?.scrollTo({ y: 0, animated: false });
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
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [rules]);

  const handleClose = useCallback(() => {
    setConfirmClose(false);
    navigation.dispatch(CommonActions.reset({
      index: 0,
      routes: [{ name: 'tools-home' }],
    }));
  }, [navigation]);

  // A locked card's hint points at the node that's still missing. On a
  // wide screen that node is already rendered, so scroll to it; on a
  // narrow one, switch to the step that owns it.
  const jumpToNode = useCallback((nodeId: string) => {
    const rootId = ownership.get(nodeId);
    if (!rootId) return;
    if (isWide) {
      scrollToSection(rootId);
      return;
    }
    const idx = steps.findIndex(s => s.node.id === rootId);
    if (idx >= 0) setStepIndex(idx);
  }, [ownership, steps, isWide, scrollToSection]);

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

  // Kept for parity with the native screen: a scanned or pasted deep
  // link still resolves to the same route stack. Wire it to whatever
  // entry point the web build uses (URL param, paste field, webcam).
  const handleScanned = useCallback((url: string) => {
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
  void handleScanned;

  // ---------- shared node rendering ----------

  const renderNodes = useCallback((step: Step) => {
    return nodesForStep(step.node.id).map(node => {
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
              isWide={isWide}
              onJump={jumpToNode}
            />
          ) : (
            <OptionCard
              node={node}
              selections={selections}
              accent={step.accent}
              onToggle={handleToggle}
              onInfo={setInfoChild}
            />
          )}
        </View>
      );
    });
  }, [nodesForStep, selections, rules, ownership, steps, isWide, jumpToNode, handleToggle, handleCardLayout]);

  const ctaLabel = productCount === 0
    ? 'Aucun dispositif ne correspond'
    : `Voir ${productCount} ${productCount > 1 ? 'Dispositifs Médicaux' : 'Dispositif Médical'}`;

  // ---------- render ----------

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <View style={[styles.topBarInner, !isWide && styles.topBarInnerNarrow]}>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>Étape 1</Text>
            <Text style={styles.title}>Critères patient</Text>
          </View>

          <View style={styles.headerActions}>
            <HeaderIconButton
              label="Mots-clés"
              icon={<Ionicons name="search" size={19} color={palette.textPrimary} />}
              onPress={() => setSearchOpen(true)}
            />
            <View style={styles.headerDivider} />
            <HeaderIconButton
              label="Effacer"
              icon={
                <AntDesign
                  name="clear"
                  size={19}
                  color={totalSelected > 0 ? palette.textPrimary : palette.textMuted}
                />
              }
              onPress={() => setConfirmReset(true)}
              disabled={totalSelected === 0}
            />
            <View style={styles.headerDivider} />
            <HeaderIconButton
              label="Fermer"
              icon={<MaterialCommunityIcons name="window-close" size={20} color={palette.textPrimary} />}
              onPress={() => {
                if (totalSelected === 0) handleClose();
                else setConfirmClose(true);
              }}
            />
          </View>
        </View>

        {!isWide && (
          <>
            <View style={styles.headerSpacer} />
            <View style={styles.tabsOverlap}>
              <StepTabs tabs={tabs} activeIndex={stepIndex} onSelect={setStepIndex} />
            </View>
          </>
        )}
      </View>

      {isWide ? (
        <View style={styles.wideBody}>
          <View style={styles.rail}>
            {/* <Text style={styles.railHeading}>Le parcours</Text> */}
            {steps.map((s, i) => (
              <RailItem
                key={s.node.id}
                step={s}
                index={i}
                active={currentSectionId === s.node.id}
                count={countForStep(s.node)}
                onPress={() => scrollToSection(s.node.id)}
              />
            ))}
          </View>

          {/* Scroll area and footer share the column, so the CTA sits on
              a surface of its own instead of hovering over the cards. */}
          <View style={styles.mainCol}>
            <ScrollView
              ref={scrollRef}
              style={styles.mainScroll}
              contentContainerStyle={styles.mainColContent}
              onScroll={onWideScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              onLayout={e => {
                wideViewportRef.current = e.nativeEvent.layout.height;
                recomputeTail();
              }}
            >
              {steps.map(step => (
                <View
                  key={step.node.id}
                  style={styles.section}
                  onLayout={e => onSectionLayout(
                    step.node.id,
                    e.nativeEvent.layout.y,
                    e.nativeEvent.layout.height,
                  )}
                >
                  <View style={styles.stepHeader}>
                    <View style={[styles.stepBar, { backgroundColor: step.accent.strong }]} />
                    <Text style={styles.stepTitle}>{step.node.title}</Text>
                    <Text style={styles.stepSub}>
                      {countForStep(step.node)} sélection
                      {countForStep(step.node) > 1 ? 's' : ''}
                    </Text>
                  </View>
                  {renderNodes(step)}
                </View>
              ))}

              <View style={{ height: tailSpace }} />
            </ScrollView>

            <View style={styles.wideFooter}>
              <View style={styles.wideFooterInner}>
                <TouchableOpacity
                  style={[styles.cta, styles.ctaWide, productCount === 0 && styles.ctaDisabled,
                    productCount === 0 ? notAllowed : clickable]}
                  onPress={handleViewProducts}
                  disabled={productCount === 0}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.ctaText, productCount === 0 && styles.ctaTextDisabled]}>
                    {ctaLabel}
                  </Text>
                  {productCount > 0 && <Ionicons name="arrow-forward" size={20} color="#fff" />}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ) : (
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

            {activeStep && renderNodes(activeStep)}
          </ScrollView>

          <View style={styles.floatBar} pointerEvents="box-none">
            <TouchableOpacity
              style={[styles.cta, productCount === 0 && styles.ctaDisabled,
                productCount === 0 ? notAllowed : clickable]}
              onPress={handleViewProducts}
              disabled={productCount === 0}
              activeOpacity={0.85}
            >
              <Text style={[styles.ctaText, productCount === 0 && styles.ctaTextDisabled]}>
                {ctaLabel}
              </Text>
              {productCount > 0 && <Ionicons name="arrow-forward" size={22} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <SearchFilterModal
        visible={searchOpen}
        allNodes={rules}
        selections={selections}
        onClose={() => setSearchOpen(false)}
        onSelect={handleToggle}
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
        message="Vos sélections seront perdues."
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
    </View>
  );
};

// ============================================================
// Rail
// ============================================================

function RailItem({
  step, index, active, count, onPress,
}: {
  step: Step;
  index: number;
  active: boolean;
  count: number;
  onPress: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={[
        styles.railItem,
        clickable,
        smoothTint,
        (active || hover) && { backgroundColor: step.accent.soft },
        active && { borderLeftColor: step.accent.strong },
      ]}
    >
      <Ionicons
        name={active ? step.icon : step.iconOutline}
        size={19}
        color={active ? step.accent.strong : palette.textSecondary}
      />
      <View style={styles.railLabels}>
        <Text
          numberOfLines={2}
          style={[styles.railLabel, active && { color: palette.textPrimary, fontFamily: 'Poppins-Medium' }]}
        >
          {step.node.title}
        </Text>
        <Text style={styles.railMeta}>
          {count > 0 ? `${count} sélection${count > 1 ? 's' : ''}` : 'À renseigner'}
        </Text>
      </View>
      {count > 0 && (
        <View style={[styles.railBadge, { backgroundColor: step.accent.strong }]}>
          <Text style={styles.railBadgeText}>{count}</Text>
        </View>
      )}
      {/* index kept so the rail can show ordering if the funnel ever
          becomes a strict sequence again */}
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ display: 'none' }}>
        <Text>{index}</Text>
      </View>
    </Pressable>
  );
}

// ============================================================
// Cards
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
  node, gate, allNodes, ownership, steps, isWide, onJump,
}: {
  node: MainNode;
  gate: { state: 'locked'; total: number; satisfied: number; missing: string[] };
  allNodes: MainNode[];
  ownership: Map<string, string>;
  steps: Step[];
  isWide: boolean;
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
          <Pressable
            style={[styles.locked, clickable]}
            key={'locked' + nid}
            onPress={() => onJump(nid)}
          >
            <View style={styles.cardHead}>
              <Ionicons name="lock-closed" size={15} color={palette.textMuted} />
              <Text style={styles.lockedTitle}>{node.title}</Text>
            </View>
            <View style={[styles.hint, { borderColor: ownerStep?.accent.strong ?? palette.border }]}>
              <Ionicons
                // On web every step is on screen, so the arrow points up
                // the page rather than back through a wizard.
                name={isWide ? 'arrow-up' : (nid === 'path_type' ? 'arrow-up' : 'arrow-back')}
                size={21}
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
  const [hover, setHover] = useState(false);
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

  const showInfo = hasMemo && isLoading;
  const infoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // react-native-web has no native animated module; passing true here
    // only produces a warning and falls back to JS anyway.
    Animated.spring(infoAnim, {
      toValue: showInfo ? 1 : 0,
      useNativeDriver: false,
      speed: 14,
      bounciness: 10,
    }).start();
  }, [showInfo, infoAnim]);

  const infoScale = infoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <Animated.View style={[styles.pillWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onHoverIn={() => setHover(true)}
        onHoverOut={() => setHover(false)}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: false, speed: 50, bounciness: 0 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: false, speed: 30, bounciness: 10 }).start()}
        style={[
          styles.pill,
          clickable,
          selected
            ? { backgroundColor: accent.strong, borderColor: accent.strong }
            : { backgroundColor: accent.soft, borderColor: hover ? accent.strong : 'transparent' },
          hover && !selected && { borderWidth: 1 },
          hover && selected && { opacity: 0.88 },
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
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      style={[
        styles.headerBtn,
        disabled ? [styles.headerBtnDisabled, notAllowed] : clickable,
        !disabled && hover && styles.headerBtnHover,
      ]}
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      disabled={disabled}
    >
      {icon}
      <Text style={[styles.headerBtnLabel, disabled && styles.headerBtnLabelDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ============================================================
// Deep-link / scan helpers
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
  root: { flex: 1, backgroundColor: palette.bg, minHeight: '100%' as any },

  // ---- top bar ----
  topBar: {
    backgroundColor: palette.cardBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
    zIndex: 10,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 12,
    gap: 24,
  },
  topBarInnerNarrow: { paddingHorizontal: 20 },
  titleBlock: { flex: 1 },
  eyebrow: {
    fontSize: 15,
    fontFamily: 'Roboto',
    fontWeight: '400',
    letterSpacing: 1.2,
    color: palette.textMuted,
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: 0.2,
    fontFamily: 'Poppins-Bold',
    color: palette.textPrimary,
  },
  headerActions: { flexDirection: 'row', alignItems: 'stretch' },
  headerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 58,
  },
  headerBtnHover: { backgroundColor: palette.bg },
  headerBtnDisabled: { opacity: 0.45 },
  headerBtnLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: palette.textPrimary,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  headerBtnLabelDisabled: { color: palette.textMuted },
  headerDivider: { width: 1, backgroundColor: palette.border, marginVertical: 8 },
  headerSpacer: { height: 31 },
  tabsOverlap: { marginTop: -31 },

  // ---- wide layout ----
  wideBody: { flex: 1, flexDirection: 'row', minHeight: 0 },
  rail: {
    width: RAIL_WIDTH,
    paddingVertical: 22,
    paddingHorizontal: 12,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: palette.border,
    backgroundColor: palette.cardBg,
    gap: 4,
  },
  railHeading: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: palette.textMuted,
    letterSpacing: 0.4,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  railItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  railLabels: { flex: 1 },
  railLabel: {
    fontSize: 13.5,
    fontFamily: 'Poppins-Regular',
    color: palette.textSecondary,
    letterSpacing: 0.2,
  },
  railMeta: {
    fontSize: 11,
    fontFamily: 'Roboto',
    color: palette.textMuted,
    marginTop: 2,
  },
  railBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
  },

  mainCol: { flex: 1, minHeight: 0 },
  mainScroll: { flex: 1 },
  mainColContent: {
    paddingTop: 26,
    paddingBottom: 32,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  section: { width: '100%', maxWidth: COLUMN_MAX, marginBottom: 34 },
  wideFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    backgroundColor: palette.cardBg,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  wideFooterInner: {
    width: '100%',
    maxWidth: COLUMN_MAX,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ---- narrow layout ----
  body: { flex: 1 },
  bodyWrap: { flex: 1, backgroundColor: palette.bg },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 160,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 680,
  },

  // ---- steps & cards ----
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  stepBar: { width: 3, height: 34 },
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
    letterSpacing: 0.3,
  },

  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 10,
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
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginBottom: 10,
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

  pills: { flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 4 },
  pillWrap: { paddingTop: 9, paddingRight: 9 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 14,
    fontFamily: 'Roboto',
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  infoBtnWrap: { position: 'absolute', top: 0, right: 0 },
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
  },
  infoSpinner: { transform: [{ scale: 0.7 }] },

  // ---- CTA ----
  floatBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: 680,
    width: '100%',
    gap: 9,
  },
  cta: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: palette.textPrimary,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
  },
  ctaWide: { paddingVertical: 13, shadowOpacity: 0.14, shadowRadius: 8 },
  ctaDisabled: { backgroundColor: '#E5E7EB', shadowOpacity: 0 },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  ctaTextDisabled: { fontFamily: 'Poppins-Medium', color: '#9CA3AF', fontWeight: '600' },
});