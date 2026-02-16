import React, { useState } from 'react';
import {
  StatusBar,
  View,
  StyleSheet,
  Dimensions,
  Platform,
  Text
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from 'react-native-modal';

import { QueChoisirMenu, QueChoisirButton } from './components/QueChoisir/StartMenu/QueChoisirMenu';
import { GuidePatientMenu, GuidePatientButton } from './components/GuidePatient/GuidePatientMenu';
import { LearningSupportMenu, LearningSupportButton } from './components/LearningSupport/LearningSupport';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

const { width: screenWidth } = Dimensions.get('screen');
const isTablet = Platform.OS !== 'web' && screenWidth >= 768;

export const ToolsView = ({ navigation }) => {
  const [showQueChoisirMenu, setShowQueChoisirMenu] = useState(false)
  const [showGuidePatientMenu, setShowGuidePatientMenu] = useState(false)
  const [showLearningSupportMenu, setShowLearningSupportMenu] = useState(false)

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.blue} />
      {/* Static Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Outils</Text>
        </View>
      </View>

      <View style={styles.body}>
        <LearningSupportButton onPress={() => { setShowLearningSupportMenu(true) }} />
        <View style={{ height: Spacings.md }} />
        <QueChoisirButton onPress={() => { setShowQueChoisirMenu(true) }} />
        <View style={{ height: Spacings.md }} />
        <GuidePatientButton onPress={() => { setShowGuidePatientMenu(true) }} />
      </View>

      <Modal
        isVisible={showQueChoisirMenu}
      >
        <QueChoisirMenu onClose={() => {
          setShowQueChoisirMenu(false)
        }}
          onStart={(category, filtersConfig) => {
            setShowQueChoisirMenu(false)
            navigation.navigate('tools-que-choisir', {
              category: category,
              filtersConfig: filtersConfig
            })
          }}
        />
      </Modal>
      <Modal
        isVisible={showGuidePatientMenu}
      >
        <GuidePatientMenu onClose={() => { setShowGuidePatientMenu(false) }} />
      </Modal>
      <Modal
        isVisible={showLearningSupportMenu}
      >
        <LearningSupportMenu
          onClose={() => { setShowLearningSupportMenu(false) }}
          onStart={(content) => {
            setShowLearningSupportMenu(false)
            navigation.navigate('tools-content', {
              content: content
            })
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.blue,
  },
  header: {
    height: isTablet ? 100 : 60,
    backgroundColor: Colors.blue,
  },
  headerContent: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacings.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: Colors.grayLight,
    paddingHorizontal: isTablet ? Spacings.xxl : Spacings.lg,
  }
})
