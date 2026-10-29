import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

import { BouncingDots } from '../../../component/LoadingDots';
import { useFloatingTabBarInset } from '../../../component/booking/FloatingTabBar';
import { ChatConversation, getConversations } from '../../../services/v2/BookingService';
import { ExpertAvatar } from '../components/ExpertAvatar';
import { CHAT_BLUE, CHAT_UNREAD_KEY, CONVERSATIONS_KEY, listTime, otherName } from './chatFormat';

const AVATAR = 56;
/** Relève de la liste tant qu'elle est affichée : un nouveau message remonte son fil. */
const POLL_MS = 15000;

/**
 * Liste des conversations, à la manière de Messenger (sans recherche) :
 * avatar, nom, aperçu du dernier message et heure ; fil non lu en gras avec un point bleu.
 * Les deux rôles dans la même liste : un expert voit ses demandeurs et les experts qu'il a contactés.
 */
export const ConversationsView = ({ navigation }) => {
  const bottomInset = useFloatingTabBarInset();
  const queryClient = useQueryClient();
  const [focused, setFocused] = useState(false);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: async ({ pageParam }) => {
      const result = await getConversations(pageParam);
      if (!result) throw new Error('conversations');
      return result;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.current_page < last.last_page ? last.current_page + 1 : undefined),
    refetchInterval: focused ? POLL_MS : false,
  });

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      refetch();
      queryClient.invalidateQueries({ queryKey: CHAT_UNREAD_KEY });
      return () => setFocused(false);
    }, [refetch])
  );

  const [pulling, setPulling] = useState(false);
  const pullToRefresh = async () => {
    setPulling(true);
    try {
      await refetch();
    } finally {
      setPulling(false);
    }
  };

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  const open = (conversation: ChatConversation) =>
    navigation.navigate('conversation', { conversationId: conversation.id, preview: conversation });

  const renderItem = ({ item }: { item: ChatConversation }) => {
    const unread = item.unread > 0;
    const name = otherName(item);
    const last = item.last_message;
    const preview = last ? (last.mine ? `Vous : ${last.body}` : last.body) : 'Aucun message';

    return (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => open(item)}
        accessibilityRole="button"
        accessibilityLabel={`${name}${unread ? `, ${item.unread} non lu${item.unread > 1 ? 's' : ''}` : ''}`}
      >
        <ExpertAvatar
          uri={item.role === 'guest' ? item.expert?.avatar_url ?? null : null}
          name={name}
          size={AVATAR}
          ringWidth={0}
          fillColor={item.role === 'guest' ? Colors.lblue3 : Colors.purple3}
          initialsColor={item.role === 'guest' ? Colors.lblueDark : Colors.purpleDark}
        />

        <View style={styles.body}>
          <Text style={[styles.name, unread && styles.strong]} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.previewRow}>
            <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
              {preview}
            </Text>
            {last?.created_at ? (
              <Text style={[styles.time, unread && styles.previewUnread]} numberOfLines={1}>
                {' · '}
                {listTime(last.created_at)}
              </Text>
            ) : null}
          </View>
        </View>

        {unread ? <View style={styles.dot} /> : null}
      </Pressable>
    );
  };

  const empty = isLoading ? (
    <View style={styles.state}>
      <BouncingDots color={CHAT_BLUE} size={10} bounceHeight={5} />
    </View>
  ) : (
    <View style={styles.state}>
      <View style={styles.medallion}>
        <Ionicons name={isError ? 'cloud-offline-outline' : 'chatbubbles-outline'} size={40} color={CHAT_BLUE} />
      </View>
      <Text style={styles.stateTitle}>{isError ? 'Chargement impossible' : 'Aucune conversation'}</Text>
      <Text style={styles.stateText}>
        {isError
          ? 'Vérifiez votre connexion, puis tirez vers le bas pour réessayer.'
          : "Depuis la fiche d'un thème, touchez « Échanger avec l'expert » pour lui poser vos questions."}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={<Text style={styles.title}>Messages</Text>}
        ListEmptyComponent={empty}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.more}>
              <BouncingDots color={CHAT_BLUE} size={8} bounceHeight={4} />
            </View>
          ) : null
        }
        onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
        onEndReachedThreshold={0.4}
        contentContainerStyle={{ paddingBottom: bottomInset + Spacings.md }}
        scrollIndicatorInsets={{ bottom: bottomInset }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={pulling} onRefresh={pullToRefresh} colors={[CHAT_BLUE]} tintColor={CHAT_BLUE} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 30,
    lineHeight: 38,
    color: Colors.text,
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.lg,
    paddingBottom: Spacings.sm,
  },

  /* ---- Ligne ---- */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.xs,
  },
  rowPressed: {
    backgroundColor: Colors.grayLight,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: Colors.text,
  },
  strong: {
    fontFamily: 'Poppins-Bold',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preview: {
    flexShrink: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.subtext,
  },
  previewUnread: {
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
  },
  // Heure jamais coupée : c'est l'aperçu qui raccourcit.
  time: {
    flexShrink: 0,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.subtext,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: CHAT_BLUE,
  },

  /* ---- États ---- */
  state: {
    alignItems: 'center',
    paddingVertical: Spacings.xxl,
    paddingHorizontal: Spacings.xl,
  },
  medallion: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E6F1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacings.lg,
  },
  stateTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: Spacings.xs,
    textAlign: 'center',
  },
  stateText: {
    fontFamily: 'Roboto',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.gray,
    textAlign: 'center',
  },
  more: {
    alignItems: 'center',
    paddingVertical: Spacings.md,
  },
});
