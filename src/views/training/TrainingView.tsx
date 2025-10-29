import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Colors from "../../../constants/Colors";
import Spacings from "../../../constants/Spacings";
import { Styles } from "../../../constants/Styles";

type Tab = 'detail' | 'course';

export const TrainingView = ({ navigation, route }) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [currentTab, setCurrentTab] = useState<Tab>('detail');
  const [sheetData, setSheetData] = useState<string>('');
  const snapPoints = useMemo(() => ['15%', '50%', '90%'], []);

  // Section
  const Section = ({ title, duration, lessons }: {
    title: string;
    duration: string;
    lessons: string;
    image?: any;
  }) => (
    <TouchableOpacity style={styles.sectionContainer} onPress={() => handleLessonSheet(title)}>
      <View style={styles.sectionImageWrapper}>
        <View style={styles.sectionImagePlaceholder}>
          <Feather name="image" size={20} color={Colors.gray} />
        </View>
      </View>
      <View style={styles.sectionContent}>
        <Text numberOfLines={2} ellipsizeMode='tail' style={styles.sectionTitle}>{title}</Text>
        <Text numberOfLines={1} ellipsizeMode='tail' style={styles.sectionMeta}>{duration} • {lessons}</Text>
      </View>
    </TouchableOpacity>
  );

  // Lesson
  const Lesson = ({ title, status }: {
    title: string;
    status: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.lessonContainer,
        status === 'done' && styles.lessonDone,
        status === 'locked' && styles.lessonLocked
      ]}
      disabled={status === 'locked'}
      onPress={() => handleShowLesson(title)}
    >
      <View style={styles.lessonContent}>
        <Text style={[
          styles.lessonTitle,
          status === 'done' && styles.lessonTitleDone,
          status === 'locked' && styles.lessonTitleLocked
        ]}>{title}</Text>
        {status === 'locked' &&
          <Text style={styles.lessonNotice}>Débloqué au delà 60% de progression</Text>
        }
      </View>
      <View>
        {status === 'locked' &&
          <Ionicons name="lock-closed" size={20} color={Colors.gray} />
        }
        {status === 'done' &&
          <Ionicons name="checkmark-circle" size={20} color={Colors.green} />
        }
      </View>
    </TouchableOpacity>
  );

  // Handle lession bottom sheet
  const handleLessonSheet = useCallback((title: string) => {
    setSheetData(title);
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  // Handle show lesson content
  const handleShowLesson = useCallback((title: string) => {

  }, []);

  // Handle close modal
  const closeModal = () => {
    navigation.goBack();
  };

  return (
    <GestureHandlerRootView style={Styles.container}>
      {/* Header Image with Navigation */}
      <View style={styles.headerContainer}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80'
          }}
          style={styles.headerImage}
        />

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={closeModal}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.black} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton}>
            <Ionicons name="heart-outline" size={24} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Title */}
        <Text style={styles.title}>Graffiti Mastery</Text>

        {/* Meta Info */}
        <View style={styles.infoContainer}>
          <View style={styles.metaContainer}>
            <Ionicons name="book-outline" size={16} color={Colors.gray} />
            <Text style={styles.metaInfo}>3 modules - 24 leçons</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaContainer}>
            <Ionicons name="time-outline" size={16} color={Colors.gray} />
            <Text style={styles.metaInfo}>4h 50m</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, currentTab === 'detail' && styles.activeTab]}
            disabled={currentTab === 'detail'}
            onPress={() => setCurrentTab('detail')}
          >
            <Text style={[styles.tabText, currentTab === 'detail' && styles.activeTabText]}>À propos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, currentTab === 'course' && styles.activeTab]}
            disabled={currentTab === 'course'}
            onPress={() => setCurrentTab('course')}
          >
            <Text style={[styles.tabText, currentTab === 'course' && styles.activeTabText]}>Modules</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        {currentTab === 'detail' &&
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>
                Graffiti Drawing is the act of taking many different motifs and combining them together into one unified quilt. Graffiti Drawing is the act of taking many different motifs and combining them together into one unified quilt.
              </Text>
            </View>
          </ScrollView>
        }

        {/* Course */}
        {currentTab === 'course' &&
          <ScrollView showsVerticalScrollIndicator={true}>
            <Section
              title="Base de l'orthopédie"
              duration="25m"
              lessons="6 lessons"
            />
            <Section
              title="Bases biomécaniques"
              duration="25m"
              lessons="6 lessons"
            />
          </ScrollView>
        }
      </View>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1} // Bắt đầu ở trạng thái đóng
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        enableDynamicSizing={false}
        style={{
          elevation: 5,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 20,
        }}
      >
        <View style={styles.sheetHeader}>
          <Text numberOfLines={1} ellipsizeMode='tail'
            style={styles.sheetTitle}>{sheetData}</Text>
        </View>
        <BottomSheetScrollView style={styles.sheetBody}
          showsVerticalScrollIndicator={false}
        >
          <Lesson
            title="1. Base de l'orthopédie"
            status="done"
          />
          <Lesson
            title="2. Base de l'orthopédie"
            status="done"
          />
          <Lesson
            title="3. Base de l'orthopédie"
            status="done"
          />
          <Lesson
            title="4. Base de l'orthopédie"
            status="unlocked"
          />
          <Lesson
            title="5. Base de l'orthopédie"
            status="locked"
          />
        </BottomSheetScrollView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative',
    height: 240,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  navigationContainer: {
    position: 'absolute',
    top: Spacings.xl,
    left: Spacings.lg,
    right: Spacings.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    padding: Spacings.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Roboto',
    color: Colors.text,
    marginBottom: Spacings.xs,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacings.lg,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaInfo: {
    marginLeft: Spacings.xs,
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: '400',
    color: Colors.gray,
  },
  divider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray,
    marginHorizontal: Spacings.sm,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.grayLight,
    borderRadius: 40,
    padding: Spacings.xxs,
    marginBottom: Spacings.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacings.xs,
    alignItems: 'center',
    borderRadius: 30,
  },
  activeTab: {
    backgroundColor: Colors.blue,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  tabText: {
    fontSize: 12,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
  },
  activeTabText: {
    color: Colors.white,
  },

  descriptionContainer: {
    marginBottom: Spacings.md,
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: Colors.text,
    fontFamily: 'Roboto',
  },

  // Section
  sectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacings.xs,
    paddingHorizontal: Spacings.md,
    borderWidth: 1,
    borderColor: Colors.grayLight,
    borderRadius: 16,
    marginBottom: Spacings.md,
  },
  sectionImageWrapper: {
    marginRight: Spacings.md,
  },
  sectionImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Roboto',
    color: Colors.text,
    marginBottom: Spacings.xxs,
  },
  sectionMeta: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Roboto',
    color: Colors.gray,
    marginBottom: Spacings.xxs,
  },

  // Bottom sheet
  sheetHeader: {
    paddingBottom: Spacings.md,
    paddingHorizontal: Spacings.lg,
    paddingLeft: Spacings.xl,
    borderBottomWidth: 2,
    borderBottomColor: Colors.grayLight,
    alignItems: 'center'
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: 'Roboto',
    fontWeight: '700',
    lineHeight: 20,
    color: Colors.text,
    textAlign: 'center',
    width: '70%',
  },
  sheetBody: {
    flex: 1,
    marginHorizontal: Spacings.lg,
    marginBottom: Spacings.xl,
  },

  // Lesson
  lessonContainer: {
    flexDirection: 'row',
    verticalAlign: 'middle',
    alignItems: 'center',
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.md,
    borderWidth: 1,
    borderColor: Colors.gray,
    marginTop: Spacings.md,
    height: 60,
    borderRadius: 30,
  },
  lessonDone: {
    borderColor: Colors.green,
    backgroundColor: Colors.successBackground
  },
  lessonLocked: {
    backgroundColor: Colors.grayLight,
    borderColor: Colors.grayLight
  },
  lessonContent: {
    flex: 1,
    marginLeft: Spacings.md,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Roboto',
    color: Colors.text,
    lineHeight: 20,
  },
  lessonTitleDone: {
    color: Colors.green,
  },
  lessonTitleLocked: {
    color: Colors.gray,
  },
  lessonNotice: {
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: '400',
    lineHeight: 15,
    marginTop: 0,
    color: Colors.subtext
  }
});