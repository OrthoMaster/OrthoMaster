import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { ConversationsView } from '../../views/booking/messages/ConversationsView';
import { ConversationView } from '../../views/booking/messages/ConversationView';

const MessagesStackNav = createStackNavigator();

/**
 * Pile de l'onglet Messages : liste des conversations → conversation.
 * La conversation masque la barre d'onglets (saisie en bas de l'écran).
 */
export const MessagesStack = () => {
  return (
    <MessagesStackNav.Navigator
      id={'messages-stack' as undefined}
      initialRouteName="messages-home"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <MessagesStackNav.Screen name="messages-home" component={ConversationsView} />
      <MessagesStackNav.Screen name="conversation" component={ConversationView} />
    </MessagesStackNav.Navigator>
  );
};
