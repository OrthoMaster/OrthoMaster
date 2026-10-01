import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  StatusBar,
  Modal,
  Animated,
  ActivityIndicator,
  Image,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Portal, Dialog, Button } from 'react-native-paper';

import { useFocusEffect } from '@react-navigation/native';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

import { useQuery } from '@tanstack/react-query';
import { useGetUser } from '../../hooks/auth.hook';
import { getPreFormData, updateSettings } from '../../services/v2/AuthService';

const { width, height } = Dimensions.get('window');
const topicWidth = (width - 2 * Spacings.lg - 8 * Spacings.sm) / 9;

/** Les sous-sujets sont un peu plus grands que les sujets : la place ne manque pas */
const CHILD_SIZE = topicWidth * 0.8;

/** Écart minimal entre deux sous-sujets voisins, étiquette comprise */
const CHILD_GAP = 44;

/** L'éventail occupe un quart de tour, du premier au dernier sous-sujet */
const FAN_SPREAD = Math.PI / 2;

interface Topic {
  id: string;
  name: string;
  image?: string;
  description?: string;
  parent_id?: string | null;
  has_children?: boolean;
  children?: Topic[];
}

interface TopicCardProps {
  topic: Topic;
  isSelected: boolean;
  onToggle: (topicId: string) => void;
  onExpand: (topic: Topic, cx: number, cy: number) => void;
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
  hovered,
}: {
  topic: Topic;
  size: number;
  selected: boolean;
  hovered?: boolean;
}) => (
  <View
    style={[
      styles.topicImageContainer,
      { width: size, height: size, borderRadius: size },
      selected && styles.topicImageContainerSelected,
      { opacity: selected || hovered ? 1 : 0.6 },
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

    {/* Voile assombrissant : distingue au premier coup d'œil ce qui n'est pas suivi */}
    {!selected && (
      <View
        style={[
          styles.topicVeil,
          { borderRadius: size },
          hovered && styles.topicVeilHovered,
        ]}
        pointerEvents="none"
      />
    )}
  </View>
);

/* -------------------------------------------------------------------------- */
/* Sujet de la grille                                                          */
/* -------------------------------------------------------------------------- */

const TopicCard: React.FC<TopicCardProps> = ({ topic, isSelected, onToggle, onExpand }) => {
  const discRef = useRef<View>(null);
  const [hovered, setHovered] = useState(false);

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
    <Pressable
      style={[styles.topicCard, { width: topicWidth }]}
      onPress={handlePress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      <View ref={discRef} collapsable={false}>
        <TopicDisc topic={topic} size={topicWidth} selected={isSelected} hovered={hovered} />
      </View>

      <Text
        style={[styles.topicCardText, isSelected && styles.topicCardTextSelected]}
        numberOfLines={2}
      >
        {topic.name}
      </Text>
    </Pressable>
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
    : topicWidth * 1.8;

  const radius = Math.max(topicWidth * 1.8, needed);

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

const FanChild = ({
  child,
  parentName,
  selected,
  dx,
  dy,
  progress,
  index,
  total,
  onToggle,
}: {
  child: Topic;
  parentName: string;
  selected: boolean;
  dx: number;
  dy: number;
  progress: Animated.Value;
  index: number;
  total: number;
  onToggle: (topicId: string) => void;
}) => {
  const [hovered, setHovered] = useState(false);

  // Chaque sous-sujet part de la pastille du sujet, avec un léger décalage
  const start = total > 1 ? (index / total) * 0.35 : 0;
  const t = progress.interpolate({
    inputRange: [start, Math.min(start + 0.65, 1)],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.fanItem,
        {
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
      <Pressable
        onPress={() => onToggle(child.id)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={styles.fanPressable}
      >
        <TopicDisc topic={child} size={CHILD_SIZE} selected={selected} hovered={hovered} />

        {/* Le sujet parent est rappelé au-dessus, en retrait :
            le sous-sujet reste ce que l'œil lit en premier */}
        {/* <Text style={styles.fanParentLabel} numberOfLines={1}>
          {parentName}
        </Text> */}
        <Text
          style={[styles.fanLabel, selected && styles.fanLabelSelected]}
          numberOfLines={2}
        >
          {child.name}
        </Text>
      </Pressable>
    </Animated.View>
  );
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
      <Pressable
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
        <TopicDisc topic={current.topic} size={topicWidth} selected={parentActive} hovered />
        <Text style={styles.fanLabel} numberOfLines={2}>
          {current.topic.name}
        </Text>
      </Pressable>

      {children.map((child, i) => (
        <View
          key={child.id}
          style={[
            styles.fanAnchor,
            {
              left: current.cx - CHILD_SIZE / 2,
              top: current.cy - CHILD_SIZE / 2,
            },
          ]}
          pointerEvents="box-none"
        >
          <FanChild
            child={child}
            parentName={current.topic.name}
            selected={selectedIds.includes(child.id)}
            dx={positions[i].dx}
            dy={positions[i].dy}
            progress={progress}
            index={i}
            total={children.length}
            onToggle={onToggle}
          />
        </View>
      ))}
    </Modal>
  );
};

/* -------------------------------------------------------------------------- */
/* Écran                                                                       */
/* -------------------------------------------------------------------------- */

export const SettingsView = ({ navigation }) => {
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

  // Dialog states
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);

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

  const handleToggleTopic = (topicId: string) => {
    setSettings(prev => {
      const isCurrentlySelected = prev.favoriteTopicIds.includes(topicId);
      const newTopicIds = isCurrentlySelected
        ? prev.favoriteTopicIds.filter(id => id !== topicId)
        : [...prev.favoriteTopicIds, topicId];

      return {
        ...prev,
        favoriteTopicIds: newTopicIds
      };
    });
    setHasChanges(true);
  };

  const handleExpandTopic = (topic: Topic, cx: number, cy: number) => {
    setFan({ topic, cx, cy });
  };

  const back = () => {
    if (hasChanges) {
      setShowUnsavedChangesDialog(true);
    } else {
      navigation.goBack();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedChangesDialog(false);
    navigation.goBack();
  };

  const handleSaveAndExit = async () => {
    setShowUnsavedChangesDialog(false);
    await handleSave();
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
        setErrorMessage("Une erreur est survenue lors de l'enregistrement");
        setShowErrorDialog(true);
      }
    } catch (error) {
      setErrorMessage("Une erreur est survenue lors de l'enregistrement");
      setShowErrorDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.white}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={back}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={Colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Mes centres d'intérêt
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        // L'éventail est ancré à une position figée : le défilement le referme
        onScrollBeginDrag={() => setFan(null)}
      >
        {/* Favorite Topics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Centres d'intérêt
          </Text>
          <Text style={styles.topicSectionDescription}>
            Sélectionnez vos centres d'intérêt pour personnaliser votre expérience
          </Text>
          <View style={styles.sectionContent}>
            <View style={styles.topicSection}>
              {/* Topics Grid */}
              {isLoadingTopics ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="large"
                    color={Colors.primary}
                  />
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
                  <Ionicons
                    name="albums-outline"
                    size={48}
                    color={Colors.gray}
                  />
                  <Text style={styles.emptyText}>
                    Aucun centre d'intérêt disponible
                  </Text>
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
              <Ionicons
                name="checkmark-circle"
                size={50}
                color={Colors.success}
              />
            </View>
            <Text style={styles.modalTitle}>
              Succès
            </Text>
            <Text style={styles.modalMessage}>
              Vos paramètres ont été enregistrés avec succès !
            </Text>
          </View>
        </View>
      </Modal>

      {/* Portal Dialogs */}
      <Portal>
        {/* Unsaved Changes Dialog */}
        <Dialog
          visible={showUnsavedChangesDialog}
          onDismiss={() => setShowUnsavedChangesDialog(false)}
          style={Styles.dialogWeb}
        >
          <Dialog.Title style={Styles.dialogWebTitle}>Modifications</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>
              Voulez-vous enregistrer vos modifications avant de quitter ?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={Colors.danger} labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={handleDiscardChanges}
            >
              Ne pas enregistrer
            </Button>
            <Button
              textColor={Colors.gray}
              labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => setShowUnsavedChangesDialog(false)}
            >
              Annuler
            </Button>
            <Button
              textColor={Colors.green}
              labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={handleSaveAndExit}
            >
              Enregistrer
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Error Dialog */}
        <Dialog
          visible={showErrorDialog}
          onDismiss={() => setShowErrorDialog(false)}
          style={Styles.dialogWeb}
        >
          <Dialog.Title style={[Styles.dialogWebTitle, { color: Colors.red }]}>Erreur</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>
              {errorMessage}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={Colors.gray}
              labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => setShowErrorDialog(false)}
            >
              Fermer
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: 100,
  },
  backButton: {
    padding: 4,
    paddingRight: Spacings.md
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  section: {
    marginTop: Spacings.lg,
  },
  sectionTitle: {
    fontSize: 14,
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
  topicSection: {
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
  },
  topicSectionDescription: {
    fontSize: 14,
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
    cursor: 'pointer',
  } as any,
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
  topicVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  topicVeilHovered: {
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  topicImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
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
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: Colors.subtext2,
    textAlign: 'center',
  },
  topicCardTextSelected: {
    color: Colors.primary,
    fontFamily: 'Poppins-Medium',
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

  /* ---- Éventail ---- */
  fanBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
  },
  fanAnchor: {
    position: 'absolute',
  },
  fanItem: {
    position: 'absolute',
    alignItems: 'center',
    cursor: 'pointer',
  } as any,
  fanPressable: {
    alignItems: 'center',
    cursor: 'pointer',
  } as any,
  fanParentLabel: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  fanLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.95)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  fanLabelSelected: {
    color: Colors.primary,
    fontFamily: 'Poppins-Bold',
  },

  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacings.lg,
    paddingBottom: Spacings.xxl,
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
    cursor: 'pointer',
  } as any,
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  
    modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: Spacings.xl,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingTop: Spacings.xl,
    paddingBottom: Spacings.xl,
    paddingHorizontal: Spacings.lg,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },
  modelIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.successBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacings.md,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.success,
    marginBottom: Spacings.xs,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 0,
    width: '100%',
  },
});