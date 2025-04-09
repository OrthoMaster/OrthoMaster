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
const toolsCardHeight = screenHeight * 0.7

export const ToolsView = ({ navigation }) => {
  const qcRef = useRef(null);
  const [showQueChoisirMenu, setShowQueChoisirMenu] = useState(false)
  const [showGuidePatientMenu, setShowGuidePatientMenu] = useState(false)
  const [showLearningSupportMenu, setShowLearningSupportMenu] = useState(false)
  const qcStyle = useSharedValue({ width: screenWidth * 0.6 });
  const gpStyle = useSharedValue(initialIconConf);
  const lsStyle = useSharedValue(initialIconConf);

  const animatedQueChoisirStyle = useAnimatedStyle(() => ({
    width: withTiming(qcStyle.value.width, { duration: 1000 }),
    // height: withTiming(qcStyle.value.height, { duration: 1000 }),
  }));

  const animatedGuidePatientStyle = useAnimatedStyle(() => ({
    width: withTiming(gpStyle.value.width, { duration: 1000 }),
    height: withTiming(gpStyle.value.height, { duration: 1000 }),
    transform: [{ translateX: withTiming(gpStyle.value.translateX, { duration: 1000 }) }]
  }));

  const animatedLearningSupportStyle = useAnimatedStyle(() => ({
    width: withTiming(lsStyle.value.width, { duration: 1000 }),
    height: withTiming(lsStyle.value.height, { duration: 1000 }),
    transform: [{ translateX: withTiming(lsStyle.value.translateX, { duration: 1000 }) }]
  }));

  useEffect(() => {
    if (showQueChoisirMenu)
      qcStyle.value = { width: screenWidth * 0.9 }
    // qcStyle.value = { width: screenWidth * 0.9, height: toolsCardHeight }
    else
      qcStyle.value = { width: screenWidth * 0.6 }
    // qcStyle.value = { width: screenWidth * 0.6, height: 80 }
  }, [showQueChoisirMenu])

  useEffect(() => {
    if (showGuidePatientMenu) {
      gpStyle.value = { width: screenWidth, height: toolsCardHeight, translateX: 0 }
      lsStyle.value = { ...initialIconConf, translateX: screenWidth }
    } else {
      gpStyle.value = initialIconConf
      lsStyle.value = initialIconConf
    }
  }, [showGuidePatientMenu])

  useEffect(() => {
    if (showLearningSupportMenu) {
      lsStyle.value = { width: screenWidth, height: toolsCardHeight, translateX: -150 }
      gpStyle.value = { ...initialIconConf, translateX: -screenWidth }
    } else {
      lsStyle.value = initialIconConf
      gpStyle.value = initialIconConf
    }
  }, [showLearningSupportMenu])


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

