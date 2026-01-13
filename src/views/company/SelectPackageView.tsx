import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  TextInput,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native-paper';
import { useQuery } from "@tanstack/react-query";
import { getTrainings, addPackages } from '../../services/v2/CartService';

import Stepper from './components/Stepper';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { BouncingDots } from '../../component/LoadingDots';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COURSES_PER_ROW = 5;
const CARD_SPACING = Spacings.xs;
const CONTAINER_PADDING = Spacings.lg;
const COURSE_SIZE = (SCREEN_WIDTH - (CONTAINER_PADDING * 2) - (CARD_SPACING * (COURSES_PER_ROW - 1))) / COURSES_PER_ROW;

interface Package {
  id: string;
  name: string;
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
      activeOpacity={isDisabled ? 1 : 0.7}
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
        { backgroundColor: isDisabled ? Colors.grayLight : backgroundColor },
        isSelected && styles.courseCircleSelected,
        isDisabled && styles.courseCircleDisabled
      ]}>
        {/* Icon */}
        <Text style={[
          styles.courseIcon,
          isDisabled && styles.courseIconDisabled
        ]}>
          📚
        </Text>

        {/* Checkmark Overlay for Selected */}
        {isSelected && !isDisabled && (
          <View style={styles.checkmarkOverlay}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          </View>
        )}

        {/* Lock Icon for Disabled */}
        {isDisabled && (
          <View style={styles.lockOverlay}>
            <MaterialCommunityIcons name="check-decagram" size={20} color={color || Colors.success} />
          </View>
        )}
      </View>

      {/* Duration Badge */}
      <View style={[
        styles.durationBadge,
        isDisabled && [styles.durationBadgeDisabled, { backgroundColor: backgroundColor || Colors.successBackground }]
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
          isDisabled && [styles.durationTextDisabled, { color: color || Colors.success }]
        ]}>
          {isDisabled ? 'Activé' : pkg.duration_text}
        </Text>
      </View>

      {/* Package Name */}
      <Text
        style={[
          styles.courseName,
          isSelected && styles.courseNameSelected,
          isDisabled && styles.courseNameDisabled
        ]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {pkg.name}
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
  const [searchQuery, setSearchQuery] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [creatable, setCreatable] = useState(false);
  const [cntContract, setCntContract] = useState('-');
  const [showTooltip, setShowTooltip] = useState(false);

  // Filter courses based on search
  const filteredGroups = useMemo(() => {
    if (!trainings || !Array.isArray(trainings)) {
      return [];
    }

    if (!searchQuery.trim()) {
      return trainings;
    }

    const query = searchQuery.toLowerCase();
    return trainings
      .map(training => ({
        ...training,
        packages: training.packages.filter(pkg =>
          pkg.name.toLowerCase().includes(query)
        )
      }))
      .filter(training => training.packages.length > 0);
  }, [searchQuery, trainings]);

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
      Alert.alert('Erreur', 'Impossible de mettre à jour les formations !');
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

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleConfirm = async () => {
    if (selectedPackages.length === 0) return;

    setConfirming(true);

    navigation.navigate('preview-pro-cart-view');
    setConfirming(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

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
            <Text style={styles.headerTitle}>Choisir les formations</Text>
            <Text style={styles.headerSubtitle}>
              Sélectionnez les cours pour vos membres
            </Text>
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
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={Colors.gray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher une formation..."
                placeholderTextColor={Colors.gray}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch}>
                  <Ionicons name="close-circle" size={20} color={Colors.gray} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Package Groups */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredGroups.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={80} color={Colors.gray} />
                <Text style={styles.emptyTitle}>Aucun résultat</Text>
                <Text style={styles.emptySubtitle}>
                  Aucune formation ne correspond à votre recherche
                </Text>
              </View>
            ) : (
              filteredGroups.map((training) => (
                <View key={training.id} style={styles.groupContainer}>
                  {/* Group Title */}
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupTitle}>{training.name}</Text>
                    <View style={styles.groupBadge}>
                      <Text style={styles.groupBadgeText}>
                        {training.packages.filter(c => !c.disabled_flg).length} disponible{training.packages.filter(c => !c.disabled_flg).length > 1 ? 's' : ''}
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
              ))
            )}

            {/* Spacer for bottom button */}
            <View style={{ height: 120 }} />
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
                    <Ionicons name="information-circle" size={16} color={creatable ? Colors.blue : Colors.warning} />
                  </TouchableOpacity>
                </View>
                <View style={styles.confirmStats}>
                  <Text style={styles.confirmCount}>{cntContract}</Text>
                </View>
              </View>
            }

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
                  color={!creatable ? Colors.gray : Colors.white}
                />
              )}
            </TouchableOpacity>
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
                Les dossiers représentent le nombre de contrats des formations sélectionnées.
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
  scrollContent: {
    padding: CONTAINER_PADDING,
    paddingTop: Spacings.sm,
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    flex: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: -4,
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

  // Group
  groupContainer: {
    marginBottom: Spacings.lg,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacings.md,
  },
  groupTitle: {
    width: '70%',
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
  },
  courseCircleSelected: {
    borderColor: Colors.success,
    borderWidth: 2,
  },
  courseCircleDisabled: {
    opacity: 0.5,
  },
  courseIcon: {
    fontSize: 24,
  },
  courseIconDisabled: {
    opacity: 0.5,
  },
  checkmarkOverlay: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.successBackground,
    borderRadius: 12,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    padding: 2,
  },
  courseName: {
    fontSize: 9,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  durationBadgeDisabled: {
    backgroundColor: Colors.successBackground,
    opacity: 0.7,
  },
  durationText: {
    fontSize: 8,
    fontFamily: 'Poppins-Medium',
    color: Colors.blue,
  },
  durationTextDisabled: {
    color: Colors.success,
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
    paddingBottom: Spacings.xxl,
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
    flex: 1,
  },
  confirmLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  confirmStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  confirmCount: {
    fontSize: 20,
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
    flex: 1,
    borderLeftWidth: 1,
    borderColor: Colors.line,
    marginRight: Spacings.sm,
    paddingLeft: Spacings.sm,
  },
  confirmButton: {
    backgroundColor: Colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xxs,
    paddingVertical: Spacings.xs,
    paddingHorizontal: Spacings.md,
    borderRadius: 24,
    elevation: 3,
    shadowColor: Colors.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.grayLight,
    elevation: 0,
  },
  confirmButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  confirmButtonTextDisabled: {
    color: Colors.gray,
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