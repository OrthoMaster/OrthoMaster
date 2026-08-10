import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import {
  ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { getPathologySummary } from '../../../services/v2/ProductService';
import { palette } from '../lib/Theme';
import { MarkdownText } from './MarkdownText';

type Props = {
  visible: boolean;
  // db_id from the rules.json child. Null → nothing to fetch.
  dbId?: string | null;
  // Fallback heading. The API row has `code` and `segment` but no title,
  // so the child's own label is what the user actually recognises.
  fallbackTitle: string;
  onClose: () => void;
};

export function PathologySummaryModal({ visible, dbId, fallbackTitle, onClose }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['pathology-summary', dbId],
    queryFn: () => getPathologySummary(dbId as string),
    enabled: visible && !!dbId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const hasContent = !!data?.content && data.content.trim() !== '';
  const heading = data?.title?.trim() || fallbackTitle;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Header — segment sits above the title as an eyebrow chip */}
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <Ionicons name="information" size={17} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              {!!data?.segment && (
                <View style={styles.segmentChip}>
                  <Text style={styles.segmentText}>{data.segment}</Text>
                </View>
              )}
              <Text style={styles.title} numberOfLines={3}>{heading}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={palette.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Body */}
          {isLoading ? (
            <View style={styles.state}>
              <ActivityIndicator size="small" color={palette.fabBg} />
              <Text style={styles.stateText}>Chargement de la fiche …</Text>
            </View>
          ) : isError ? (
            <View style={styles.state}>
              <Ionicons name="cloud-offline-outline" size={30} color={palette.textMuted} />
              <Text style={styles.stateText}>Impossible de charger la fiche.</Text>
            </View>
          ) : !hasContent ? (
            <View style={styles.state}>
              <Ionicons name="document-outline" size={30} color={palette.textMuted} />
              <Text style={styles.stateText}>Aucune information disponible pour cette pathologie.</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={{ paddingBottom: 8 }}
              showsVerticalScrollIndicator={true}
              indicatorStyle="black"
            >
              <MarkdownText content={data!.content} />
            </ScrollView>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeText}>Fermer</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 45, 66, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  card: {
    backgroundColor: palette.cardBg,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    maxHeight: '82%',
    // Without this the card refuses to honour its own maxHeight when
    // the markdown body is long.
    flexShrink: 1,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBadge: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#3b76ba',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
    shadowColor: '#2C5687',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 3.5,
    elevation: 4,
  },
  segmentChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3EDF8',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginBottom: 6,
  },
  segmentText: {
    fontSize: 10.5,
    fontFamily: 'Poppins-Medium',
    color: '#2C5687',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16, fontFamily: 'Poppins-Bold',
    color: '#2C5687', letterSpacing: -0.2, lineHeight: 21,
  },
  divider: { height: 1, backgroundColor: palette.border, marginTop: 14, marginBottom: 12 },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  state: { alignItems: 'center', paddingVertical: 30, gap: 10 },
  stateText: {
    fontSize: 13, color: palette.textSecondary,
    textAlign: 'center', paddingHorizontal: 20, lineHeight: 19,
  },
  closeBtn: {
    marginTop: 14,
    backgroundColor: '#3b76ba',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#2C5687',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  closeText: {
    color: '#FFFFFF', fontSize: 15,
    fontWeight: '700', letterSpacing: -0.2,
  },
});