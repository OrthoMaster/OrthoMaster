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
  Dimensions,
  Vibration
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from "@tanstack/react-query";

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
import { useGetUser } from '../../hooks/auth.hook';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -80;
const DELETE_ZONE_WIDTH = 100;

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
  const deleteOpacity = useRef(new Animated.Value(0)).current;
  const deleteScale = useRef(new Animated.Value(0.8)).current;

  const [isDeleting, setIsDeleting] = useState(false);
  const [hasReachedThreshold, setHasReachedThreshold] = useState(false);
  const hasVibratedRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          const clampedDx = Math.max(gestureState.dx, -DELETE_ZONE_WIDTH);
          translateX.setValue(clampedDx);

          const progress = Math.min(Math.abs(clampedDx) / DELETE_ZONE_WIDTH, 1);
          deleteOpacity.setValue(progress);
          deleteScale.setValue(0.8 + (progress * 0.2)); // Scale từ 0.8 đến 1.0

          const reachedThreshold = gestureState.dx < SWIPE_THRESHOLD;
          if (reachedThreshold && !hasVibratedRef.current) {
            // Haptic feedback khi đạt ngưỡng
            Vibration.vibrate(10);
            hasVibratedRef.current = true;
            setHasReachedThreshold(true);
          } else if (!reachedThreshold && hasVibratedRef.current) {
            hasVibratedRef.current = false;
            setHasReachedThreshold(false);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Reset vibration flag
        hasVibratedRef.current = false;
        setHasReachedThreshold(false);

        // Nếu đã vuốt qua ngưỡng, thực hiện xóa
        if (gestureState.dx < SWIPE_THRESHOLD) {
          // Animate to fully off screen
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -SCREEN_WIDTH,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(deleteOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            })
          ]).start(() => {
            setIsDeleting(true);
            setTimeout(() => onDelete(notification.id), 50);
          });
        } else {
          // Quay về vị trí ban đầu với spring animation mượt mà
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 10,
            }),
            Animated.timing(deleteOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(deleteScale, {
              toValue: 0.8,
              useNativeDriver: true,
              tension: 100,
              friction: 10,
            })
          ]).start();
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
      {/* Delete Background - với animated opacity và scale */}
      <View style={styles.deleteBackground}>
        <Animated.View
          style={[
            styles.deleteIconContainer,
            {
              opacity: deleteOpacity,
              transform: [{ scale: deleteScale }]
            }
          ]}
        >
          <Ionicons
            name="trash-bin"
            size={28}
            color={Colors.white}
          />
          <Text style={styles.deleteText}>Supprimer</Text>
        </Animated.View>
      </View>

      {/* Notification Card */}
      <Animated.View
        style={[
          styles.notificationCard,
          {
            transform: [{ translateX }],
          },
          // Thêm highlight khi đạt ngưỡng
          hasReachedThreshold && styles.notificationCardThreshold
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

export const NotificationView = ({ navigation, route }) => {
  const { data: user } = useGetUser();
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

  const handleAccept = async (id: string, type: string) => {
    if (type == 'CompanyJoinRequest') {
      if (user && !user.funding_organization_id) {
        Alert.alert('Action impossible', 'Veuillez définir une organisme de formation avant de pouvoir rejoindre une équipe.', [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Définir',
            onPress: () => {
              navigation.navigate('profile');
            },
          },
        ]);

        return false;
      }
    }

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
            onPress={() => { navigation.goBack() }}
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
                  onAccept={() => handleAccept(notification.id, notification.entity_type)}
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
    paddingTop: Spacings.sm,
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
    fontSize: 18,
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
    overflow: 'hidden',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: DELETE_ZONE_WIDTH,
  },
  deleteIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: Colors.white,
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    marginTop: Spacings.xxxs,
  },

  // Notification Card
  notificationCard: {
    backgroundColor: Colors.white,
  },
  notificationCardThreshold: {
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
    fontFamily: 'Poppins-Medium',
    color: Colors.success,
    backgroundColor: Colors.successBackground,
    paddingVertical: Spacings.xxs,
    paddingHorizontal: Spacings.xs,
    borderRadius: 16,
  },
  labelReject: {
    fontSize: 9,
    fontFamily: 'Poppins-Medium',
    color: Colors.danger,
    backgroundColor: Colors.dangerBackground,
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