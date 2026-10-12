import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';
import { useFloatingTabBarInset } from '../../../component/booking/FloatingTabBar';
import { BookingScreenHeader } from '../components/BookingScreenHeader';

/** Provisoire : remplacé par les écrans Offres et Disponibilités. */
export const ExpertisePlaceholderView = ({ navigation, route }) => {
  const bottomInset = useFloatingTabBarInset();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.lblue} />
      <BookingScreenHeader title={route.params?.title ?? ''} onBack={() => navigation.goBack()} />

      <View style={[styles.body, { paddingBottom: bottomInset }]}>
        <MaterialCommunityIcons name="hammer-wrench" size={40} color={Colors.lblue} />
        <Text style={styles.text}>Écran en cours de réalisation</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lblue,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.sm,
    backgroundColor: Colors.grayLight,
  },
  text: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.gray,
  },
});