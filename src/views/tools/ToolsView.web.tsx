import React, { useState } from 'react';
import {
  StatusBar,
  View,
  StyleSheet,
  Dimensions,
  Text
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from 'react-native-modal';

import { QueChoisirMenu, QueChoisirButton } from './components/QueChoisir/StartMenu/QueChoisirMenu';
import { GuidePatientMenu, GuidePatientButton } from './components/GuidePatient/GuidePatientMenu';
import { LearningSupportMenu, LearningSupportButton } from './components/LearningSupport/LearningSupport';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

const { width } = Dimensions.get('screen');

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
        <QueChoisirButton onPress={() => { setShowQueChoisirMenu(true) }} />
        <GuidePatientButton onPress={() => { setShowGuidePatientMenu(true) }} />
      </View>

      <Modal style={styles.modal} isVisible={showQueChoisirMenu}>
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

      <Modal style={styles.modal} isVisible={showGuidePatientMenu}>
        <GuidePatientMenu onClose={() => { setShowGuidePatientMenu(false) }} />
      </Modal>
      
      <Modal style={styles.modal} isVisible={showLearningSupportMenu}>
        <LearningSupportMenu
          onClose={() => { setShowLearningSupportMenu(false) }}
          onStart={(content) => {
            setShowLearningSupportMenu(false);
            navigation.navigate('tools-content', {
              content: content,
              type: 'tool',
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
    backgroundColor: Colors.blue,
    height: 100,
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
    gap: Spacings.sm,
    justifyContent: 'center',
    backgroundColor: Colors.grayLight,
    paddingHorizontal: (width - 300 - 1200) / 2,
  },
  modal: {
    width: 700,
    alignSelf: 'center',
  }
})
