import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Linking,
  RefreshControl,
  Animated,
  Image
} from 'react-native';
import { Divider, Dialog, Portal, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

import { useQuery } from "@tanstack/react-query";
import { useLogout, useGetUser } from '../../hooks/auth.hook';
import { orthomasterShare } from "../../futils";

import { BouncingDots } from '../../component/LoadingDots';

import { getMoreInfo } from '../../services/v2/AuthService';
import { quitCompany } from '../../services/v2/CompanyService';

interface MenuItemProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  disableLeftIcon?: boolean;
  onPress?: () => void;
  isLast?: boolean;
  showWarning?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ iconName, title, subtitle, disableLeftIcon, onPress, isLast, showWarning }) => (
  <TouchableOpacity
    style={[styles.menuItem, !isLast && styles.menuItemBorder]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.menuItemLeft}>
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={20} color={Colors.text} />
        {showWarning && (
          <View style={styles.warningBadge}>
            <Ionicons name="alert-circle" size={16} color={Colors.warning} />
          </View>
        )}
      </View>
      <View style={styles.menuItemText}>
        <Text style={styles.menuItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    {!disableLeftIcon &&
      < Ionicons name="chevron-forward" size={20} color={Colors.gray} />
    }
  </TouchableOpacity >
);

export const ProfileView = ({ navigation, route }) => {
  // Change screen
  const screen = route.params?.screen;
  useEffect(() => {
    if (screen) {
      const timer = setTimeout(() => {
        navigation.navigate(screen);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [screen, navigation]);

  // View bottom bar
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'flex' }
    });
  }, [navigation]);

  // Get data
  const { data: user, isLoading: isLoadingUser, refetch: refetchUser, isFetching: isFetchingUser, error: errorUser } = useGetUser();
  const logout = useLogout();

  const { data: more, isLoading: isLoadingMore, refetch: refetchMore, isFetching: isFetchingMore, error: errorMore } = useQuery({
    queryKey: ['user-more'],
    queryFn: () => getMoreInfo(),
    retry: 1,
    retryDelay: 1000,
    meta: {
      timeout: 20000
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setIsLoading(isLoadingUser || isLoadingMore);
  }, [isLoadingUser, isLoadingMore]);

  const [visibleConfirmExit, setVisibleConfirmExit] = useState(false);
  const handleConfirmExitCompany = async () => {
    setIsLoading(true);
    try {
      const result = await quitCompany();

      if (result?.success) {
        refetchUser();
        refetchMore();
        setVisibleConfirmExit(false);
        Alert.alert('Succès', result?.message);
      } else {
        Alert.alert('Erreur', result?.message || 'Une erreur est survenue');
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }

    setIsLoading(false);
    return;
  }

  const nofi = () => {
    navigation.navigate('notification-list');
  }

  const reload = () => {
    refetchUser();
    refetchMore();
  };

  const openCompanyInfo = () => {
    navigation.navigate('company-new');
  }

  // Animation cho notification icon
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (more && more?.data?.hasNotifications) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(shakeAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(shakeAnim, {
                toValue: -1,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(shakeAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(shakeAnim, {
                toValue: -1,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(shakeAnim, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.delay(1500),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      animation.start();

      return () => {
        animation.stop();
      };
    } else {
      scaleAnim.setValue(1);
      shakeAnim.setValue(0);
    }
  }, [more?.data?.hasNotifications]);

  const rotateInterpolate = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Profil</Text>
          <Text style={styles.userName}>{user.name + ' ' + user.first_name}</Text>
          <Text style={styles.userProf}>{user.student_flg == true ? 'Étudiant' : user.profession}</Text>
          
          {
            user && user.student_flg == true && user.expires_at !== null &&
            <Text style={styles.userExpiresAt}>Expire le <Text
              style={{ fontFamily: 'Poppins-Bold', color: Colors.red }}>{user.expires_at}</Text>
            </Text>
          }
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={nofi}>
          {(more && more?.data?.hasNotifications) ?
            <Animated.View
              style={{
                transform: [
                  { scale: scaleAnim },
                  { rotate: rotateInterpolate },
                ],
              }}
            >
              <Ionicons name="notifications" size={22} color={Colors.primary} />
            </Animated.View>
            :
            <Ionicons name="notifications" size={22} color={Colors.gray} />
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={(isFetchingUser || isFetchingMore) && (!!errorUser || !!errorMore)}
            onRefresh={reload}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }>
        {(errorUser || errorMore) && (
          <View style={[Styles.errorMessageContainer, { marginTop: Spacings.md }]}>
            <Text style={Styles.errorText}>Erreur de chargement des données, veuillez réessayer !</Text>
          </View>
        )}

        <View style={styles.content}>
          {/* User Info Card */}
          {more && more?.data?.companiesIsMember?.length > 0 &&
            <View style={styles.userCard}>
              <Text style={styles.teamTitle}>Équipe dont je fais partie :</Text>
              <Divider />
              {more?.data?.companiesIsMember.map((company, index) => (
                <View key={'company-' + index} style={styles.companyWrapper}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.companyType}>{company.establishment?.name}</Text>
                    <Text style={styles.companyName} numberOfLines={2} ellipsizeMode='tail'>{company.name}</Text>
                    {/* <Text style={styles.companyData}>
                    {(more?.data?.companyIsMember.postal_code || '') + ' ' + (more?.data.companyIsMember.city || '') + ' ' + (more?.data.companyIsMember.country || '')}
                  </Text> */}
                  </View>
                  <TouchableOpacity onPress={() => setVisibleConfirmExit(true)} style={styles.quitButton}>
                    <Ionicons name='exit-outline' size={20} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          }

          <View style={styles.cusButtonsContainer}>
            <TouchableOpacity style={styles.shareButton}
              activeOpacity={0.8}
              onPress={() => {
                orthomasterShare({
                  message: "Rejoignez le premier écosystème de l'orthopédie !\n" +
                    user.name + " vous invite à découvrir la plateforme OrthoMaster.\n" +
                    "Cliquez sur ce lien ci-dessus et découvrez des centaines de contenus réservés aux professionnels de santé.\n\nhttps://auth.orthomaster.fr",
                  url: "https://orthomaster.fr"
                }, 'app invite', null)
              }}
            >
              <Image
                source={require('../../../assets/v2_images/icon/des-billets.png')}
                style={styles.shareButtonIcon}
                resizeMode="contain"
              />
              <Text style={styles.shareButtonText}>Inviter à rejoindre OrthoMaster</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.favoriteButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('settings-view')}
            >
              <Image
                source={require('../../../assets/v2_images/icon/coeur.png')}
                style={styles.favoriteButtonIcon}
                resizeMode="contain"
              />
              <Text style={styles.favoriteButtonText}>Mes centres d'intérêt</Text>
            </TouchableOpacity>
          </View>

          {/* Espace Pro Card */}
          {!user.has_company && !user.student_flg &&
            <TouchableOpacity style={styles.proButton} onPress={openCompanyInfo}>
              <Image
                source={require('../../../assets/v2_images/icon/equipe.png')}
                style={styles.proButtonIcon}
                resizeMode="contain"
              />
              <View style={styles.proTextContainer}>
                <Text style={styles.proCardTitle}>Créer votre Espace Pro</Text>
                <Text style={styles.proCardText}>pour utiliser OrthoMaster en équipe.</Text>
              </View>
            </TouchableOpacity>
          }

          {/* Account Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Compte</Text>
            </View>
            <MenuItem
              iconName="person-outline"
              title="Informations personnelles"
              onPress={() => (navigation.navigate('profile-info'))}
            />
            <MenuItem
              iconName="shield-checkmark-outline"
              title="Sécurité"
              subtitle="Changer votre mot de passe"
              showWarning={user.reset_password_flg}
              onPress={() => (navigation.navigate('change-password'))}
            />
            <MenuItem
              iconName="folder-open-outline"
              title="Devis & Factures"
              isLast
              onPress={() => (navigation.navigate('document-view'))}
            />
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Support</Text>
            </View>
            <MenuItem
              iconName="help-circle-outline"
              title="Obtenir de l'aide"
              disableLeftIcon
              onPress={() => (Linking.openURL('mailto:question@orthomaster.fr'))}
            />
            <MenuItem
              iconName="document-outline"
              title="Mentions légales"
              disableLeftIcon
              onPress={() => (Linking.openURL('https://www.orthomaster.fr/mentions-l%C3%A9gales'))}
            />
            <MenuItem
              iconName="document-text-outline"
              title="Politique de confidentialité"
              disableLeftIcon
              onPress={() => (Linking.openURL('https://www.orthomaster.fr/politique-de-confidentialit%C3%A9'))}
            />
          </View>

          {/* Logout Button */}
          <View style={[styles.section, { marginBottom: Spacings.xl }]}>
            <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.7}
              onPress={() => {
                Alert.alert(
                  "Déconnexion",
                  "Voulez-vous vraiment vous déconnecter ?",
                  [{
                    text: "Annuler",
                    style: "cancel"
                  },
                  {
                    text: "Se déconnecter", onPress: () => {
                      logout.mutate()
                    }
                  }]
                );
              }}
            >
              <Ionicons name="log-out-outline" size={24} color={Colors.primary} />
              <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {isLoading &&
        <BouncingDots
          color={Colors.primary}
          size={10}
          bounceHeight={5}
          containerStyle={{
            backgroundColor: 'transparent',
            position: 'absolute',
            bottom: Spacings.xs,
            left: 0,
            right: 0,
            zIndex: 999,
            elevation: 5,
          }}
        />
      }

      {/* Confirm exit company */}
      <Portal>
        <Dialog visible={visibleConfirmExit}
          onDismiss={() => setVisibleConfirmExit(false)}
          theme={{
            colors: {
              primary: Colors.primary,
              elevation: {
                level3: Colors.white, // background của dialog
              }
            }
          }}>
          <Dialog.Title style={{ fontFamily: 'Poppins-Medium', fontSize: 18, color: Colors.danger }}>Quitter l'équipe</Dialog.Title>
          <Dialog.Content>
            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 14, color: Colors.text }}>Êtes-vous sûr de vouloir quitter cette équipe ?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor={Colors.gray} labelStyle={{ fontFamily: 'Poppins-Medium' }} onPress={() => setVisibleConfirmExit(false)}>Annuler</Button>
            <Button textColor={Colors.danger} labelStyle={{ fontFamily: 'Poppins-Medium' }} onPress={handleConfirmExitCompany}>Quitter</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.grayLight
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingBottom: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  content: {
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.lg,
  },
  userCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.sm,
    marginBottom: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  teamTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.purple,
    marginBottom: Spacings.xs
  },
  userName: {
    fontSize: 17,
    fontWeight: '500',
    fontFamily: 'Roboto',
    color: Colors.primary,
    marginBottom: -2,
  },
  userProf: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.subtext2,
    marginBottom: -2,
    marginLeft: Spacings.xxxs,
  },
  studentWrapper: {
    marginTop: Spacings.xs,
  },
  studentLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 9,
    backgroundColor: Colors.green,
    color: Colors.white,
    paddingHorizontal: Spacings.xxs,
    paddingVertical: Spacings.xxxs,
    width: 50,
    textAlign: 'center',
    borderRadius: 8,
  },
  userExpiresAt: {
    fontSize: 9,
    fontFamily: 'Poppins-Light',
    color: Colors.gray,
    marginLeft: Spacings.xxxs,
    marginTop: Spacings.xxxs
  },

  companyWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.sm,
    flex: 1,
    marginTop: Spacings.sm,
  },
  companyType: {
    fontSize: 11,
    marginBottom: Spacings.xxxs,
    paddingLeft: 1,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
  },
  companyName: {
    fontSize: 15,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.blue,
    marginBottom: Spacings.xxxs,
  },
  companyData: {
    fontSize: 10,
    fontFamily: 'Poppins-Light',
    color: Colors.subtext,
  },
  quitButton: {
    paddingLeft: Spacings.md,
  },

  proCardTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  proCardText: {
    fontSize: 11,
    fontFamily: 'Poppins-Light',
    color: Colors.white,
    marginTop: -2
  },

  section: {
    marginBottom: Spacings.md,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingVertical: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacings.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: Spacings.md,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  menuItemSubtitle: {
    fontSize: 10,
    fontFamily: 'Poppins-Light',
    color: Colors.gray,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacings.md,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
    marginLeft: Spacings.sm,
  },

  // Noti
  notificationButton: {
    paddingTop: Spacings.md,
    paddingLeft: Spacings.md,
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
  },
  warningBadge: {
    position: 'absolute',
    top: -2,
    right: -8,
  },

  // Buttons
  cusButtonsContainer: {
    marginTop: Spacings.md,
  },
  shareButton: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: Spacings.xl,
  },
  shareButtonIcon: {
    width: 70,
    height: 70,
    position: 'absolute',
    left: 10,
    top: -14,
    zIndex: 100,
  },
  shareButtonText: {
    width: '100%',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    backgroundColor: '#FF4B4B',
    paddingVertical: Spacings.sm,
    paddingLeft: 100,
    borderRadius: 40,
  },
  favoriteButton: {
    flex: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: Spacings.xl,
  },
  favoriteButtonIcon: {
    width: 60,
    height: 60,
    position: 'absolute',
    right: 20,
    top: -10,
    zIndex: 100,
  },
  favoriteButtonText: {
    width: '100%',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacings.sm,
    paddingLeft: 100,
    borderRadius: 40,
  },

  proButton: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: Spacings.xl,
    backgroundColor: Colors.purple,
    paddingVertical: Spacings.sm,
  },
  proButtonIcon: {
    width: 80,
    height: 80,
    position: 'absolute',
    left: 10,
    bottom: 0,
    zIndex: 100,
  },
  proTextContainer: {
    width: '100%',
    paddingLeft: 100,
  }
});