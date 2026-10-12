import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { useFloatingTabBarInset } from '../../component/booking/FloatingTabBar';

/**
 * Remplaçant temporaire des onglets à venir : chaque onglet passe son titre
 * et sa description en initialParams, pour garder BookingTabs lisible.
 */
export const BookingComingSoonView = ({ route }) => {
  const bottomInset = useFloatingTabBarInset();
  const { title, description, icon } = route.params ?? {};

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.lblue} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <View style={[styles.body, { paddingBottom: bottomInset }]}>
        <View style={styles.medallion}>
          <MaterialCommunityIcons name={icon ?? 'calendar-clock'} size={40} color={Colors.lblueDark} />
        </View>
        <Text style={styles.title}>Bientôt disponible</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  /* ---- Structure ---- */
  container: {
    flex: 1,
    backgroundColor: Colors.lblue,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: Spacings.lg,
    backgroundColor: Colors.lblue,
  },
  headerTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 20,
    color: Colors.white,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacings.xl,
    backgroundColor: Colors.grayLight,
  },

  /* ---- Contenu ---- */
  medallion: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.lblue3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacings.lg,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: Spacings.xs,
  },
  description: {
    fontFamily: 'Roboto',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.gray,
    textAlign: 'center',
  },
});