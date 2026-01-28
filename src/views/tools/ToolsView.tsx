import React, { useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from 'react-native-modal';

import { QueChoisirMenu, QueChoisirButton } from './components/QueChoisir/StartMenu/QueChoisirMenu';
import { GuidePatientMenu, GuidePatientButton } from './components/GuidePatient/GuidePatientMenu';
import { LearningSupportMenu, LearningSupportButton } from './components/LearningSupport/LearningSupport';

export const ToolsView = ({ navigation }) => {
  const [showQueChoisirMenu, setShowQueChoisirMenu] = useState(false)
  const [showGuidePatientMenu, setShowGuidePatientMenu] = useState(false)
  const [showLearningSupportMenu, setShowLearningSupportMenu] = useState(false)

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{
        width: "100%",
        flex: 1,
        justifyContent: 'center',
        padding: 30,
      }}>

        <LearningSupportButton onPress={() => { setShowLearningSupportMenu(true) }} />
        <View style={{ height: 10 }} />
        <QueChoisirButton
          onPress={() => {
            setShowQueChoisirMenu(true)
          }} />
        <View style={{ height: 10 }} />
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
