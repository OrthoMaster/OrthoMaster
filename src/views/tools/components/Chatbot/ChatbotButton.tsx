import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform
} from 'react-native';

import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';

export const ChatbotButton: React.FC<{ onPress: () => any }> = ({ onPress }) => {
  return (<TouchableOpacity
    onPress={onPress}
    style={styles.button}
  >
    <Image
      source={require('../../../../../assets/tools/guide-patient/access-icon.png')}
      style={styles.image}
    />
    <Text style={styles.text}>Assistance IA</Text>
  </TouchableOpacity>)
}


const styles = StyleSheet.create({
  button: {
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.purple,
    padding: Spacings.md,
    height: 220,
    minWidth: 300,
    borderRadius: 15,
    shadowColor: Colors.gray,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: Spacings.md
  },
  text: {
    fontSize: 20,
    color: Colors.white,
    fontFamily: 'Poppins-Medium'
  }
})