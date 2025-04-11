import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  View,
  Platform,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  LinearTransition
} from 'react-native-reanimated';
import Modal from 'react-native-modal';

import { QueChoisirMenu, QueChoisirButton } from './components/QueChoisir/StartMenu/QueChoisirMenu';
import { GuidePatientMenu, GuidePatientButton } from './components/GuidePatient/GuidePatientMenu';
import { LearningSupportMenu, LearningSupportButton } from './components/LearningSupport/LearningSupport';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

const initialIconConf = {
  width: 150,
  height: 80,
  translateX: 0
}

export const ToolsView = ({ navigation }) => {
  const [showQueChoisirMenu, setShowQueChoisirMenu] = useState(false)
  const [showGuidePatientMenu, setShowGuidePatientMenu] = useState(false)
  const [showLearningSupportMenu, setShowLearningSupportMenu] = useState(false)



  return (
    <SafeAreaView style={{}}>
      <ScrollView style={{ height: "100%" }} contentContainerStyle={{ alignItems: 'center' }}>
        <Text style={styles.pageTitle}>
          Mes outils
        </Text>
        <View style={{
          width: "80%",
        }}>

          <QueChoisirButton
            onPress={() => {
              setShowQueChoisirMenu(true)
            }} />
          <View style={{height: 10}}/>
          <GuidePatientButton onPress={() => { setShowGuidePatientMenu(true) }} />
          <View style={{height: 10}}/>
          <LearningSupportButton onPress={() => { setShowLearningSupportMenu(true) }} />
        </View>


      </ScrollView>
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

  pageTitle: {
    fontSize: 35,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginLeft: 40,
    marginVertical: 30
  },
})

