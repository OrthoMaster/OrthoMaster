import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Colors from "../../../constants/Colors";
import Spacings from "../../../constants/Spacings";
import { Styles } from "../../../constants/Styles";

import LessonLogoIcon from './components/LessonLogoIcon';
import { SCREEN_HEIGHT } from '@gorhom/bottom-sheet';

// Sample data for demo
const SAMPLE_DATA = {
  name: "Formation Orthodontie Avancée",
  description: "Une formation complète pour maîtriser les techniques d'orthodontie moderne. Apprenez les dernières innovations et perfectionnez vos compétences cliniques.",
  trainingName: "Orthodontie Pro",
  packageName: "Pack Expert 2024",
  backgroundColor: Colors.blue,
  available_flg: true,
  modules: [
    {
      id: 1,
      name: "Introduction à l'orthodontie et Bases de l'orthodontie",
      lessons: [
        { id: 1, title: "Bases de l'orthodontie", active_flg: true },
        { id: 2, title: "Anatomie dentaire", active_flg: true },
        { id: 3, title: "Outils et équipements", active_flg: true, selected: true },
      ]
    },
    {
      id: 2,
      name: "Diagnostic et planification",
      lessons: [
        { id: 5, title: "Examen clinique", active_flg: true },
        { id: 6, title: "Radiographie", active_flg: true },
        { id: 7, title: "Analyse céphalométrique", active_flg: true },
        { id: 8, title: "Plan de traitement", active_flg: false },
        { id: 9, title: "Cas complexes", active_flg: false },
      ]
    },
    {
      id: 3,
      name: "Techniques avancées",
      lessons: [
        { id: 10, title: "Brackets autoligaturants", active_flg: false },
        { id: 11, title: "Aligneurs invisibles", active_flg: false },
        { id: 12, title: "Mini-vis d'ancrage", active_flg: false },
        { id: 13, title: "Chirurgie orthognatique", active_flg: false },
        { id: 14, title: "Chirurgie orthognatique 2", active_flg: false, type: "test" },
      ]
    },
    {
      id: 4,
      name: "Pratique clinique",
      lessons: [
        { id: 15, title: "Cas pratiques", active_flg: true },
        { id: 16, title: "Gestion des complications", active_flg: false },
        { id: 17, title: "Suivi post-traitement", active_flg: false },
      ]
    },
    {
      id: 5,
      name: "Pratique clinique 2",
      lessons: [
        { id: 18, title: "Cas pratiques", active_flg: true },
      ]
    }
  ]
};

export const TrainingView = ({ navigation, route }) => {
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

  // Use sample data if no route params
  const {
    pkg = SAMPLE_DATA,
    trainingName = SAMPLE_DATA.trainingName,
    packageName = SAMPLE_DATA.packageName,
    backgroundColor = SAMPLE_DATA.backgroundColor
  } = route?.params || { pkg: SAMPLE_DATA, trainingName: SAMPLE_DATA.trainingName, packageName: SAMPLE_DATA.packageName, backgroundColor: SAMPLE_DATA.backgroundColor };

  const scrollViewRef = useRef<ScrollView>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const modulePositions = useRef<{ moduleIndex: number, startY: number, endY: number }[]>([]);

  // Animation values for message box
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Colors for modules
  const moduleColors = [Colors.green, Colors.warning, Colors.blue, Colors.danger, Colors.primary, Colors.info];

  // Filter out backgroundColor from moduleColors if it matches the first color
  const filteredModuleColors = useMemo(() => {
    if (backgroundColor === moduleColors[0]) {
      return moduleColors.slice(1); // Skip first color
    }
    return moduleColors;
  }, [backgroundColor]);

  // Get color for module
  const getModuleColor = (moduleIndex: number, lesson: any) => {
    if (!lesson.active_flg) {
      return Colors.gray;
    }
    if (moduleIndex === 0) {
      return backgroundColor;
    }
    return filteredModuleColors[(moduleIndex - 1) % filteredModuleColors.length];
  };

  // Get current module color for message box
  const getCurrentModuleColor = () => {
    if (currentModuleIndex === 0) {
      return backgroundColor;
    }
    return filteredModuleColors[(currentModuleIndex - 1) % filteredModuleColors.length];
  };

  // Get current module name
  const getCurrentModuleName = () => {
    return pkg.modules[currentModuleIndex]?.name || '';
  };

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

      // Find best starting point in base pattern
      // We want to end at 40, so work backwards
      const targetEnd = 40;

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

    const lessonColor = getModuleColor(moduleIndex, lesson);

    return (
      <TouchableOpacity
        onPress={() => handleShowLesson(lesson)}
        style={[
          styles.lessonItem,
          { marginLeft: `${indentPercentage}%` },
          isFirstInModule && { marginTop: Spacings.md }
        ]}
      // disabled={!lesson.active_flg}
      >
        <LessonLogoIcon
          color={lessonColor}
          size={70}
          image={lesson.image}
          passed={lesson.active_flg}
          selected={lesson.selected || false}
          type={lesson.type || 'lesson'}
          key={lesson.id}
        />
      </TouchableOpacity>
    );
  };

  // Module Section with lessons
  const ModuleSection = ({ module, moduleIndex, totalLessonsBeforeModule }: {
    module: any;
    moduleIndex: number;
    totalLessonsBeforeModule: number;
  }) => (
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
      {/* Module Header */}
      <Text style={styles.moduleHeader}>{module.name}</Text>

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

  // Handle show lesson content
  const handleShowLesson = useCallback((lesson: any) => {
    if (!lesson.active_flg) return;

    navigation.navigate('lesson-content', {
      lessonTitle: lesson.title,
      formationName: trainingName,
      newLessonId: lesson.id.toString(),
    });
  }, [navigation, trainingName]);

  // Handle close modal
  const closeModal = () => {
    navigation.goBack();
  };

  // Calculate total lessons before each module for continuous snake pattern
  const getTotalLessonsBeforeModule = (moduleIndex: number) => {
    let total = 0;
    for (let i = 0; i < moduleIndex; i++) {
      total += pkg.modules[i].lessons.length;
    }
    return total;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: SAMPLE_DATA.backgroundColor }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={SAMPLE_DATA.backgroundColor} />

      <GestureHandlerRootView style={[Styles.container, backgroundColor]}>
        {/* New Header */}
        <View style={[styles.header, { backgroundColor }]}>
          <TouchableOpacity style={styles.backButton} onPress={closeModal}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTrainingName}>{trainingName}</Text>
            <Text style={styles.headerPackageName}>{packageName}</Text>
          </View>
        </View>

        {/* Module Message Box with Animation */}
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

        {/* Content */}
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
                totalLessonsBeforeModule={getTotalLessonsBeforeModule(moduleIndex)}
              />
            ))}
            <View style={{ height: SCREEN_HEIGHT - 380 }} />
          </ScrollView>
        </View>
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
  },

  // Module Message Box
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
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  moduleMessageSubtext: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.grayLight,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacings.lg,
  },

  // Module and Lesson Styles
  moduleSection: {
    marginBottom: Spacings.xl,
  },
  moduleHeader: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: Spacings.sm,
    marginTop: Spacings.lg,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});