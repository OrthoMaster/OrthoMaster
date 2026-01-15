import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

const { width, height } = Dimensions.get('window');
const CARD_SIZE = (width - (Spacings.lg * 4)) / 3;

interface HomeHeaderProps {
  userName?: string;
  onNotificationPress?: () => void;
  onSearchPress?: () => void;
  onToolPress?: () => void;
  onQuestionPress?: () => void;
  hasNotification?: boolean;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  userName = 'Francis',
  onNotificationPress,
  onSearchPress,
  onToolPress,
  onQuestionPress,
  hasNotification = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Row: Logo and Notifications */}
      <View style={styles.topRow}>
        <View style={styles.logoContainer}>
          <Image
            style={styles.logo}
            source={require('../../../assets/v2_images/logo/logo_primary_1024.png')}
          />
          <Text style={styles.logoText}>OrthoMaster</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={onNotificationPress}
        >
          <Ionicons name="notifications-outline" size={28} color={Colors.primary} />
          {hasNotification && <View style={styles.notificationDot} />}
        </TouchableOpacity>
      </View>

      {/* Greeting Section */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingText}>Bonjour</Text>
        <Text style={styles.userNameText}>{userName}</Text>
      </View>

      {/* Square Cards in V Formation */}
      <View style={styles.cardsContainer}>
        {/* Left Card - Question */}
        <View style={styles.cardWrapper}>
          <View style={[styles.card3DWrapper, styles.question3DWrapper]}>
            <TouchableOpacity
              style={[styles.squareCard, styles.questionCard]}
              onPress={onQuestionPress}
              activeOpacity={0.8}
            >
              <Image
                style={[styles.icons, { width: 60, height: 60 }]}
                source={require('../../../assets/v2_images/icon/home/question_icon.png')}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.cardText, {color: Colors.primary}]}>Questions</Text>
        </View>

        {/* Center Card (Bottom) - Outils */}
        <View style={[styles.cardWrapper, styles.centerCardWrapper]}>
          <View style={[styles.card3DWrapper, styles.outil3DWrapper]}>
            <TouchableOpacity
              style={[styles.squareCard, styles.outilCard]}
              onPress={onToolPress}
              activeOpacity={0.8}
            >
              <Image
                style={styles.icons}
                source={require('../../../assets/v2_images/icon/home/outil_icon.png')}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.cardText, {color: Colors.blue}]}>Outils</Text>
        </View>

        {/* Right Card - Search */}
        <View style={styles.cardWrapper}>
          <View style={[styles.card3DWrapper, styles.search3DWrapper]}>
            <TouchableOpacity
              style={[styles.squareCard, styles.searchCard]}
              onPress={onSearchPress}
              activeOpacity={0.8}
            >
              <Image
                style={[styles.icons, { width: 60, height: 60 }]}
                source={require('../../../assets/v2_images/icon/home/search_icon.png')}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.cardText, {color: Colors.green}]}>Rechercher</Text>
        </View>
      </View>
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    paddingLeft: Spacings.lg,
    paddingTop: Spacings.md,
    paddingBottom: Spacings.lg,
    backgroundColor: Colors.white,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacings.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    resizeMode: 'contain',
    width: 20,
    height: 20,
    marginRight: Spacings.xs
  },
  logoText: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
  },

  notificationButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: Spacings.md,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  greetingSection: {
    marginBottom: Spacings.sm,
    alignItems: 'center',
    position: 'relative',
  },
  greetingText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginBottom: -4,
  },
  userNameText: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: Spacings.xs,
  },
  cardWrapper: {
    alignItems: 'center',
    marginRight: Spacings.md,
  },
  centerCardWrapper: {
    marginTop: Spacings.xl,
  },
  
  // 3D Wrapper for cards
  card3DWrapper: {
    borderRadius: 20,
    paddingBottom: 8, // This creates the 3D depth
  },
  question3DWrapper: {
    backgroundColor: '#C96506',
  },
  outil3DWrapper: {
    backgroundColor: '#4579B8',
  },
  search3DWrapper: {
    backgroundColor: '#3A9BA5',
  },
  
  squareCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchCard: {
    backgroundColor: Colors.green,
  },
  outilCard: {
    backgroundColor: Colors.blue,
  },
  questionCard: {
    backgroundColor: Colors.primary,
  },
  cardText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginTop: Spacings.sm,
    textAlign: 'center',
  },
  icons: {
    resizeMode: 'contain',
    width: 50,
    height: 50,
  }
});