import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native-paper';
import { useQuery } from "@tanstack/react-query";
import { getTrainings, addPackages } from '../../services/v2/CartService';

import Stepper from './components/Stepper';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { BouncingDots } from '../../component/LoadingDots';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COURSES_PER_ROW = SCREEN_WIDTH >= 1440 ? 16 : 10;
const CARD_SPACING = Spacings.xs;
const CONTAINER_PADDING = Spacings.lg;
const COURSE_SIZE = (SCREEN_WIDTH - (CONTAINER_PADDING * 2) - (CARD_SPACING * (COURSES_PER_ROW - 1))) / COURSES_PER_ROW;

interface Package {
  id: string;
  name: string;
  short_name: string;
  image?: string;
  image_2?: string;
  color: string;
  duration: number;
  duration_text: string;
  disabled_flg?: boolean;
}

interface Training {
  id: string;
  name: string;
  color: string;
  background_color: string;
  packages: Package[];
}

interface PackageCardProps {
  pkg: Package;
  color: string;
  backgroundColor: string;
  isSelected: boolean;
  onToggle: (id: string) => void;
  disabled?: boolean;
}

const PackageCard: React.FC<PackageCardProps> = ({ pkg, color, backgroundColor, isSelected, onToggle, disabled }) => {
  const isDisabled = pkg.disabled_flg || false;

  return (
    <TouchableOpacity
      activeOpacity={isDisabled ? 1 : 0.9}
      onPress={() => !isDisabled && onToggle(pkg.id)}
      style={[
        styles.courseCard,
        { width: COURSE_SIZE }
      ]}
      disabled={disabled || isDisabled}
    >
      {/* Circle Container */}
      <View style={[
        styles.courseCircle,
        { backgroundColor: (isDisabled || isSelected) ? color : backgroundColor },
        isSelected && styles.courseCircleSelected,
        isDisabled && styles.courseCircleDisabled
      ]}>
        {/* Icon */}
        {pkg.image
          ? <Image
            source={{ uri: process.env.EXPO_PUBLIC_S3_URL + ((isDisabled || isSelected) ? pkg.image : pkg.image_2) }}
            style={[{
              width: '100%',
              height: '100%',
              borderRadius: 100,
              resizeMode: 'contain'
            }, isDisabled && styles.courseIconDisabled]}
            resizeMode="contain"
          />
          : <Text style={[
            styles.courseIcon,
            isDisabled && styles.courseIconDisabled
          ]}>
            📚
          </Text>
        }

        {/* Checkmark Overlay for Selected */}
        {isSelected && !isDisabled && (
          <View style={styles.checkmarkOverlay}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
          </View>
        )}
      </View>

      {/* Duration Badge */}
      <View style={[
        styles.durationBadge,
        isDisabled && [styles.durationBadgeDisabled, { backgroundColor: Colors.lgreenDark }]
      ]}>
        {!isDisabled &&
          <Ionicons
            name="time-outline"
            size={10}
            color={Colors.blue}
          />
        }
        <Text style={[
          styles.durationText,
          isDisabled && [styles.durationTextDisabled]
        ]}>
          {isDisabled ? 'Activé' : pkg.duration_text}
        </Text>
      </View>

      {/* Package Name */}
      <Text
        style={[
          styles.courseName,
          isSelected && [styles.courseNameSelected, { color: color }],
          isDisabled && styles.courseNameDisabled
        ]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {pkg.short_name ?? pkg.name}
      </Text>
    </TouchableOpacity>
  );
};

export const SelectPackageView = ({ navigation, route }) => {
  const { paymentMethod } = route.params;

  // Load current member list
  const { data: trainings, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['pro-trainings'],
    queryFn: () => getTrainings(),
    retry: 2,
    retryDelay: 2000,
  });

  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [creatable, setCreatable] = useState(false);
  const [cntContract, setCntContract] = useState('-');
  const [showTooltip, setShowTooltip] = useState(false);

  // Calculate total hours
  const totalHours = useMemo(() => {
    if (!trainings || !Array.isArray(trainings)) {
      return 0;
    }

    let total = 0;
    trainings.forEach(training => {
      training.packages.forEach(pkg => {
        if (selectedPackages.includes(pkg.id)) {
          total += (pkg.duration / 60);
        }
      });
    });
    return total;
  }, [selectedPackages, trainings]);

  const handleTogglePackage = async (id: string) => {
    const newSelectedPackages = selectedPackages.includes(id)
      ? selectedPackages.filter(pkgId => pkgId !== id)
      : [...selectedPackages, id];

    setSelectedPackages(newSelectedPackages);
    setConfirming(true);
    setCreatable(false);
    const result = await addPackages(newSelectedPackages);
    if (!result) {
      refetch();
      return;
    } else {
      if (result.is_creatable) {
        setCreatable(true);
        setCntContract(result.cnt_groups);
      } else {
        setCntContract('-');
      }
    }
    setConfirming(false);
  };

  const handleConfirm = async () => {
    if (selectedPackages.length === 0) return;

    setConfirming(true);

    navigation.navigate('preview-pro-cart-view');
    setConfirming(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Sélectionnez les modules</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => { navigation.popToTop() }}>
          <Ionicons name="close" size={26} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      {/* Stepper */}
      <Stepper currentStep={2} />

      {/* Loading */}
      {isLoading && !error &&
        <BouncingDots
          color={Colors.blue}
          size={10}
          bounceHeight={5}
          containerStyle={{
            backgroundColor: 'transparent',
            position: 'relative',
            top: Spacings.md,
            left: 0,
            right: 0,
            zIndex: 999,
            elevation: 5,
          }}
        />
      }
      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={64}
            color={Colors.danger}
          />
          <Text style={styles.errorTitle}>Erreur de chargement</Text>
          <Text style={styles.errorMessage}>
            Impossible de charger les formation
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Ionicons name="refresh" size={20} color={Colors.white} />
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !error && trainings &&
        (<>
          {paymentMethod.id !== '0'
            ? <View style={styles.titleBodyContainer}>
              <Text style={styles.bodyTitle}>Vous pouvez sélectionner plusieurs modules de formation. Votre dossier sera adapté en fonction de vos choix.</Text>
              <Text style={styles.headerSubtitle}>
                NB: selon la durée totale, plusieurs dossiers peuvent être créés automatiquement
              </Text>
            </View>
            : <View style={styles.titleBodyContainer}>
              <Text style={styles.bodyTitle}>Vous pouvez sélectionner plusieurs modules de formation.</Text>
            </View>
          }

          {/* Package Groups */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {trainings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={80} color={Colors.gray} />
                <Text style={styles.emptyTitle}>Aucun résultat</Text>
                <Text style={styles.emptySubtitle}>
                  Aucune formation ne correspond à votre recherche
                </Text>
              </View>
            ) : (
              <>
                {/* Render first group full width */}
                {trainings.length > 0 && (
                  <View style={styles.fullWidthGroupContainer}>
                    <View style={styles.groupContainer}>
                      {/* Group Title */}
                      <View style={styles.groupHeader}>
                        <Text style={styles.groupTitle}>{trainings[0].name}</Text>
                        <View style={styles.groupBadge}>
                          <Text style={styles.groupBadgeText}>
                            {trainings[0].packages.filter(c => !c.disabled_flg).length} disponible{trainings[0].packages.filter(c => !c.disabled_flg).length > 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>

                      {/* Packages Grid */}
                      <View style={styles.coursesGrid}>
                        {trainings[0].packages.map((packages) => (
                          <PackageCard
                            key={packages.id}
                            pkg={packages}
                            color={trainings[0].color}
                            backgroundColor={trainings[0].background_color}
                            isSelected={selectedPackages.includes(packages.id)}
                            onToggle={handleTogglePackage}
                            disabled={confirming}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                )}

                {/* Render remaining groups in 2 columns */}
                {trainings.length > 1 && (
                  <View style={styles.twoColumnGroupContainer}>
                    {trainings.slice(1).map((training) => (
                      <View key={training.id} style={styles.halfWidthGroupContainer}>
                        <View style={styles.groupContainer}>
                          {/* Group Title */}
                          <View style={styles.groupHeader}>
                            <Text style={styles.groupTitle}>{training.name}</Text>
                            <View style={styles.groupBadge}>
                              <Text style={styles.groupBadgeText}>
                                {training.packages.filter(c => !c.disabled_flg).length} dispo.
                              </Text>
                            </View>
                          </View>

                          {/* Packages Grid */}
                          <View style={styles.coursesGrid}>
                            {training.packages.map((packages) => (
                              <PackageCard
                                key={packages.id}
                                pkg={packages}
                                color={training.color}
                                backgroundColor={training.background_color}
                                isSelected={selectedPackages.includes(packages.id)}
                                onToggle={handleTogglePackage}
                                disabled={confirming}
                              />
                            ))}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            <View style={{ height: 100 }}></View>
          </ScrollView>

          {/* Confirm Button */}
          <View style={styles.confirmContainer}>
            <View style={styles.confirmInfo}>
              <Text style={styles.confirmLabel}>Formations</Text>
              <View style={styles.confirmStats}>
                <Text style={styles.confirmCount}>{selectedPackages.length}</Text>
                {selectedPackages.length > 0 &&
                  <View style={styles.hoursBadge}>
                    <Text style={styles.hoursText}>{totalHours} h</Text>
                  </View>
                }
              </View>
            </View>
            {paymentMethod.id !== '0' &&
              <View style={styles.dossierInfo}>
                <View style={styles.dossierLabelContainer}>
                  <Text style={styles.confirmLabel}>Dossiers</Text>
                  <TouchableOpacity
                    onPress={() => setShowTooltip(true)}
                    style={styles.tooltipButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="information-circle" size={20} color={creatable ? Colors.blue : Colors.warning} />
                  </TouchableOpacity>
                </View>
                <View style={styles.confirmStats}>
                  <Text style={styles.confirmCount}>{cntContract}</Text>
                </View>
              </View>
            }
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  selectedPackages.length === 0 && styles.confirmButtonDisabled,
                  (confirming || !creatable) && styles.confirmButtonDisabled
                ]}
                onPress={handleConfirm}
                disabled={selectedPackages.length === 0 || confirming || !creatable}
              >
                <Text style={[
                  styles.confirmButtonText,
                  selectedPackages.length === 0 && styles.confirmButtonTextDisabled,
                  (confirming || !creatable) && styles.confirmButtonTextDisabled
                ]}>
                  Confirmer
                </Text>
                {confirming ? (
                  <ActivityIndicator size={20} animating={true} color={Colors.gray} />
                ) : (
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={Colors.white}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </>)}

      {/* Tooltip Modal */}
      <Modal
        visible={showTooltip}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTooltip(false)}
      >
        <TouchableOpacity
          style={styles.tooltipOverlay}
          activeOpacity={1}
          onPress={() => setShowTooltip(false)}
        >
          <View style={styles.tooltipContainer}>
            <View style={styles.tooltipHeader}>
              <Ionicons name="information-circle" size={24} color={Colors.blue} />
              <Text style={styles.tooltipTitle}>Information sur les dossiers</Text>
              <TouchableOpacity
                onPress={() => setShowTooltip(false)}
                style={styles.tooltipCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipDescription}>
                Le nombre de dossiers est créé automatiquement selon le temps total des formations sélectionnées.
              </Text>

              <View style={styles.tooltipNotes}>
                <Text style={styles.tooltipNotesTitle}>Points importants</Text>

                {paymentMethod.terms?.map((term, index) => (
                  <View key={index} style={styles.tooltipNoteItem}>
                    <Text style={styles.tooltipBullet}>•</Text>
                    <Text style={styles.tooltipNoteText}>{term}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
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
  scrollContent: {
    padding: CONTAINER_PADDING,
    paddingTop: Spacings.lg,
    paddingBottom: Spacings.xl,
  },

  // Header
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  titleBodyContainer: {
    paddingVertical: Spacings.xl,
    paddingHorizontal: Spacings.lg,
  },
  bodyTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
  },

  // Search Bar
  searchContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.xs,
    paddingBottom: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
    borderRadius: 24,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.sm,
    gap: Spacings.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    paddingVertical: 0,
  },

  // Group Layout Containers
  fullWidthGroupContainer: {
    width: '100%',
    marginBottom: Spacings.sm,
  },
  twoColumnGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacings.lg,
  },
  halfWidthGroupContainer: {
    width: '48%',
  },

  // Group
  groupContainer: {
    marginBottom: Spacings.lg,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: Spacings.lg,
    gap: Spacings.md
  },
  groupTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  groupBadge: {
    backgroundColor: Colors.blueBackground,
    paddingHorizontal: Spacings.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  groupBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: Colors.blue,
  },

  // Packages Grid
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_SPACING,
  },

  // Package Card
  courseCard: {
    alignItems: 'center',
    marginBottom: Spacings.md,
  },
  courseCircle: {
    width: COURSE_SIZE - 4,
    height: COURSE_SIZE - 4,
    borderRadius: (COURSE_SIZE - 4) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: Spacings.xs,
    opacity: 0.8
  },
  courseCircleSelected: {
    opacity: 1,
  },
  courseCircleDisabled: {
    opacity: 0.6,
  },
  courseIcon: {
    fontSize: 24,
  },
  courseIconDisabled: {
    opacity: 0.8,
  },
  checkmarkOverlay: {
    position: 'absolute',
    top: -2,
    right: -1,
    backgroundColor: Colors.successBackground,
    borderRadius: 12,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: 0,
    right: -7,
    padding: 2,
  },
  courseName: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    textAlign: 'center',
    width: COURSE_SIZE,
    marginVertical: Spacings.xxs
  },
  courseNameSelected: {
    color: Colors.text,
    fontFamily: 'Poppins-Medium',
  },
  courseNameDisabled: {
    color: Colors.gray,
    opacity: 0.7,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.blueBackground,
    paddingHorizontal: Spacings.xs,
    paddingVertical: 2,
    borderRadius: 16,
  },
  durationBadgeDisabled: {
    backgroundColor: Colors.successBackground,
  },
  durationText: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: Colors.blue,
  },
  durationTextDisabled: {
    color: Colors.white,
    fontFamily: 'Poppins-Regular'
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacings.xxl * 2,
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

  // Confirm Button
  confirmContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.md,
    paddingBottom: Spacings.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  confirmInfo: {
    flex: 0.5,
  },
  confirmLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  confirmStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  confirmCount: {
    fontSize: 26,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
  },
  hoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
    backgroundColor: Colors.blueBackground,
    paddingHorizontal: Spacings.sm,
    paddingVertical: Spacings.xxs,
    borderRadius: 16,
  },
  hoursText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.blue,
  },
  dossierInfo: {
    flex: 0.5,
    borderLeftWidth: 1,
    borderColor: Colors.line,
    marginRight: Spacings.sm,
    paddingLeft: Spacings.sm,
  },
  actionButtonContainer: {
    flex: 1,
    justifyContent: 'center',

  },
  confirmButton: {
    backgroundColor: Colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.xxs,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.md,
    borderRadius: 24,
    elevation: 3,
    shadowColor: Colors.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    alignSelf: 'flex-end',
    minWidth: 400
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.gray,
    elevation: 0,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  confirmButtonTextDisabled: {
    color: Colors.white,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacings.xl,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginTop: Spacings.lg,
    marginBottom: Spacings.xs,
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: Spacings.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.sm,
    borderRadius: 8,
    gap: Spacings.xs,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },

  // Tooltip styles
  dossierLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tooltipButton: {
    padding: 2,
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacings.xl,
  },
  tooltipContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    gap: Spacings.sm,
  },
  tooltipTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  tooltipCloseButton: {
    padding: 4,
  },
  tooltipContent: {
    padding: Spacings.md,
  },
  tooltipDescription: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    lineHeight: 20,
    marginBottom: Spacings.md,
  },
  tooltipNotes: {
    backgroundColor: Colors.blueBackground,
    padding: Spacings.md,
    borderRadius: 8,
  },
  tooltipNotesTitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.blue,
    marginBottom: Spacings.sm,
  },
  tooltipNoteItem: {
    flexDirection: 'row',
    marginBottom: Spacings.xs,
  },
  tooltipBullet: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.blue,
    marginRight: Spacings.xs,
    marginTop: 2,
  },
  tooltipNoteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    lineHeight: 18,
  },
});