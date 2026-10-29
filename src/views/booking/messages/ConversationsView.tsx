import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';

import Colors from '../../../../constants/Colors';

import { useFloatingTabBarInset } from '../../../component/booking/FloatingTabBar';
import { ConversationList } from './ConversationList';

/**
 * Onglet Messages (mobile) : liste des conversations en plein écran.
 * Le contenu est dans ConversationList, partagé avec le panneau flottant du web.
 */
export const ConversationsView = ({ navigation }) => {
  const bottomInset = useFloatingTabBarInset();
  const focused = useIsFocused();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <ConversationList
        active={focused}
        bottomInset={bottomInset}
        onOpen={(conversation) =>
          navigation.navigate('conversation', { conversationId: conversation.id, preview: conversation })
        }
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
