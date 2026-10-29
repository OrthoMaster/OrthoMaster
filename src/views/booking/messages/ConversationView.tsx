import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';

import Colors from '../../../../constants/Colors';

import { useHideFloatingTabBar } from '../useHideFloatingTabBar';
import { ConversationThread } from './ConversationThread';

/**
 * Écran de conversation (mobile) : plein écran, barre d'onglets masquée,
 * flèche de retour. Le contenu est dans ConversationThread, partagé avec le web.
 */
export const ConversationView = ({ navigation, route }) => {
  useHideFloatingTabBar(navigation);
  const focused = useIsFocused();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <ConversationThread
        conversationId={route.params?.conversationId}
        preview={route.params?.preview}
        active={focused}
        onBack={() => navigation.goBack()}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
});
