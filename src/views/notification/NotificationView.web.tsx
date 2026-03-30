import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Portal, Dialog, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from "@tanstack/react-query";

import { BouncingDots } from '../../component/LoadingDots';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

import { formatRelativeTime } from '../../utils/dateUtils';
import {
  getNotifications,
  markAsRead, markAllAsRead,
  deleteNotification, deleteAllNotification,
  acceptNotification, rejectNotification
} from '../../services/v2/AuthService';
import { useGetUser } from '../../hooks/auth.hook';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  action: string;
  entity_type: string;
  entity_id: string;
  read_flg: boolean;
  created_at: string;
  actor?: {
    name?: string;
    first_name?: string;
  },
}

interface NotificationItemProps {
  notification: Notification;
  onDelete: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onAccept?: (id: string) => void;
  onRefuse?: (id: string) => void;
  navigation?: any;
  deletable?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDelete,
  onMarkAsRead,
  onAccept,
  onRefuse,
  navigation,
  deletable = true,
}) => {
  const handlePress = () => {
    if (!notification.read_flg) {
      onMarkAsRead(notification.id);
    }

    if (notification.entity_type == 'FifplInvoice') {
      navigation.navigate('invoice-view', { invoiceId: notification.entity_id });
    }
  };

  const allowedTypes = ['danger', 'success', 'warning'];

  return (
    <View style={styles.notificationCard}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={[styles.notificationContent, styles[allowedTypes.includes(notification.type) ? notification.type : 'info']]}
      >
        <View style={styles.notificationMain}>
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
        </View>

        {/* Delete Button */}
        {deletable &&
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(notification.id)}
          >
            <Ionicons name="close" size={24} color={Colors.danger} />
          </TouchableOpacity>
        }
      </TouchableOpacity>
    </View>
  );
};

export const NotificationView = ({ navigation, route }) => {
  const { data: user } = useGetUser();
  const { data: initNotifications, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: 2000
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Dialog states
  const [showAcceptErrorDialog, setShowAcceptErrorDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  useEffect(() => {
    if (initNotifications) {
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
        setShowAcceptErrorDialog(true);
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
    setShowDeleteAllDialog(true);
  };

  const confirmDeleteAll = () => {
    setShowDeleteAllDialog(false);
    deleteAllNotification();
    refetch();
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter(n => !n.read_flg).length
    : 0;

  return (
    <>
      {/* Overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        {/* Notification Panel */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.notificationPanel}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleClose}
              >
                <Ionicons name="arrow-forward" size={24} color={Colors.text} />
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
                position: 'absolute',
                backgroundColor: 'transparent',
                zIndex: 999,
                elevation: 5,
                top: '50%',
                left: '45%',
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
            >
              <View style={styles.content}>
                <View style={styles.notificationsList}>
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onDelete={handleDelete}
                      onMarkAsRead={handleMarkAsRead}
                      onAccept={() => handleAccept(notification.id, notification.entity_type)}
                      onRefuse={handleRefuse}
                      navigation={navigation}
                      deletable={notification.entity_type != 'FifplInvoice'}
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
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Portal Dialogs for Web (replacing Alert) */}
      <Portal>
        {/* Accept Error Dialog */}
        <Dialog
          visible={showAcceptErrorDialog}
          onDismiss={() => setShowAcceptErrorDialog(false)}
          style={styles.dialogWeb}
        >
          <Dialog.Title style={Styles.dialogWebTitle}>Action impossible</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>
              Veuillez définir une organisme de formation avant de pouvoir rejoindre une équipe.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={Colors.gray}
              labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => setShowAcceptErrorDialog(false)}
            >
              Annuler
            </Button>
            <Button
              textColor={Colors.primary}
              labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => {
                setShowAcceptErrorDialog(false);
                navigation.navigate('profile');
              }}
            >
              Définir
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete All Confirmation Dialog */}
        <Dialog
          visible={showDeleteAllDialog}
          onDismiss={() => setShowDeleteAllDialog(false)}
          style={styles.dialogWeb}
        >
          <Dialog.Title style={Styles.dialogWebTitle}>Supprimer tout</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>
              Êtes-vous sûr de vouloir supprimer toutes les notifications ?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={Colors.gray}
              labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => setShowDeleteAllDialog(false)}
            >
              Annuler
            </Button>
            <Button
              textColor={Colors.danger}
              labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={confirmDeleteAll}
            >
              Supprimer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  // Modal & Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  notificationPanel: {
    width: 700,
    height: '100%',
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },

  // Existing styles
  scrollView: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.md,
    paddingBottom: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
    paddingRight: Spacings.md,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  unreadCount: {
    fontSize: 12,
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
    paddingHorizontal: Spacings.lg,
  },

  // Notification Card
  notificationCard: {
    backgroundColor: Colors.white,
    marginBottom: Spacings.xxs,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notificationContent: {
    flexDirection: 'row',
    paddingVertical: Spacings.md,
    paddingLeft: Spacings.lg,
    paddingRight: Spacings.md,
    borderLeftWidth: 6,
    alignItems: 'flex-start',
  },
  notificationMain: {
    flex: 1,
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
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    flex: 1,
  },
  labelAccept: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: Colors.success,
    backgroundColor: Colors.successBackground,
    paddingVertical: Spacings.xxs,
    paddingHorizontal: Spacings.xs,
    borderRadius: 16,
  },
  labelReject: {
    fontSize: 10,
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
    gap: Spacings.xs,
  },
  notificationTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
  },
  unreadText: {
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  notificationTime: {
    fontSize: 10,
    fontFamily: 'Poppins-Light',
    color: Colors.gray,
    marginLeft: Spacings.xs,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'Roboto',
    color: Colors.text,
    opacity: 0.9,
  },
  deleteButton: {
    backgroundColor: Colors.red3,
    padding: Spacings.xs,
    marginLeft: Spacings.sm,
    borderRadius: 6,
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

  // Dialog Styles
  dialogWeb: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    maxWidth: 400,
    alignSelf: 'center',
  },
});