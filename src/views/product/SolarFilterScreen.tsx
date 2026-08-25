import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AntDesign, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import {
  StatusBar, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { CameraScannerModal } from './components/CameraScannerModal';
import { OptionsSheet } from './components/OptionsSheet';
import { PlanetBody } from './components/PlanetBody';
import { SearchFilterModal } from './components/SearchFilterModal';
import { Sun } from './components/Sun';

import { isNodeVisible, MainNode, Selections, toggleSelection } from './lib/Logic';
import { computeOrbitLayout, PlanetLayout, tickOrbits } from './lib/OrbitLayout';
import { accentForIndex, palette } from './lib/Theme';

import { countFilteredProducts, getProtocols, getRules, Protocol } from '../../services/v2/ProductService';

// Flatten Selections (nodeId → childId[]) to a flat list of childIds.
// The backend expands parents itself based on rules.json.
function flattenSelections(selections: Selections): string[] {
  return Object.values(selections).flat();
}

// Build the default selection state from a rules array: every multi root
// node has ALL its children pre-selected. This unlocks dependent nodes
// (e.g. selecting all Patient indicators reveals Type / Âge / Activité)
// so the user can fill them in without having to first activate the
// indicator group.
//
// Root = no visibilityRule. Multi = selectionType === 'multi'.
function buildDefaultSelections(nodes: MainNode[]): Selections {
  const result: Selections = {};
  for (const node of nodes) {
    if (node.visibilityRule == null && node.selectionType === 'multi') {
      result[node.id] = node.children.map(c => c.id);
    }
  }
  return result;
}

export const SolarFilterScreen = ({ navigation, route }: any) => {
  // Rules tree from backend. Empty array while loading so the rest of
  // the component renders harmlessly with no planets.
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

  useEffect(() => {
    const paramSels = route?.params?.selections as Selections | undefined;
    if (paramSels && typeof paramSels === 'object' && Object.keys(paramSels).length > 0) {
      setSelections(paramSels);
    }
  }, [route?.params?.selections]);

  const [selections, setSelections] = useState<Selections>({});
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [canvas, setCanvas] = useState({ w: 0, h: 0 });
  const [tickFrame, setTickFrame] = useState(0);
  const startRef = useRef<number>(Date.now());

  // Live product count from backend. Starts at 0 until first fetch.
  const [productCount, setProductCount] = useState<number>(0);

  // Apply defaults once rules arrive. We delay this until rules.length > 0
  // because buildDefaultSelections() over an empty tree returns {}, which
  // would later be overwritten — but in the meantime the auto-open effect
  // might fire and immediately re-set state, causing flicker. Guarding on
  // a `didInitDefaults` ref keeps the dance simple.
  const didInitDefaultsRef = useRef(false);
  useEffect(() => {
    if (didInitDefaultsRef.current) return;
    if (rules.length === 0) return;
    didInitDefaultsRef.current = true;

    // Skip defaults when the screen mounted with a scan-restored
    // selection set (from CommonActions.reset in handleScanned).
    // Otherwise defaults would clobber the scanned filters right after
    // the restore effect above put them in place.
    const paramSels = route?.params?.selections as Selections | undefined;
    if (paramSels && typeof paramSels === 'object' && Object.keys(paramSels).length > 0) {
      return;
    }

    setSelections(buildDefaultSelections(rules));
  }, [rules, route?.params?.selections]);

  // Only ROOT nodes become planets. Conditional/linked nodes surface in
  // the bottom sheet of their parent planet, never on canvas.
  const rootNodes = useMemo(
    () => rules.filter(n => n.visibilityRule == null),
    [rules],
  );

  // Layout depends only on canvas + root list.
  const baseLayout = useMemo(() => {
    if (!canvas.w || !canvas.h) return null;
    if (rootNodes.length === 0) return null;
    return computeOrbitLayout({
      nodes: rootNodes,
      width: canvas.w,
      height: canvas.h,
    });
  }, [rootNodes, canvas.w, canvas.h]);

  // Frame-mutable copy
  const liveLayoutRef = useRef<typeof baseLayout>(null);
  useEffect(() => {
    if (!baseLayout) {
      liveLayoutRef.current = null;
      return;
    }
    const copy = new Map<string, PlanetLayout>();
    baseLayout.planets.forEach((p, k) => copy.set(k, { ...p }));
    liveLayoutRef.current = {
      sunX: baseLayout.sunX,
      sunY: baseLayout.sunY,
      sunRadius: baseLayout.sunRadius,
      width: baseLayout.width,
      height: baseLayout.height,
      planets: copy,
    };
    startRef.current = Date.now();
  }, [baseLayout]);

  // RAF loop
  useEffect(() => {
    if (!baseLayout) return;
    let raf: number;
    let lastTime = Date.now();
    const loop = () => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const elapsed = (now - startRef.current) / 1000;
      if (liveLayoutRef.current) {
        tickOrbits(liveLayoutRef.current, elapsed, dt);
        setTickFrame(f => (f + 1) % 1000000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [baseLayout]);

  // Fetch product count whenever selections change.
  // Debounced 300ms to avoid spamming the backend while the user is
  // tapping pills rapidly. Race-safe via a request counter — only the
  // latest fetch is allowed to update state.
  const fetchSeqRef = useRef(0);
  useEffect(() => {
    const mySeq = ++fetchSeqRef.current;
    const flat = flattenSelections(selections);

    const timer = setTimeout(async () => {
      const count = await countFilteredProducts(flat);
      // Drop stale responses: only the latest call wins
      if (mySeq !== fetchSeqRef.current) return;
      setProductCount(typeof count === 'number' ? count : 0);
    }, 300);

    return () => clearTimeout(timer);
  }, [selections]);

  // ---------- handlers ----------
  const handlePlanetPress = useCallback((nodeId: string) => {
    setActiveNodeId(nodeId);
  }, []);

  const handleToggle = useCallback((nodeId: string, childId: string) => {
    setSelections(prev => toggleSelection(rules, prev, nodeId, childId));
  }, [rules]);

  const handleReset = useCallback(() => {
    setSelections(buildDefaultSelections(rules));
  }, [rules]);

  const handleScanned = useCallback((url: string) => {
    setScannerOpen(false);

    const { filters: flatFilters, groupId } = parseScannedUrl(url);
    if (flatFilters.length === 0 && !groupId) return;

    const scannedSelections = flatToSelections(flatFilters, rules);

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
      { name: 'new-que-choisir', params: { selections: scannedSelections } },
    ];

    if (protocolId) {
      routes.push({
        name: 'protocol-view',
        params: { selections: scannedSelections, protocolId },
      });
    }

    routes.push({
      name: 'products-view',
      params: {
        selections: scannedSelections,
        groupId: groupId || undefined,
        groupLabel: groupLabel || undefined,
      },
    });

    navigation.dispatch(
      CommonActions.reset({
        index: routes.length - 1,
        routes,
      }),
    );
  }, [navigation, rules, protocols]);

  const didAutoOpenRef = useRef(false);

  // Listen for `reset` flag from ProductsScreen (set when user clicks
  // "Reset filters" in the summary modal there).
  useEffect(() => {
    if (route?.params?.reset) {
      setSelections(buildDefaultSelections(rules));
      didAutoOpenRef.current = false;        // allow auto-open again
      // Clear the param so it doesn't re-trigger on next focus
      navigation.setParams({ reset: undefined });
    }
  }, [route?.params?.reset, navigation, rules]);

  // Cycle to next planet — wraps around to first when at the end.
  const handleNextPlanet = useCallback(() => {
    if (rootNodes.length === 0) return;
    const currentIdx = activeNodeId
      ? rootNodes.findIndex(n => n.id === activeNodeId)
      : -1;
    const nextIdx = (currentIdx + 1) % rootNodes.length;
    setActiveNodeId(rootNodes[nextIdx].id);
  }, [activeNodeId, rootNodes]);

  // Auto-open the first planet's sheet on mount, once layout is ready.
  // We wait for layout so we have a defined active accent / sheet target.
  useEffect(() => {
    if (didAutoOpenRef.current) return;
    if (!baseLayout) return;
    if (rootNodes.length === 0) return;
    didAutoOpenRef.current = true;

    // Don't auto-open on scan restore — the user is coming from a QR
    // flow that already navigated to Products/Protocol; opening the
    // sheet here would pop unexpectedly when they back-navigate.
    const paramSels = route?.params?.selections as Selections | undefined;
    if (paramSels && typeof paramSels === 'object' && Object.keys(paramSels).length > 0) {
      return;
    }

    // setActiveNodeId(rootNodes[0].id);
  }, [baseLayout, rootNodes, route?.params?.selections]);

  const handleViewProducts = useCallback(() => {
    // If any selected pathology child has a protocolId, show the
    // treatment-protocol screen (phases + groups). Tapping a filter
    // group from there lands on products-view with the group filter
    // applied. Without a protocolId, we go straight to products as
    // before.
    const protocolId = resolveProtocolId(selections, rules);
    if (protocolId) {
      navigation.navigate('protocol-view', { selections, protocolId });
      return;
    }
    navigation.navigate('products-view', { selections });
  }, [navigation, selections, rules]);

  // Open the first planet's sheet — used both by the header "Commencer"
  // button and the filter icon next to the disabled "no products" button.
  const handleOpenFirstNode = useCallback(() => {
    if (rootNodes[0]) setActiveNodeId(rootNodes[0].id);
  }, [rootNodes]);

  // Sun tap → same action as the View Products bottom button, but only
  // when there are products to show. When there's nothing, the tap is
  // a no-op (Sun is visually dim anyway, signaling "not actionable").
  const handleSunPress = useCallback(() => {
    if (productCount > 0) {
      handleViewProducts();
    }
  }, [productCount, handleViewProducts]);

  // ---------- derived ----------
  const activeNode = activeNodeId
    ? rules.find(n => n.id === activeNodeId) || null
    : null;
  const activeAccent = activeNode
    ? accentForIndex(rootNodes.indexOf(activeNode))
    : null;


  // Count selections WITHOUT root-node options. Root multi indicators
  // (like Patient) are auto-selected on init and don't represent a real
  // user choice — only sub-node values (Homme, 15-25, Modéré, etc.) should
  // bump this number. Used for header / footer button enabling.
  const totalSelected = useMemo(() => {
    let count = 0;
    for (const [nodeId, arr] of Object.entries(selections)) {
      const node = rules.find(n => n.id === nodeId);
      if (!node) continue;
      if (node.visibilityRule == null) continue;   // root — skip
      count += arr.length;
    }
    return count;
  }, [selections, rules]);

  // Build the list of selected labels per planet:
  //   - multi-select planet (indicator like "Patient"): show ALL leaf values
  //     from linked nodes (each becomes a chip)
  //   - single-select planet: show ONLY the label from the deepest linked
  //     node that has a selection. The user picked a chain (Zone → Segment →
  //     Localisation → ...) and only the most-specific value is meaningful.
  //   - plain root (no linked nodes): show its own selected label
  const selectedLabelsForPlanet = (planet: MainNode): string[] => {
    const isIndicator = planet.selectionType === 'multi';

    // Pre-compute valid parent overrides. A node's parentNodeId is honored
    // only if it points at an existing root node (no visibilityRule);
    // otherwise it's silently ignored and BFS fallback applies.
    const rootIds = new Set(
      rules.filter(n => n.visibilityRule == null).map(n => n.id),
    );
    const effectiveParent = new Map<string, string>();
    for (const n of rules) {
      const p = (n as any).parentNodeId;
      if (typeof p === 'string' && p !== '' && rootIds.has(p)) {
        effectiveParent.set(n.id, p);
      }
    }

    const collectLinked = (root: MainNode): MainNode[] => {
      const result: MainNode[] = [];
      const inResult = new Set<string>([root.id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const n of rules) {
          if (inResult.has(n.id)) continue;
          if (!isNodeVisible(n, selections)) continue;

          // Parent override wins over BFS. If override points at a
          // different planet, skip — this node will never appear here.
          const override = effectiveParent.get(n.id);
          if (override !== undefined) {
            if (override === root.id) {
              result.push(n);
              inResult.add(n.id);
              changed = true;
            }
            continue;
          }

          // No override → default BFS by rule reference.
          if (refsAnyOf(n.visibilityRule, inResult)) {
            result.push(n);
            inResult.add(n.id);
            changed = true;
          }
        }
      }
      return result;
    };

    if (isIndicator) {
      const labels: string[] = [];
      collectLinked(planet).forEach(n => {
        const sels = selections[n.id] || [];
        sels.forEach(s => {
          const child = n.children.find(c => c.id === s);
          if (child) labels.push(child.label);
        });
      });
      return labels;
    } else {
      const linked = collectLinked(planet);
      for (let i = linked.length - 1; i >= 0; i--) {
        const n = linked[i];
        const sels = selections[n.id] || [];
        if (sels.length > 0) {
          const child = n.children.find(c => c.id === sels[0]);
          if (child) return [child.label];
        }
      }
      const ownSels = selections[planet.id] || [];
      if (ownSels.length > 0) {
        const child = planet.children.find(c => c.id === ownSels[0]);
        if (child) return [child.label];
      }
      return [];
    }
  };

  const refsAnyOf = (rule: any, set: Set<string>): boolean => {
    if (!rule) return false;
    if ('kind' in rule) {
      if (rule.kind === 'selected' || rule.kind === 'any_selected') {
        return set.has(rule.nodeId);
      }
      return false;
    }
    if ('op' in rule) {
      if (rule.op === 'AND' || rule.op === 'OR') {
        return rule.rules.some((r: any) => refsAnyOf(r, set));
      }
      if (rule.op === 'NOT') return refsAnyOf(rule.rule, set);
    }
    return false;
  };

  // Check whether a planet has some selections but not all of its
  // reachable filter nodes are filled. Used to surface a "!" badge on
  // the sphere signalling "you can add more filters here".
  //
  // Semantics:
  //   - single-select root planet: root itself + linked visible nodes count
  //   - multi-select (indicator) root: only linked visible nodes count.
  //     The root's own children are auto-selected defaults and don't
  //     represent a user choice, so we don't ask "did they fill it"
  //   - a node with no linked visible neighbours is considered fully
  //     filled once it has a selection — no badge in that case
  //
  // Duplicates the BFS from selectedLabelsForPlanet inline; keeping
  // them separate is easier than lifting a shared helper for now.
  const planetPartiallyFilled = (planet: MainNode): boolean => {
    const rootIds = new Set(
      rules.filter(n => n.visibilityRule == null).map(n => n.id),
    );
    const effectiveParent = new Map<string, string>();
    for (const n of rules) {
      const p = (n as any).parentNodeId;
      if (typeof p === 'string' && p !== '' && rootIds.has(p)) {
        effectiveParent.set(n.id, p);
      }
    }

    const linked: MainNode[] = [];
    const inResult = new Set<string>([planet.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const n of rules) {
        if (inResult.has(n.id)) continue;
        if (!isNodeVisible(n, selections)) continue;

        const override = effectiveParent.get(n.id);
        if (override !== undefined) {
          if (override === planet.id) {
            linked.push(n);
            inResult.add(n.id);
            changed = true;
          }
          continue;
        }

        if (refsAnyOf(n.visibilityRule, inResult)) {
          linked.push(n);
          inResult.add(n.id);
          changed = true;
        }
      }
    }

    const requireInput: MainNode[] =
      planet.selectionType === 'single' ? [planet, ...linked] : linked;
    if (requireInput.length === 0) return false;

    let hasFilled = false;
    let hasEmpty = false;
    for (const n of requireInput) {
      const filled = (selections[n.id]?.length ?? 0) > 0;
      if (filled) hasFilled = true;
      else hasEmpty = true;
      if (hasFilled && hasEmpty) return true;
    }
    return false;
  };

  const planetHasSelection = (planet: MainNode): boolean => {
    if ((selections[planet.id]?.length || 0) > 0) {
      if (planet.selectionType === 'multi') {
        return rules.some(n => {
          if (n.id === planet.id) return false;
          if (!ruleReferences(n.visibilityRule, planet.id)) return false;
          return (selections[n.id]?.length || 0) > 0;
        });
      }
      return true;
    }
    return false;
  };

  const layout = liveLayoutRef.current || baseLayout;
  const sunIsLit = productCount > 0;

  // ---------- render ----------
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.bg} />
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Que Choisir</Text>
            <Text style={styles.title}>Médicaux Orthopédiques</Text>
          </View>

          {/* Right-side action group: 3 stacked-icon buttons separated by
              vertical dividers. Order (left → right): keywords, scanner,
              clear. Clear is only active when there are selections. */}
          <View style={styles.headerActions}>
            <HeaderIconButton
              label="Mots-clés"
              icon={<Ionicons name="search" size={20} color={palette.textPrimary} />}
              onPress={() => setSearchOpen(true)}
            />
            <View style={styles.headerDivider} />
            <HeaderIconButton
              label="Scanner"
              icon={<MaterialCommunityIcons name="qrcode-scan" size={20} color={palette.textPrimary} />}
              onPress={() => setScannerOpen(true)}
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
              onPress={handleReset}
              disabled={totalSelected === 0}
            />
          </View>
        </View>

        {/* Canvas — top section */}
        <View
          style={styles.canvas}
          onLayout={e => {
            const { width, height } = e.nativeEvent.layout;
            if (width !== canvas.w || height !== canvas.h) {
              setCanvas({ w: width, h: height });
            }
          }}
        >
          {layout && (
            <>
              {/* Sun first (background obstacle), then all planets on top.
                  No more occlusion logic — planets can't go behind the sun
                  because they bounce off it.
                  When products are available, tapping the sun navigates to
                  the products list (same as the bottom Voir button). */}
              <Sun
                x={layout.sunX}
                y={layout.sunY}
                radius={layout.sunRadius}
                count={productCount}
                isLit={sunIsLit}
                showCount={totalSelected > 0}
                onPress={productCount > 0 ? handleSunPress : undefined}
              />

              {[...layout.planets.values()].map(p => {
                const node = rootNodes.find(n => n.id === p.nodeId);
                if (!node) return null;
                const accent = accentForIndex(rootNodes.indexOf(node));
                return (
                  <PlanetBody
                    key={node.id}
                    cx={p.cx}
                    cy={p.cy}
                    size={p.size}
                    zDepth={p.zDepth}
                    nodeId={node.id}
                    title={node.title}
                    selectedLabels={selectedLabelsForPlanet(node)}
                    isActive={activeNodeId === node.id}
                    hasSelection={planetHasSelection(node)}
                    hasMoreToChoose={planetPartiallyFilled(node)}
                    accent={accent}
                    onPress={() => handlePlanetPress(node.id)}
                  />
                );
              })}
            </>
          )}
        </View>

        {/* Action area — bottom section */}
        <View style={styles.actionArea}>
          <View style={styles.actionRow}>
            {totalSelected > 0 ? (
              <>
                {productCount === 0 && (
                  <TouchableOpacity
                    style={styles.filterIconBtn}
                    onPress={handleOpenFirstNode}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="filter-plus-outline" size={22} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.viewProductsBtn,
                    productCount === 0 && styles.viewProductsBtnDisabled,
                  ]}
                  onPress={handleViewProducts}
                  disabled={productCount === 0}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.viewProductsText,
                      productCount === 0 && styles.viewProductsTextDisabled,
                    ]}
                  >
                    {productCount === 0
                      ? 'Aucun produit ne correspond'
                      : `Voir ${productCount} produit${productCount > 1 ? 's' : ''}`}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.viewProductsBtn}
                onPress={handleOpenFirstNode}
                activeOpacity={0.85}
              >
                <Text style={styles.viewProductsText}>Commencer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <OptionsSheet
        visible={!!activeNode}
        rootNode={activeNode}
        allNodes={rules}
        selections={selections}
        accent={activeAccent}
        onClose={() => setActiveNodeId(null)}
        onToggle={handleToggle}
        onNext={handleNextPlanet}
      />

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
    </SafeAreaView>
  );
}

// Helper duplicated from OptionsSheet (kept local to avoid extra import file)
function ruleReferences(rule: any, targetId: string): boolean {
  if (!rule) return false;
  if ('kind' in rule) return rule.nodeId === targetId;
  if ('op' in rule) {
    if (rule.op === 'AND' || rule.op === 'OR') {
      return rule.rules.some((r: any) => ruleReferences(r, targetId));
    }
    if (rule.op === 'NOT') return ruleReferences(rule.rule, targetId);
  }
  return false;
}

// Walk all selected child ids and return the first protocolId found,
// or null if no selection triggers a protocol. Pathology selection in
// rules.json is single-select per node, so this should match at most
// once in practice — we still iterate defensively in case the schema
// evolves to allow more than one trigger.
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

// Stacked-icon header button: icon on top, label underneath, no border.
// Used in the right-side action group; vertical dividers are rendered by
// the parent View between buttons.
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

// Rebuild a Selections object from a flat list of child ids. Missing
// / unknown ids are dropped. Used by the QR scan flow to reconstruct
// the filter state from the encoded URL.
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

// Pull `filters` (CSV) and `group` (single id) query params out of a
// scanned URL. Tolerant of malformed input.
function parseScannedUrl(url: string): {
  filters: string[];
  groupId: string | null;
} {
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

// Find which protocol contains a given filter group id.
function protocolForGroup(
  protocols: Protocol[],
  groupId: string,
): { protocolId: string; groupLabel: string } | null {
  for (const p of protocols) {
    for (const ph of p.phases) {
      for (const g of ph.groups) {
        if (g.id === groupId) {
          return { protocolId: p.id, groupLabel: g.label };
        }
      }
    }
  }
  return null;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  header: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1.6,
    color: palette.textMuted,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: -0.4,
  },

  // Right-side action group in header — 3 icon+label buttons separated
  // by vertical dividers.
  headerActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  headerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 56,
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
  },
  headerBtnLabelDisabled: {
    color: palette.textMuted,
  },
  headerDivider: {
    width: 1,
    backgroundColor: palette.border,
    marginVertical: 6,
  },
  canvas: {
    flex: 1,
    overflow: 'hidden',
  },
  actionArea: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.cardBg,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  viewProductsBtn: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  viewProductsBtnDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  viewProductsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  viewProductsTextDisabled: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  filterIconBtn: {
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    width: 50,
  },
});