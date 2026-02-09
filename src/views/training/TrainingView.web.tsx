import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import { ActivityIndicator, Portal, Dialog, Button } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from "../../../constants/Colors";
import Spacings from "../../../constants/Spacings";
import { Styles } from "../../../constants/Styles";

import LessonLogoIcon from './components/LessonLogoIcon';
import { getPackage } from "../../services/v2/TrainingService";
import { useQuery } from "@tanstack/react-query";

import { BouncingDots } from '../../component/LoadingDots';

export const TrainingView = ({ navigation, route }) => {
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

  // Dialog state (replacing Alert)
  const [showErrorDialog, setShowErrorDialog] = useState(false);

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
      return moduleColors.slice(1);
    }
    return moduleColors;
  }, [backgroundColor]);

  // Helper function to lighten a hex color
  const lightenColor = (color: string, amount: number = 0.75) => {
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      const newR = Math.round(r + (255 - r) * amount);
      const newG = Math.round(g + (255 - g) * amount);
      const newB = Math.round(b + (255 - b) * amount);

      const toHex = (n: number) => {
        const hex = n.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };

      return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
    }
    return color;
  };

  // Get colors for lesson
  const getLessonColors = (moduleIndex: number, lesson: any) => {
    let moduleColor;
    if (moduleIndex === 0) {
      moduleColor = backgroundColor;
    } else {
      moduleColor = filteredModuleColors[(moduleIndex - 1) % filteredModuleColors.length];
    }

    if (lesson.completed_flg) {
      return {
        primaryColor: moduleColor,
        secondaryColor: Colors.white
      };
    }

    if (moduleIndex === 0) {
      return {
        primaryColor: lightColor,
        secondaryColor: backgroundColor
      };
    } else {
      return {
        primaryColor: lightenColor(moduleColor, 0.40),
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

    for (const module of pkg.modules) {
      for (const lesson of module.lessons) {
        if (lesson.selected_flg) {
          return lesson;
        }
      }
    }

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
      setSelectedLessonId(selectedLesson.id);

      const lessonPos = lessonPositions.current.find(pos => pos.lessonId === selectedLesson.id);
      if (lessonPos && scrollViewRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, lessonPos.y + 5),
            animated: true
          });

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
    const timer = setTimeout(() => {
      setIsLayoutComplete(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [pkg]);

  // Handle scroll to track current module
  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;

    for (let i = modulePositions.current.length - 1; i >= 0; i--) {
      const modulePos = modulePositions.current[i];
      if (scrollY >= modulePos.startY && scrollY < modulePos.endY) {
        if (modulePos.moduleIndex !== currentModuleIndex) {
          setCurrentModuleIndex(modulePos.moduleIndex);
        }
        return;
      }
    }

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

      const lastModule = modulePositions.current[modulePositions.current.length - 1];
      if (lastModule.moduleIndex !== currentModuleIndex) {
        setCurrentModuleIndex(lastModule.moduleIndex);
      }
    }
  };

  // Generate dynamic pattern that always ends at 40% smoothly
  const generatePattern = (totalLessons: number) => {
    const basePattern = [40, 50, 60, 50, 40, 30, 20, 30];

    if (totalLessons <= 1) return [40];

    if (totalLessons <= basePattern.length) {
      let pattern = [];

      if (totalLessons <= 4) {
        pattern = basePattern.slice(0, totalLessons);
        pattern[pattern.length - 1] = 40;
      } else if (totalLessons === 5) {
        pattern = [40, 50, 60, 50, 40];
      } else if (totalLessons === 6) {
        pattern = [40, 50, 60, 50, 45, 40];
      } else if (totalLessons === 7) {
        pattern = [40, 50, 60, 50, 40, 30, 35, 40];
      } else {
        pattern = [40, 50, 60, 50, 40, 30, 20, 30];
        pattern.push(40);
      }

      return pattern.slice(0, totalLessons);
    }

    const fullCycles = Math.floor(totalLessons / basePattern.length);
    const remainder = totalLessons % basePattern.length;

    let pattern = [];

    for (let i = 0; i < fullCycles; i++) {
      pattern = [...pattern, ...basePattern];
    }

    if (remainder === 0) {
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
            size={90}
            image={lesson.image}
            passed={lesson.completed_flg}
            selected={isSelected}
            type={lesson.type || 'lesson'}
            key={lesson.id}
          />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Module Section with lessons
  const ModuleSection = ({ module, moduleIndex }: {
    module: any;
    moduleIndex: number;
  }) => {
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

          modulePositions.current.sort((a, b) => a.startY - b.startY);
        }}
      >
        <Text style={[
          styles.moduleHeader,
          { color: moduleHeaderColor }
        ]}>
          {module.name}
        </Text>

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
    navigation.navigate('lesson-content-xml', {
      pkgId: pkgId,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      pkgName: pkg.name,
      trainingName: trainingName,
    })
  });

  // Handle close modal
  const handleClose = () => {
    navigation.goBack();
  };

  // Handle error state (replacing Alert with Dialog)
  useEffect(() => {
    if (error) {
      setShowErrorDialog(true);
    }
  }, [error]);

  return (
    <>
      {/* Overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        {/* Training Panel */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.trainingPanel}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[
            styles.header,
            { backgroundColor }
          ]}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTrainingName}>
                {trainingName}
              </Text>
              <Text style={styles.headerPackageName}>
                {pkg?.name ?? '---'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={handleClose}
            >
              <Ionicons
                name="close"
                size={28}
                color={Colors.white}
              />
            </TouchableOpacity>

            {isFetching && (
              <ActivityIndicator
                size="small"
                color={Colors.white}
                style={{ marginLeft: Spacings.sm }}
              />
            )}
          </View>

          <View style={styles.moduleNameContainer}>
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

            {/* Error */}
            {error && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={64}
                  color={Colors.danger}
                />
                <Text style={styles.errorTitle}>
                  Erreur de chargement
                </Text>
                <Text style={styles.errorMessage}>
                  Impossible de charger les formation
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => refetch()}
                >
                  <Ionicons
                    name="refresh"
                    size={20}
                    color={Colors.white}
                  />
                  <Text style={styles.retryButtonText}>
                    Réessayer
                  </Text>
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
                <Text style={styles.moduleMessageSubtext}>
                  Module
                </Text>
                <Text style={styles.moduleMessageText}>
                  {getCurrentModuleName()}
                </Text>
              </Animated.View>
            }

            {/* Content */}
            {pkg &&
              <View style={styles.contentContainer}>
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
                  <View style={{
                    height: Dimensions.get('window').height - 380
                  }} />
                </ScrollView>
              </View>
            }
          </View>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Portal Dialog (replacing Alert) */}
      <Portal>
        <Dialog
          visible={showErrorDialog}
          onDismiss={() => setShowErrorDialog(false)}
          style={styles.dialogWeb}
        >
          <Dialog.Title style={[
            Styles.dialogWebTitle,
            { color: Colors.danger }
          ]}>
            Erreur
          </Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>
              Erreur de chargement.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={Colors.gray}
              labelStyle={{
                fontFamily: 'Poppins-Medium'
              }}
              onPress={handleClose}
            >
              Fermer
            </Button>
            <Button
              textColor={Colors.primary}
              labelStyle={{
                fontFamily: 'Poppins-Medium'
              }}
              onPress={() => {
                setShowErrorDialog(false);
                refetch();
              }}
            >
              Réessayer
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
  trainingPanel: {
    width: 700,
    height: '100%',
    backgroundColor: Colors.darkBackground,
    shadowColor: Colors.black,
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacings.lg,
    height: 100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255, 0.1)',

  },
  headerTextContainer: {
    flex: 1,
  },
  headerTrainingName: {
    fontSize: 14,
    fontFamily: 'Roboto',
    color: Colors.white,
    opacity: 0.9,
  },
  headerPackageName: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  moduleNameContainer: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: Colors.darkBackground,
  },
  moduleMessageBox: {
    marginHorizontal: Spacings.lg,
    marginTop: Spacings.sm,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.md,
    borderRadius: 8,
    elevation: 4,
    shadowOffset: {
      width: 0,
      height: 3
    },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  moduleMessageText: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  moduleMessageSubtext: {
    fontSize: 14,
    fontFamily: 'Poppins-Light',
    color: Colors.grayLight,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacings.lg,
    backgroundColor: Colors.darkBackground,
  },
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
  lessonCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
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

  // Dialog Styles
  dialogWeb: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    maxWidth: 400,
    alignSelf: 'center',
    position: 'absolute',
  },
});