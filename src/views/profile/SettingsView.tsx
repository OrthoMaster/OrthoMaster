import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  StatusBar,
  Switch,
  Alert,
  Modal,
  Linking,
  Platform,
  ActivityIndicator,
  Animated,
  Image,
  Dimensions
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useFocusEffect } from '@react-navigation/native';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { useQuery } from '@tanstack/react-query';
import { useGetUser } from '../../hooks/auth.hook';
import { getPreFormData, updateSettings } from '../../services/v2/AuthService';

const { width, height } = Dimensions.get('window');
const isTablet = Platform.OS !== 'web' && width >= 768;
const numberCol = isTablet ? 5 : 3;
const topicWidth = (width - 2 * Spacings.lg - (numberCol - 1) * Spacings.sm) / numberCol - (4 * numberCol);

/** Diamètre des sous-sujets déployés en éventail */
const CHILD_SIZE = topicWidth * 0.68;

/** Écart minimal entre deux sous-sujets voisins, étiquette comprise */
const CHILD_GAP = 44;

/** L'éventail occupe un quart de tour, du premier au dernier sous-sujet */
const FAN_SPREAD = Math.PI / 2;

/** Marge conservée avec les bords de l'écran */
const SCREEN_MARGIN = 16;

interface Topic {
  id: string;
  name: string;
  image?: string;
  description?: string;
  parent_id?: string | null;
  has_children?: boolean;
  children?: Topic[];
}

interface SettingItemProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
  disabled?: boolean;
}

/** Position et contenu de l'éventail en cours d'affichage */
type FanState = {
  topic: Topic;
  cx: number;
  cy: number;
} | null;

/**
 * Un sujet est actif lorsqu'il est lui-même suivi, ou — s'il regroupe
 * des sous-sujets — dès que l'un d'eux l'est.
 */
const isTopicActive = (topic: Topic, selectedIds: string[]): boolean => {
  const children = topic.children ?? [];

  if (children.length === 0) {
    return selectedIds.includes(topic.id);
  }

  return children.some(child => selectedIds.includes(child.id));
};

/* -------------------------------------------------------------------------- */
/* Pastille ronde, commune aux sujets et sous-sujets                          */
/* -------------------------------------------------------------------------- */

const TopicDisc = ({
  topic,
  size,
  selected,
}: {
  topic: Topic;
  size: number;
  selected: boolean;
}) => (
  <View
    style={[
      styles.topicImageContainer,
      { width: size, height: size, borderRadius: size },
      selected && styles.topicImageContainerSelected,
      { opacity: selected ? 1 : 0.6 },
    ]}
  >
    {topic.image ? (
      <Image
        source={{ uri: process.env.EXPO_PUBLIC_S3_URL + topic.image }}
        style={styles.topicImage}
        resizeMode="cover"
      />
    ) : (
      <View style={styles.topicImagePlaceholder}>
        <Ionicons name="image-outline" size={24} color={Colors.gray} />
      </View>
    )}
  </View>
);

/* -------------------------------------------------------------------------- */
/* Sujet de la grille                                                          */
/* -------------------------------------------------------------------------- */

interface TopicCardProps {
  topic: Topic;
  isSelected: boolean;
  onToggle: (topicId: string) => void;
  onExpand: (topic: Topic, cx: number, cy: number) => void;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic, isSelected, onToggle, onExpand }) => {
  const discRef = useRef<View>(null);

  const hasChildren = (topic.children ?? []).length > 0;

  const handlePress = () => {
    // Sans sous-sujet, le sujet se suit directement
    if (!hasChildren) {
      onToggle(topic.id);
      return;
    }

    // L'éventail s'ouvre autour de la pastille : sa position est mesurée
    // dans le repère de la fenêtre, celui de la surface superposée
    discRef.current?.measureInWindow((x, y, w, h) => {
      onExpand(topic, x + w / 2, y + h / 2);
    });
  };

  return (
    <TouchableOpacity
      style={[styles.topicCard, { width: topicWidth }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View ref={discRef} collapsable={false}>
        <TopicDisc topic={topic} size={topicWidth} selected={isSelected} />
      </View>

      <Text
        style={[styles.topicCardText, isSelected && styles.topicCardTextSelected]}
        numberOfLines={2}
      >
        {topic.name}
      </Text>

      {/* {hasChildren && (
        <View style={styles.childrenHint}>
          <Ionicons
            name="ellipsis-horizontal"
            size={12}
            color={isSelected ? Colors.primary : Colors.gray}
          />
        </View>
      )} */}
    </TouchableOpacity>
  );
};

/* -------------------------------------------------------------------------- */
/* Éventail des sous-sujets                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Répartit les sous-sujets sur un quart de tour, centré sur la pastille
 * du sujet.
 *
 * L'éventail s'ouvre vers la zone libre : vers le bas dans la moitié
 * haute de l'écran, vers le haut dans la moitié basse, et du côté opposé
 * au bord le plus proche. Le premier sous-sujet occupe toujours l'angle
 * vertical du quadrant, le dernier son angle horizontal.
 */
const computeFanPositions = (count: number, cx: number, cy: number) => {
  if (count === 0) return [];

  const step = count > 1 ? FAN_SPREAD / (count - 1) : 0;

  // Le rayon découle de l'écart angulaire : deux voisins ne doivent jamais
  // se toucher, étiquettes comprises
  const needed = count > 1
    ? (CHILD_SIZE + CHILD_GAP) / (2 * Math.sin(step / 2))
    : topicWidth * 1.55;
  
  const radius = Math.max(topicWidth * 1.55, needed);

  // Vertical : vers le bas en haut d'écran, vers le haut en bas d'écran
  const openDown = cy < height / 2;

  // Horizontal : vers le centre lorsque la pastille longe un bord
  const third = width / 3;
  const openRight = cx < third ? true : cx > width - third ? false : true;

  // Angle vertical du quadrant : point de départ de l'arc
  const start = openDown ? Math.PI / 2 : -Math.PI / 2;

  // Le balayage rejoint l'angle horizontal, du côté choisi
  const direction = openDown === openRight ? -1 : 1;

  return Array.from({ length: count }, (_, i) => {
    const angle = start + direction * step * i;

    return {
      dx: radius * Math.cos(angle),
      dy: radius * Math.sin(angle),
    };
  });
};

const TopicFanOverlay = ({
  fan,
  selectedIds,
  onToggle,
  onClose,
}: {
  fan: FanState;
  selectedIds: string[];
  onToggle: (topicId: string) => void;
  onClose: () => void;
}) => {
  const progress = useRef(new Animated.Value(0)).current;

  // La donnée est conservée le temps de l'animation de fermeture
  const [current, setCurrent] = useState<FanState>(null);

  useEffect(() => {
    if (fan) {
      setCurrent(fan);
      progress.setValue(0);

      Animated.spring(progress, {
        toValue: 1,
        useNativeDriver: true,
        tension: 70,
        friction: 9,
      }).start();

      return;
    }

    if (!current) return;

    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setCurrent(null));
  }, [fan]);

  if (!current) return null;

  const children = current.topic.children ?? [];
  const positions = computeFanPositions(children.length, current.cx, current.cy);

  const parentActive = isTopicActive(current.topic, selectedIds);

  return (
    <Modal visible transparent statusBarTranslucent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.fanBackdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Le sujet reste à sa place : un nouvel appui referme l'éventail */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onClose}
        style={[
          styles.fanItem,
          {
            left: current.cx - topicWidth / 2,
            top: current.cy - topicWidth / 2,
            width: topicWidth,
          },
        ]}
      >
        <TopicDisc topic={current.topic} size={topicWidth} selected={parentActive} />
        <Text
          style={[styles.fanLabel, parentActive && styles.topicCardTextSelected]}
          numberOfLines={2}
        >
          {current.topic.name}
        </Text>
      </TouchableOpacity>

      {children.map((child, i) => {
        const { dx, dy } = positions[i];

        // Chaque sous-sujet part de la pastille du sujet, avec un léger décalage
        const start = children.length > 1 ? (i / children.length) * 0.35 : 0;
        const t = progress.interpolate({
          inputRange: [start, Math.min(start + 0.65, 1)],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        });

        const selected = selectedIds.includes(child.id);

        return (
          <Animated.View
            key={child.id}
            style={[
              styles.fanItem,
              {
                left: current.cx - CHILD_SIZE / 2,
                top: current.cy - CHILD_SIZE / 2,
                width: CHILD_SIZE,
                opacity: t,
                transform: [
                  { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
                  { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
                  { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                ],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={0.8} onPress={() => onToggle(child.id)}>
              <TopicDisc topic={child} size={CHILD_SIZE} selected={selected} />

              {/* Le sujet parent est rappelé au-dessus, en retrait :
                  le sous-sujet reste ce que l'œil lit en premier */}
              {/* <Text style={styles.fanParentLabel} numberOfLines={1}>
                {current.topic.name}
              </Text> */}
              <Text
                style={[styles.fanLabel, selected && styles.topicCardTextSelected]}
                numberOfLines={2}
              >
                {child.name}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/* Écran                                                                       */
/* -------------------------------------------------------------------------- */

const SettingItem: React.FC<SettingItemProps> = ({
  iconName,
  title,
  description,
  value,
  onValueChange,
  isLast,
  disabled
}) => (
  <View style={[styles.settingItem, !isLast && styles.settingItemBorder]}>
    <View style={styles.settingItemLeft}>
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={20} color={disabled ? Colors.gray : Colors.text} />
      </View>
      <View style={styles.settingItemText}>
        <Text style={[styles.settingItemTitle, disabled && styles.settingItemTitleDisabled]}>
          {title}
        </Text>
        {description &&
          <Text style={styles.settingItemDescription}>{description}</Text>
        }
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: Colors.line, true: Colors.primaryLight || Colors.primary }}
      thumbColor={value ? Colors.primary : Colors.gray}
      ios_backgroundColor={Colors.line}
    />
  </View>
);

export const SettingsView = ({ navigation }) => {
  // Hide bottom nav
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });

    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'flex' }
      });
    };
  }, [navigation]);

  const {
    data: preData,
    isLoading: isLoadingTopics,
    refetch: refetchPreData,
  } = useQuery({
    queryKey: ['pre-form-data-profile'],
    queryFn: () => getPreFormData(),
    staleTime: 0,
    retry: 2,
    retryDelay: 2000,
  });

  const { data: user, isLoading: isLoadingUser, refetch, isFetching, error } = useGetUser();

  useFocusEffect(
    useCallback(() => {
      refetchPreData();
      refetch();
    }, [refetchPreData, refetch])
  );

  // Settings state
  const [settings, setSettings] = useState({
    notifications: false,
    favoriteTopicIds: [] as string[],
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Topics state
  const [topics, setTopics] = useState<Topic[]>([]);

  /** Sujet dont les sous-sujets sont déployés */
  const [fan, setFan] = useState<FanState>(null);

  // Load topics from database
  useEffect(() => {
    if (preData?.data?.topics) {
      setTopics(preData?.data?.topics);
    }
  }, [preData]);

  // Set values from user data
  useEffect(() => {
    setSettings({
      notifications: user.settings?.notifications || false,
      favoriteTopicIds: user.settings?.topics ?? [],
    });
    setIsLoading(false);
  }, [user]);

  /** Autorisation système : sans elle, le réglage ne sert à rien */
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    let isActive = true;

    Notifications.getPermissionsAsync()
      .then(({ status }) => {
        if (isActive) setPermissionDenied(status === 'denied');
      })
      .catch(() => { });

    return () => {
      isActive = false;
    };
  }, []);

  // Handle change any settings
  const handleSettingChange = async (key: keyof typeof settings, value: boolean) => {
    if (key == 'notifications' && value == true && !user.settings?.notifications) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus === 'undetermined') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Notifications désactivées',
          'Pour recevoir des quizz, podcasts et infographies selon vos envies, veuillez activer les notifications.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      setSettings(prev => ({ ...prev, [key]: value }));
      setHasChanges(true);
    } else {
      setSettings(prev => ({ ...prev, [key]: value }));
      setHasChanges(true);
    }
  };

  const handleToggleTopic = (topicId: string) => {
    setSettings(prev => {
      const isCurrentlySelected = prev.favoriteTopicIds.includes(topicId);
      const newTopicIds = isCurrentlySelected
        ? prev.favoriteTopicIds.filter(id => id !== topicId)
        : [...prev.favoriteTopicIds, topicId];

      return { ...prev, favoriteTopicIds: newTopicIds };
    });
    setHasChanges(true);
  };

  const handleExpandTopic = (topic: Topic, cx: number, cy: number) => {
    setFan({ topic, cx, cy });
  };

  const back = () => {
    if (hasChanges) {
      Alert.alert(
        "Modifications non enregistrées",
        "Voulez-vous enregistrer vos modifications avant de quitter ?",
        [
          {
            text: "Ne pas enregistrer",
            style: "destructive",
            onPress: () => navigation.goBack()
          },
          {
            text: "Annuler",
            style: "cancel"
          },
          {
            text: "Enregistrer",
            onPress: handleSave
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const result = await updateSettings(settings);

      if (result == true) {
        refetch();
        setShowSuccessModal(true);
        setHasChanges(false);
        setTimeout(() => navigation.goBack(), 2500);
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de l\'enregistrement');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}
      edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={back}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes centres d'intérêt</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hasChanges ? 130 : Spacings.xxl }}
        // L'éventail est ancré à une position figée : le défilement le referme
        onScrollBeginDrag={() => setFan(null)}
      >
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications pour rester informé</Text>
          <Text style={styles.topicSectionDescription}>Aucune publicité, que du contenu pédagogique 😉</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              iconName="notifications-outline"
              title="Recevoir l'actualité de mes centres d'intérêts par notification"
              value={settings.notifications && !permissionDenied}
              onValueChange={(value) => handleSettingChange('notifications', value)}
              disabled={permissionDenied}
              isLast
            />
          </View>

          {permissionDenied && (
            <View style={styles.permissionNotice}>
              <Ionicons name="warning" size={20} color={Colors.primary} />
              <Text style={styles.permissionNoticeText}>
                Pour recevoir des quizz, podcasts et infographies selon vos envies, veuillez activer les notifications.
              </Text>
            </View>
          )}
        </View>

        {/* Favorite Topics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Centres d'intérêt</Text>
          <Text style={styles.topicSectionDescription}>
            Sélectionnez vos centres d'intérêt pour personnaliser votre expérience
          </Text>
          <View style={styles.sectionContent}>
            <View style={styles.topicSection}>
              {/* Topics Grid */}
              {isLoadingTopics ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              ) : topics.length > 0 ? (
                <View style={styles.topicsGrid}>
                  {topics.map(topic => (
                    <TopicCard
                      key={topic.id}
                      topic={topic}
                      isSelected={isTopicActive(topic, settings.favoriteTopicIds)}
                      onToggle={handleToggleTopic}
                      onExpand={handleExpandTopic}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="albums-outline" size={48} color={Colors.gray} />
                  <Text style={styles.emptyText}>Aucun centre d'intérêt disponible</Text>
                </View>
              )}
            </View>
          </View>
        </View>


      </ScrollView>

      {/* Save Button */}
      {hasChanges && (
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              isSubmitting && styles.saveButtonDisabled
            ]}
            disabled={isLoading || isSubmitting}
            activeOpacity={0.8}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sous-sujets déployés en éventail */}
      <TopicFanOverlay
        fan={fan}
        selectedIds={settings.favoriteTopicIds}
        onToggle={handleToggleTopic}
        onClose={() => setFan(null)}
      />

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modelIconContainer}>
              <Ionicons name="checkmark-circle" size={50} color={Colors.success} />
            </View>
            <Text style={styles.modalTitle}>Succès</Text>
            <Text style={styles.modalMessage}>
              Vos paramètres ont été enregistrés avec succès !
            </Text>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: isTablet ? 100 : 60,
  },
  backButton: {
    padding: 4,
    paddingRight: Spacings.md
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  section: {
    marginTop: Spacings.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    paddingHorizontal: Spacings.lg,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.line,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
    backgroundColor: Colors.white,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  settingItemLeft: {
    flexDirection: 'row',
    flex: 1,
    marginRight: Spacings.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacings.md,
  },
  settingItemText: {
    flex: 1,
    justifyContent: 'center',
  },
  settingItemTitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  settingItemDescription: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    lineHeight: 16,
    marginTop: 2,
  },

  // Topic Section Styles
  topicSection: {
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
  },
  topicSectionDescription: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginBottom: Spacings.md,
    paddingHorizontal: Spacings.lg,
  },
  topicsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacings.sm,
  },
  topicCard: {
    alignItems: 'center',
    marginBottom: Spacings.sm,
  },
  topicImageContainer: {
    borderRadius: 120,
    overflow: 'hidden',
    marginBottom: Spacings.xs,
    backgroundColor: Colors.white,
    padding: 2,
  },
  topicImageContainerSelected: {
    borderWidth: 5,
    borderColor: Colors.primary,
  },
  topicImage: {
    width: '100%',
    height: '100%',
  },
  topicImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.grayLight,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicCardText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.subtext2,
    textAlign: 'center',
    lineHeight: 14,
  },
  topicCardTextSelected: {
    color: Colors.primary,
    fontFamily: 'Poppins-Bold',
  },
  childrenHint: {
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: Spacings.xxl,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacings.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: Spacings.md,
    textAlign: 'center',
  },

  // Éventail
  fanBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  fanItem: {
    position: 'absolute',
    alignItems: 'center',
  },
  fanParentLabel: {
    marginTop: 2,
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    lineHeight: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  fanLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Bottom Section
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacings.lg,
    paddingBottom: Platform.OS === 'android' ? Spacings.xxxl : Spacings.xxl,
    paddingHorizontal: Spacings.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacings.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },

  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacings.xl,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacings.lg,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modelIconContainer: {
    marginBottom: Spacings.sm,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  modalMessage: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 20,
    paddingTop: Spacings.xxs,
    marginBottom: Spacings.md,
    width: '70%',
  },
  settingItemTitleDisabled: {
    color: Colors.gray,
  },
  permissionNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacings.xs,
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.sm,
    marginBottom: Spacings.md
  },
  permissionNoticeText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.primary,
  },
});