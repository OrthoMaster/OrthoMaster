/**
 * Formations › Diplôme (mobile et web) : le cercle « Diplôme Pharmacie »,
 * auparavant à la fin du premier groupe de Mes formations, et sa pré-inscription.
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { preRegDiploma } from '../../services/v2/CompanyService';
import { DiplomaModalContent } from '../company/components/DiplomaModalContent';
import { notify } from '../booking/bookingActions';

/** Jaune orangé de la rubrique Diplôme. */
export const DIPLOMA_COLOR = '#FFB300';
export const DIPLOMA_COLOR_DARK = '#E09600';

const IS_WEB = Platform.OS === 'web';
const isTablet = !IS_WEB && Dimensions.get('window').width >= 768;
const CIRCLE_SIZE = IS_WEB || isTablet ? 160 : 130;

export const DiplomaView = ({ navigation }) => {
  const [showModal, setShowModal] = useState(false);

  // Barre d'onglets visible : l'espace rendez-vous (Tutorat) la masque en entrant.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'web') navigation.getParent()?.setOptions({ tabBarStyle: { display: 'flex' } });
    }, [navigation])
  );

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('training-home');
  };

  const preReg = async () => {
    setShowModal(false);
    const result = await preRegDiploma();
    if (result) notify('Pré-inscription', result.message);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={DIPLOMA_COLOR} />

      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Retour">
          <Ionicons name="chevron-back" size={IS_WEB ? 30 : 26} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Diplôme</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.item} onPress={() => setShowModal(true)} activeOpacity={0.8}>
          <View style={styles.circle}>
            <Image
              style={styles.circleImage}
              resizeMode="contain"
              source={require('../../../assets/v2_images/icon/add-diploma.png')}
            />
          </View>
          <Text style={styles.itemTitle} numberOfLines={2}>Diplôme Pharmacie</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <DiplomaModalContent onPreReg={preReg} onClose={() => setShowModal(false)} />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DIPLOMA_COLOR,
  },
  header: {
    height: IS_WEB || isTablet ? 100 : 60,
    backgroundColor: DIPLOMA_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    paddingHorizontal: Spacings.md,
  },
  headerTitle: {
    fontSize: IS_WEB ? 28 : 20,
    fontFamily: IS_WEB ? 'Poppins-Bold' : 'Poppins-Medium',
    color: Colors.white,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.darkBackground,
  },
  content: {
    alignItems: 'center',
    paddingVertical: Spacings.xxl,
    paddingHorizontal: Spacings.lg,
  },
  item: {
    alignItems: 'center',
    width: CIRCLE_SIZE + Spacings.xl,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 4,
    borderColor: DIPLOMA_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleImage: {
    width: CIRCLE_SIZE * 0.65,
    height: CIRCLE_SIZE * 0.65,
    marginTop: 10,
    marginRight: 5,
  },
  itemTitle: {
    marginTop: Spacings.xs,
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: DIPLOMA_COLOR,
    textAlign: 'center',
  },
});
