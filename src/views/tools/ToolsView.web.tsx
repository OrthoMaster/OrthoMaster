import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  View,
  StyleSheet,
  Dimensions,
  Text,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from 'react-native-modal';

import { QueChoisirMenu, QueChoisirButton } from './components/QueChoisir/StartMenu/QueChoisirMenu';
import { GuidePatientMenu, GuidePatientButton } from './components/GuidePatient/GuidePatientMenu';
import { LearningSupportMenu, LearningSupportButton } from './components/LearningSupport/LearningSupport';
import { ChatbotButton } from './components/Chatbot/ChatbotButton';

import { me } from '../../services/v2/AuthService';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

const { width } = Dimensions.get('window');


export const ToolsView = ({ navigation }) => {

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchUser = async () => {
      const data = await me();
      setUser(data);
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const [showQueChoisirMenu, setShowQueChoisirMenu] = useState(false)
  const [showGuidePatientMenu, setShowGuidePatientMenu] = useState(false)
  const [showLearningSupportMenu, setShowLearningSupportMenu] = useState(false)

  const tools = [
    { key: 'learning', component: <LearningSupportButton onPress={() => setShowLearningSupportMenu(true)} /> },
    
    // { key: 'queChoisir', component: <QueChoisirButton onPress={() => setShowQueChoisirMenu(true)} /> },
    { key: 'queChoisir', component: <QueChoisirButton onPress={() => { navigation.navigate('new-que-choisir') }} /> },
    

    { key: 'guidePatient', component: <GuidePatientButton onPress={() => setShowGuidePatientMenu(true)} /> },
    ...(user?.has_subscription
      ? [{ key: 'chatbot', component: <ChatbotButton onPress={() => navigation.navigate('chatbot-view')} /> }]
      : []
    ),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.blue} />
      {/* Static Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Outils</Text>
        </View>
      </View>

      <FlatList
        key={user?.has_subscription ? 'has-subscription' : 'normal'}
        data={tools}
        numColumns={2}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <View style={styles.column}>
            {item.component}
          </View>
        )}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      />

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
    backgroundColor: Colors.grayLight,
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
  column: {
    flex: 1,
    margin: Spacings.md,
  },

  body: {
    gap: Spacings.sm,
    justifyContent: 'center',
    backgroundColor: Colors.grayLight,
    paddingTop: Spacings.xxl,
    paddingBottom: Spacings.lg,
    paddingHorizontal: Spacings.xxl,
  },
  modal: {
    width: 700,
    alignSelf: 'center',
  }
})
