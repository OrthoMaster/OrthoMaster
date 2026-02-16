import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';

import Colors from "../../../constants/Colors";
import Spacings from "../../../constants/Spacings";

import LessonLogoIcon from './components/LessonLogoIcon';
import { getPackage } from "../../services/v2/TrainingService";
import { useQuery } from "@tanstack/react-query";

import { BouncingDots } from '../../component/LoadingDots';
import { SCREEN_HEIGHT } from '@gorhom/bottom-sheet';

const { width, height } = Dimensions.get('window');
const isTablet = Platform.OS !== 'web' && width >= 768;

export const TrainingView = ({ navigation, route }) => {
  // Hide bottom nav when screen is focused, show when blur
  useFocusEffect(
    useCallback(() => {
      // Hide tabbar when this screen is focused
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' }
      });
    }, [navigation])
  );

  // Get params from route
  const {
    pkgId,
    trainingName,
    backgroundColor = Colors.blue,
    lightColor = Colors.blueBackground
  } = route?.params;

  // Fetch package data from database
  const { data: pkg, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['packages', pkgId],
    queryFn: () => getPackage(pkgId),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: 1000,
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [isLayoutComplete, setIsLayoutComplete] = useState(false);
  const [hasScrolledToSelected, setHasScrolledToSelected] = useState(false);
  const modulePositions = useRef<{ moduleIndex: number, startY: number, endY: number }[]>([]);
  const lessonPositions = useRef<{ lessonId: number, y: number }[]>([]);
  const isInitialMount = useRef(true);

  // Animation values for message box
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animation values for selected lesson pulse effect
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Colors for modules
  const moduleColors = [Colors.primaryLight, Colors.lgreen, Colors.lblue, Colors.red, Colors.yellow, Colors.purple, Colors.green];

  // Filter out backgroundColor from moduleColors if it matches the first color
  const filteredModuleColors = useMemo(() => {
    if (backgroundColor === moduleColors[0]) {
      return moduleColors.slice(1); // Skip first color
    }
    return moduleColors;
  }, [backgroundColor]);

  // Refetch when screen is focused (goBack from other screen)
  useFocusEffect(
    useCallback(() => {
      // Skip refetch on initial mount
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      
      // Refetch data khi goBack để lấy selected_flg mới nhất
      refetch().then(() => {
        // Reset scroll state để trigger auto-scroll lại
        setHasScrolledToSelected(false);
        setSelectedLessonId(null);
      });
    }, [refetch])
  );

  // Helper function to lighten a hex color (mix with white)
  const lightenColor = (color: string, amount: number = 0.75) => {
    // If color is hex format #RRGGBB
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      // Mix with white (255, 255, 255) based on amount
      const newR = Math.round(r + (255 - r) * amount);
      const newG = Math.round(g + (255 - g) * amount);
      const newB = Math.round(b + (255 - b) * amount);

      // Convert back to hex
      const toHex = (n: number) => {
        const hex = n.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };

      return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
    }
    return color;
  };

  // Get colors for lesson (background and icon)
  const getLessonColors = (moduleIndex: number, lesson: any) => {
    // Get the base module color
    let moduleColor;
    if (moduleIndex === 0) {
      moduleColor = backgroundColor;
    } else {
      moduleColor = filteredModuleColors[(moduleIndex - 1) % filteredModuleColors.length];
    }

    // If lesson is active, return original behavior
    if (lesson.completed_flg) {
      return {
        primaryColor: moduleColor,
        secondaryColor: Colors.white // Use default from LessonLogoIcon
      };
    }

    // If lesson is inactive
    if (moduleIndex === 0) {
      return {
        primaryColor: lightColor,
        secondaryColor: backgroundColor
      };
    } else {
      // Module > 0, inactive: background = lightened module color, icon = module color
      return {
        primaryColor: lightenColor(moduleColor, 0.40), // 40% lighter
        secondaryColor: moduleColor
      };
    }
  };

  // Get current module color for message box
  const getCurrentModuleColor = () => {
    if (!pkg?.modules) return backgroundColor;
    if (currentModuleIndex === 0) {
      return backgroundColor;
    }
    return filteredModuleColors[(currentModuleIndex - 1) % filteredModuleColors.length];
  };

  // Get current module name
  const getCurrentModuleName = () => {
    return pkg?.modules?.[currentModuleIndex]?.name || '';
  };

  // Find first inactive lesson OR selected lesson
  const findSelectedLesson = useCallback(() => {
    if (!pkg?.modules) return null;

    // First, check if any lesson has selected flag
    for (const module of pkg.modules) {
      for (const lesson of module.lessons) {
        if (lesson.selected_flg) {
          return lesson;
        }
      }
    }

    // If no lesson is marked as selected, find first inactive
    for (const module of pkg.modules) {
      for (const lesson of module.lessons) {
        if (!lesson.completed_flg) {
          return lesson;
        }
      }
    }

    return null;
  }, [pkg?.modules]);

  // Animate message box when module changes
  useEffect(() => {
    // Fade out and scale down
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Fade in and scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    });
  }, [currentModuleIndex]);

  // Pulse animation for selected lesson
  useEffect(() => {
    if (selectedLessonId && hasScrolledToSelected) {
      // Start pulse animation after scroll completes
      const timer = setTimeout(() => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [selectedLessonId, hasScrolledToSelected]);

  // Auto-scroll to selected lesson when layout is complete
  useEffect(() => {
    if (!isLayoutComplete || !pkg || hasScrolledToSelected) return;

    const selectedLesson = findSelectedLesson();
    if (selectedLesson && lessonPositions.current.length > 0) {
      // Set as selected
      setSelectedLessonId(selectedLesson.id);

      // Find the Y position of this lesson
      const lessonPos = lessonPositions.current.find(pos => pos.lessonId === selectedLesson.id);
      if (lessonPos && scrollViewRef.current) {
        // Delay to ensure smooth animation after mount
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, lessonPos.y + 5),
            animated: true
          });

          // Mark as scrolled
          setTimeout(() => {
            setHasScrolledToSelected(true);
          }, 300);
        }, 200);
      }
    }
  }, [isLayoutComplete, findSelectedLesson, pkg, hasScrolledToSelected]);

  // Check if all layouts are complete
  useEffect(() => {
    if (!pkg) return;
    // Wait for layout to complete
    const timer = setTimeout(() => {
      setIsLayoutComplete(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [pkg]);

  // Handle scroll to track current module
  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;

    // Find which module is currently in view based on scroll position
    for (let i = modulePositions.current.length - 1; i >= 0; i--) {
      const modulePos = modulePositions.current[i];
      // Check if scrollY is within this module's range
      if (scrollY >= modulePos.startY && scrollY < modulePos.endY) {
        if (modulePos.moduleIndex !== currentModuleIndex) {
          setCurrentModuleIndex(modulePos.moduleIndex);
        }
        return;
      }
    }

    // If scrollY is before first module or between modules, use the closest one
    if (modulePositions.current.length > 0) {
      for (let i = 0; i < modulePositions.current.length; i++) {
        const modulePos = modulePositions.current[i];
        if (scrollY < modulePos.startY) {
          if (i > 0 && modulePositions.current[i - 1].moduleIndex !== currentModuleIndex) {
            setCurrentModuleIndex(modulePositions.current[i - 1].moduleIndex);
          }
          return;
        }
      }

      // If we're past all modules, use the last one
      const lastModule = modulePositions.current[modulePositions.current.length - 1];
      if (lastModule.moduleIndex !== currentModuleIndex) {
        setCurrentModuleIndex(lastModule.moduleIndex);
      }
    }
  };

  // Generate dynamic pattern that always ends at 40% smoothly
  const generatePattern = (totalLessons: number) => {
    // Base pattern: 40%-50%-60%-50%-40%-30%-20%-30%
    const basePattern = [40, 50, 60, 50, 40, 30, 20, 30];

    if (totalLessons <= 1) return [40];

    // For lessons that fit within one cycle
    if (totalLessons <= basePattern.length) {
      let pattern = [];

      // Try to find a natural segment that ends at or near 40
      // basePattern indices where value is 40: 0, 4
      if (totalLessons <= 4) {
        // Use first part: 40, 50, 60, 50, (40)
        pattern = basePattern.slice(0, totalLessons);
        // Adjust last to be 40
        pattern[pattern.length - 1] = 40;
      } else if (totalLessons === 5) {
        // 40, 50, 60, 50, 40
        pattern = [40, 50, 60, 50, 40];
      } else if (totalLessons === 6) {
        // 40, 50, 60, 50, 40, 30 -> adjust to 40, 50, 60, 50, 45, 40
        pattern = [40, 50, 60, 50, 45, 40];
      } else if (totalLessons === 7) {
        // 40, 50, 60, 50, 40, 30, 35, 40
        pattern = [40, 50, 60, 50, 40, 30, 35, 40];
      } else {
        // totalLessons === 8
        // 40, 50, 60, 50, 40, 30, 20, 30 -> adjust to end at 40
        pattern = [40, 50, 60, 50, 40, 30, 20, 30];
        pattern.push(40); // Add one more to end at 40
      }

      return pattern.slice(0, totalLessons);
    }

    // For longer lessons, repeat base pattern and ensure smooth ending at 40
    const fullCycles = Math.floor(totalLessons / basePattern.length);
    const remainder = totalLessons % basePattern.length;

    let pattern = [];

    // Add full cycles
    for (let i = 0; i < fullCycles; i++) {
      pattern = [...pattern, ...basePattern];
    }

    // Handle remainder to smoothly end at 40
    if (remainder === 0) {
      // Perfect fit, but last element is 30, need to transition to 40
      pattern.push(35);
      pattern.push(40);
    } else if (remainder === 1) {
      pattern.push(40);
    } else if (remainder === 2) {
      pattern.push(45);
      pattern.push(40);
    } else if (remainder === 3) {
      pattern.push(50);
      pattern.push(45);
      pattern.push(40);
    } else if (remainder === 4) {
      pattern.push(50);
      pattern.push(60);
      pattern.push(50);
      pattern.push(40);
    } else if (remainder === 5) {
      pattern.push(50);
      pattern.push(60);
      pattern.push(50);
      pattern.push(45);
      pattern.push(40);
    } else if (remainder === 6) {
      pattern.push(50);
      pattern.push(60);
      pattern.push(50);
      pattern.push(40);
      pattern.push(35);
      pattern.push(40);
    } else {
      // remainder === 7
      pattern.push(50);
      pattern.push(60);
      pattern.push(50);
      pattern.push(40);
      pattern.push(30);
      pattern.push(35);
      pattern.push(40);
    }

    return pattern;
  };

  // Lesson Item Component
  const LessonItem = ({ lesson, index, moduleIndex, isFirstInModule, totalLessonsInModule }: {
    lesson: any;
    index: number;
    moduleIndex: number;
    isFirstInModule?: boolean;
    totalLessonsInModule: number;
  }) => {
    // Generate pattern for this module
    const pattern = useMemo(() => generatePattern(totalLessonsInModule), [totalLessonsInModule]);
    const indentPercentage = pattern[index] || 40;

    const { primaryColor: lessonBgColor, secondaryColor } = getLessonColors(moduleIndex, lesson);
    const isSelected = lesson.selected_flg || selectedLessonId === lesson.id;

    return (
      <TouchableOpacity
        onPress={() => handleShowLesson(lesson)}
        style={[
          styles.lessonItem,
          { marginLeft: `${indentPercentage}%` },
          isFirstInModule && { marginTop: Spacings.md }
        ]}
        onLayout={(event) => {
          const layout = event.nativeEvent.layout;
          // Store lesson position for auto-scroll
          const existingIndex = lessonPositions.current.findIndex(pos => pos.lessonId === lesson.id);
          const lessonPos = {
            lessonId: lesson.id,
            y: layout.y
          };

          if (existingIndex >= 0) {
            lessonPositions.current[existingIndex] = lessonPos;
          } else {
            lessonPositions.current.push(lessonPos);
          }
        }}
      >
        <Animated.View
          style={{
            transform: isSelected ? [{ scale: pulseAnim }] : [{ scale: 1 }]
          }}
        >
          <LessonLogoIcon
            color={lessonBgColor}
            secondaryColor={secondaryColor}
            size={isTablet ? 120 : 90}
            image={lesson.image}
            passed={lesson.completed_flg}
            selected={isSelected}
            type={lesson.type || 'lesson'}
            key={lesson.id}
          />
        </Animated.View>

        <Text style={styles.lessonTitle}>{lesson.title}</Text>
      </TouchableOpacity>
    );
  };

  // Module Section with lessons
  const ModuleSection = ({ module, moduleIndex }: {
    module: any;
    moduleIndex: number;
  }) => {
    // Tính màu cho module header
    const moduleHeaderColor = useMemo(() => {
      if (moduleIndex === 0) {
        return backgroundColor;
      }
      return filteredModuleColors[(moduleIndex - 1) % filteredModuleColors.length];
    }, [moduleIndex]);

    return (
      <View
        style={styles.moduleSection}
        onLayout={(event) => {
          const layout = event.nativeEvent.layout;
          // Store module position
          const existingIndex = modulePositions.current.findIndex(m => m.moduleIndex === moduleIndex);
          const modulePos = {
            moduleIndex: moduleIndex,
            startY: layout.y,
            endY: layout.y + layout.height
          };

          if (existingIndex >= 0) {
            modulePositions.current[existingIndex] = modulePos;
          } else {
            modulePositions.current.push(modulePos);
          }

          // Sort by startY
          modulePositions.current.sort((a, b) => a.startY - b.startY);
        }}
      >
        {/* Module Header với màu động */}
        <Text style={[styles.moduleHeader, { color: moduleHeaderColor }]}>
          {module.name}
        </Text>

        {/* Lessons */}
        {module.lessons.map((lesson, index) => (
          <LessonItem
            key={index}
            lesson={lesson}
            index={index}
            moduleIndex={moduleIndex}
            isFirstInModule={index === 0}
            totalLessonsInModule={module.lessons.length}
          />
        ))}
      </View>
    );
  };

  // Handle show lesson content
  const handleShowLesson = ((lesson: any) => {
    // if (lesson.content_id) {
    navigation.navigate('lesson-content-xml', {
      pkgId: pkgId,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      pkgName: pkg.name,
      trainingName: trainingName,
    })
  });

  // Handle close modal
  const closeModal = () => {
    navigation.goBack();
  };

  // Handle error state
  useEffect(() => {
    if (error) {
      Alert.alert(
        'Erreur',
        'Erreur de chargement.',
        [
          { text: 'Réessayer', onPress: () => refetch() },
          { text: 'Fermer', onPress: closeModal, style: 'cancel' }
        ]
      );
    }
  }, [error]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: backgroundColor }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />

      <GestureHandlerRootView style={[styles.moduleNameContainer, backgroundColor]}>
        {/* New Header */}
        <View style={[styles.header, { backgroundColor }, isTablet && { height: 100 }]}>
          <TouchableOpacity style={styles.backButton} onPress={closeModal}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTrainingName}>{trainingName}</Text>
            <Text style={styles.headerPackageName}>{pkg?.name ?? '---'}</Text>
          </View>

          {/* Refresh button */}
          {isFetching && (
            <ActivityIndicator size="small" color={Colors.white} style={{ marginLeft: Spacings.sm }} />
          )}
        </View>


        {/* Loading */}
        {(isLoading || isFetching) && !error && (
          <BouncingDots
            color={Colors.blue}
            size={10}
            bounceHeight={5}
            containerStyle={{
              position: 'absolute',
              backgroundColor: 'transparent',
              zIndex: 999,
              elevation: 5,
              bottom: 0,
              left: '45%',
            }}
          />
        )}
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

        {/* Module Message Box with Animation */}
        {pkg &&
          <Animated.View
            style={[
              styles.moduleMessageBox,
              {
                backgroundColor: getCurrentModuleColor(),
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <Text style={styles.moduleMessageSubtext}>Module</Text>
            <Text style={styles.moduleMessageText}>{getCurrentModuleName()}</Text>
          </Animated.View>
        }

        {/* Content */}
        {pkg &&
          <View style={styles.contentContainer}>
            {/* Course - Snake Path */}
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {pkg.modules.map((module, moduleIndex) => (
                <ModuleSection
                  key={module.id}
                  module={module}
                  moduleIndex={moduleIndex}
                />
              ))}
              <View style={{ height: SCREEN_HEIGHT - 380 }} />
            </ScrollView>
          </View>
        }
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // New Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
    paddingTop: Platform.OS === 'ios' ? Spacings.sm : Spacings.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: Spacings.xs,
  },
  headerTrainingName: {
    fontSize: 12,
    fontFamily: 'Roboto',
    color: Colors.white,
    opacity: 0.9,
    lineHeight: 16,
  },
  headerPackageName: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    lineHeight: 20,
    textAlign: 'right',
    width: '85%',
  },

  // Module Message Box
  moduleNameContainer: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
    fontFamily: 'Roboto',
  },
  moduleMessageBox: {
    marginHorizontal: Spacings.lg,
    marginTop: Spacings.sm,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.md,
    borderRadius: 8,
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  moduleMessageText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  moduleMessageSubtext: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: Colors.grayLight,
    marginBottom: -2,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacings.lg,
    backgroundColor: Colors.darkBackground,
  },

  // Module and Lesson Styles
  moduleSection: {
    marginBottom: Spacings.xl,
  },
  moduleHeader: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: Spacings.sm,
  },
  lessonItem: {
    marginBottom: Spacings.lg,
    alignItems: 'flex-start',
  },
  lessonTitle: {
    fontSize: 14,
    fontFamily: 'Roboto',
    fontWeight: '400',
    marginTop: Spacings.sm,
    marginBottom: Spacings.md,
    color: Colors.subtext2,
    width: isTablet ? 200 : 150,
    marginLeft: isTablet ? - 50 : -30,
    textAlign: 'center',
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacings.md,
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
});