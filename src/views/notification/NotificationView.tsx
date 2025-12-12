import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Animated,
  PanResponder,
  RefreshControl,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient, useQuery } from "@tanstack/react-query";

import { BouncingDots } from '../../component/LoadingDots';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { formatRelativeTime } from '../../utils/dateUtils';
import {
  getNotifications,
  markAsRead, markAllAsRead,
  deleteNotification, deleteAllNotification,
  acceptNotification, rejectNotification
} from '../../services/v2/AuthService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -100;

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  action: string;
  read_flg: boolean;
  created_at: string;
  actor?: {
    name?: string;
    first_name?: string;
  }
}

interface SwipeableNotificationProps {
  notification: Notification;
  onDelete: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onAccept?: (id: string) => void;
  onRefuse?: (id: string) => void;
}

const SwipeableNotification: React.FC<SwipeableNotificationProps> = ({
  notification,
  onDelete,
  onMarkAsRead,
  onAccept,
  onRefuse
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isDeleting, setIsDeleting] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          // Swipe to delete
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setIsDeleting(true);
            setTimeout(() => onDelete(notification.id), 100);
          });
        } else {
          // Return to original position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 10,
          }).start();
        }
      },
    })
  ).current;

  const handlePress = () => {
    if (!notification.read_flg) {
      onMarkAsRead(notification.id);
    }
  };

  if (isDeleting) {
    return null;
  }

  const allowedTypes = ['danger', 'success', 'warning'];

  return (
    <View style={styles.swipeContainer}>
      {/* Delete Background */}
      <View style={styles.deleteBackground}>
        <Ionicons name="trash-bin" size={24} color={Colors.white} />
      </View>

      {/* Notification Card */}
      <Animated.View
        style={[
          styles.notificationCard,
          { transform: [{ translateX }] }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePress}
          style={[styles.notificationContent, styles[allowedTypes.includes(notification.type) ? notification.type : 'info']]}
        >
          <View style={styles.notificationHeader}>
            <View style={styles.notificationHeaderLeft}>
              {!notification.read_flg && <View style={styles.unreadDot} />}
              <Text style={[
                styles.notificationReceiver,
                !notification.read_flg && styles.unreadText
              ]}>
                {notification.actor ? (notification.actor.name + ' ' + (notification.actor.first_name || '')) : 'OrthoMaster'}
              </Text>

            </View>
            <Text style={styles.notificationTime}>{formatRelativeTime(notification.created_at)}</Text>
          </View>

          <View style={styles.notificationTitleWrapper}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            {notification.type === 'confirm' && notification.action == '4' &&
              <Text style={styles.labelAccept}>Accepté</Text>
            }
            {notification.type === 'confirm' && notification.action == '5' &&
              <Text style={styles.labelReject}>Refusé</Text>
            }
          </View>
          <Text style={styles.notificationMessage}>{notification.content}</Text>

          {notification.type === 'confirm' && !notification.action && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.refuseButton]}
                onPress={() => onRefuse && onRefuse(notification.id)}
              >
                <Ionicons name="close-outline" size={16} color={Colors.danger} />
                <Text style={styles.refuseButtonText}>Refuser</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => onAccept && onAccept(notification.id)}
              >
                <Ionicons name="checkmark-outline" size={16} color={Colors.success} />
                <Text style={styles.acceptButtonText}>Accepter</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export const NotificationView = ({ navigation }) => {
  const { data: initNotifications, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
  });

  // Initialize with empty array to avoid undefined errors
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Update notifications when data is fetched
  useEffect(() => {
    if (initNotifications) {
      // Handle if API returns { data: [...] } or just [...]
      const notifData = Array.isArray(initNotifications)
        ? initNotifications
        : (initNotifications?.data?.data || []);

      setNotifications(notifData);
    }
  }, [initNotifications]);

  const handleDelete = (id: string) => {
    setNotifications(prev => prev?.filter(notif => notif.id !== id) || []);
    deleteNotification(id);
    return;
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev?.map(notif =>
        notif.id === id ? { ...notif, read_flg: true } : notif
      ) || []
    );
    markAsRead(id);
    return;
  };

  const handleAccept = async (id: string) => {
    await acceptNotification(id);
    refetch();
  };

  const handleRefuse = async (id: string) => {
    await rejectNotification(id);
    refetch();
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev?.map(notif => ({ ...notif, read_flg: true })) || []
    );
    markAllAsRead();
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Supprimer tout',
      'Êtes-vous sûr de vouloir supprimer toutes les notifications ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteAllNotification();
            setNotifications([]);
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      // TODO
    } finally {
      setRefreshing(false);
    }
  };

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter(n => !n.read_flg).length
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'profile-view' }],
              });
            }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={styles.unreadCount}>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</Text>
            )}
          </View>
        </View>

        {notifications && notifications.length > 0 && (
          <TouchableOpacity
            style={styles.headerAction}
            onPress={handleMarkAllAsRead}
          >
            <Ionicons name="checkmark-done-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading */}
      {(isLoading || isFetching) &&
        <BouncingDots
          color={Colors.gray}
          size={10}
          bounceHeight={5}
          containerStyle={{
            backgroundColor: Colors.grayLight,
            zIndex: 999,
            elevation: 5,
          }}
        />
      }

      {/* Content */}
      {!notifications || notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={80} color={Colors.gray} />
          <Text style={styles.emptyTitle}>Aucune notification</Text>
          <Text style={styles.emptySubtitle}>
            Vous n'avez pas encore de notifications
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isFetching}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          <View style={styles.content}>
            <View style={styles.notificationsList}>
              {notifications.map((notification) => (
                <SwipeableNotification
                  key={notification.id}
                  notification={notification}
                  onDelete={handleDelete}
                  onMarkAsRead={handleMarkAsRead}
                  onAccept={handleAccept}
                  onRefuse={handleRefuse}
                />
              ))}
            </View>

            {notifications.length > 0 && (
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={handleDeleteAll}
              >
                <Ionicons name="trash-bin-outline" size={18} color={Colors.danger} />
                <Text style={styles.clearAllText}>Tout supprimer</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingBottom: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  unreadCount: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: -4,
  },
  headerAction: {
    padding: 4,
  },
  content: {
    paddingVertical: Spacings.md,
  },
  notificationsList: {
    // gap: Spacings.sm,
  },

  // Swipeable Container
  swipeContainer: {
    position: 'relative',
    marginBottom: Spacings.xxs,
    height: 'auto',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: Spacings.lg,
    width: '100%',
  },

  // Notification Card
  notificationCard: {
    backgroundColor: Colors.white,
  },
  notificationContent: {
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
    borderLeftWidth: 6,
  },
  info: {
    borderLeftColor: Colors.blue,
  },
  warning: {
    borderLeftColor: Colors.warning,
  },
  success: {
    borderLeftColor: Colors.success,
  },
  danger: {
    borderLeftColor: Colors.danger,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacings.xs,
  },
  notificationHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacings.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notificationReceiver: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    flex: 1,
  },
  labelAccept: {
    fontSize: 8,
    fontFamily: 'Poppins-Regular',
    color: Colors.white,
    backgroundColor: Colors.success,
    paddingVertical: Spacings.xxs,
    paddingHorizontal: Spacings.xs,
    borderRadius: 16,
  },
  labelReject: {
    fontSize: 8,
    fontFamily: 'Poppins-Regular',
    color: Colors.white,
    backgroundColor: Colors.danger,
    paddingVertical: Spacings.xxxs,
    paddingHorizontal: Spacings.xs,
    borderRadius: 16,
  },
  notificationTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs
  },
  notificationTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
  },
  unreadText: {
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  notificationTime: {
    fontSize: 8,
    fontFamily: 'Poppins-Light',
    color: Colors.gray,
    marginLeft: Spacings.xs,
  },
  notificationMessage: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    opacity: 0.9,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: Spacings.md,
    marginTop: Spacings.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacings.xs,
    paddingHorizontal: Spacings.sm,
    borderRadius: 8,
    gap: Spacings.xxs,
  },
  refuseButton: {
    backgroundColor: Colors.dangerBackground,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  refuseButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.danger,
  },
  acceptButton: {
    backgroundColor: Colors.successBackground,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  acceptButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.success,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacings.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginTop: Spacings.lg,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: Spacings.xs,
    textAlign: 'center',
  },

  // Clear All Button
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xs,
    marginTop: Spacings.lg,
    marginBottom: Spacings.xl,
    paddingVertical: Spacings.sm,
  },
  clearAllText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.danger,
  },
});