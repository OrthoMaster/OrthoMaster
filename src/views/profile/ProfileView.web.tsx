import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Linking,
  RefreshControl,
  Animated,
  Image,
  Platform,
  Dimensions
} from 'react-native';
import { Dialog, Portal, Button } from 'react-native-paper';
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
      <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
    }
  </TouchableOpacity >
);

export const ProfileView = ({ navigation, route }) => {
  // Navigation handling
  const screen = route.params?.screen;
  useEffect(() => {
    if (screen) {
      const timer = setTimeout(() => {
        navigation.navigate(screen);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [screen, navigation]);

  // Responsive
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const shouldStackVertically = windowWidth < 1300;
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  // Data queries
  const { data: user, isLoading: isLoadingUser, refetch: refetchUser, isFetching: isFetchingUser, error: errorUser } = useGetUser();
  const logout = useLogout();

  const { data: more, refetch: refetchMore, isFetching: isFetchingMore, error: errorMore } = useQuery({
    queryKey: ['user-more'],
    queryFn: () => getMoreInfo(),
    retry: 1,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Dialog visibility states
  const [visibleConfirmExit, setVisibleConfirmExit] = useState(false);
  const [visibleLogout, setVisibleLogout] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ visible: true, title, message });
  };

  const handleConfirmExitCompany = async () => {
    setVisibleConfirmExit(false);
    setIsLoading(true);
    try {
      const result = await quitCompany();

      if (result?.success) {
        refetchUser();
        refetchMore();
        showAlert('Succès', result?.message);
      } else {
        showAlert('Erreur', result?.message || 'Une erreur est survenue');
      }
    } catch (error: any) {
      showAlert('Erreur', error.message);
    }

    setIsLoading(false);
  }

  const nofi = () => navigation.navigate('notification-list');
  const reload = () => { refetchUser(); refetchMore(); };
  const openCompanyInfo = () => navigation.navigate('company-new');

  // Animation setup
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
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.sequence([
              Animated.timing(shakeAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: Platform.OS !== 'web',
              }),
              Animated.timing(shakeAnim, {
                toValue: -1,
                duration: 100,
                useNativeDriver: Platform.OS !== 'web',
              }),
              Animated.timing(shakeAnim, {
                toValue: 0,
                duration: 100,
                useNativeDriver: Platform.OS !== 'web',
              }),
            ]),
          ]),
          Animated.delay(1500),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [more?.data?.hasNotifications]);

  const rotateInterpolate = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header - Kept exactly as original */}
      <View style={styles.header}>
        <View>
          <Text style={styles.userName}>{user?.name + ' ' + user?.first_name}</Text>
          <Text style={styles.userProf}>{user?.student_flg == true ? 'Étudiant' : user?.profession}</Text>

          {user && user.student_flg == true && user.expires_at !== null && (
            <Text style={styles.userExpiresAt}>Expire le <Text
              style={{ fontFamily: 'Poppins-Bold', color: Colors.red }}>{user.expires_at}</Text>
            </Text>
          )}
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
              <Ionicons name="notifications" size={26} color={Colors.primary} />
            </Animated.View>
            :
            <Ionicons name="notifications" size={26} color={Colors.gray} />
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

        {/* Main Body - Split into 2 columns */}
        <View style={[styles.bodyRow, !(more && more?.data?.companiesIsMember?.length > 0) && styles.bodyCol]}>

          {/* LEFT COLUMN: User Card & Actions */}
          <View style={(more && more?.data?.companiesIsMember?.length > 0) && styles.columnLeft}>
            {more && more?.data?.companiesIsMember?.length > 0 &&
              <View style={styles.userCard}>
                <Text style={styles.teamTitle}>Équipe dont je fais partie :</Text>
                {more?.data?.companiesIsMember.map((company, index) => (
                  <View key={'company-' + index} style={styles.companyWrapper}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.companyType}>{company.establishment?.name}</Text>
                      <Text style={styles.companyName} numberOfLines={2} ellipsizeMode='tail'>{company.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setVisibleConfirmExit(true)} style={styles.quitButton}>
                      <Ionicons name='exit-outline' size={24} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            }

            <View style={[
              styles.cusButtonsContainer,
              shouldStackVertically && styles.cusButtonsContainerVertical
            ]}>
              <TouchableOpacity
                style={[
                  styles.shareButton,
                  shouldStackVertically && styles.shareButtonVertical
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  orthomasterShare({
                    message: "Rejoignez le premier écosystème de l'orthopédie !\n\n" +
                      user.name + " vous invite à découvrir la plateforme OrthoMaster. Une application gratuite, réservée aux professionnels de santé.\n\n" +
                      "Découvrez des centaines de contenus multidisciplinaires sur l’orthopédie :\n" +
                      "  - Micro-formations certifiantes" +
                      "  - Aide décisionnelle multimarque" +
                      "  - Replays de congrès" +
                      "  - Travaux pratiques" +
                      "  - Interviews d'experts" +
                      "  - Contenus pédagogiques pour patients" +
                      "  - ..." +
                      "\n\nCliquez sur ce lien ci-dessous\nhttps://auth.orthomaster.fr\n\n" +
                      "Ou visitez le site internet\n",
                    url: "https://orthomaster.fr"
                  }, 'app invite', null)
                }}
              >
                <Image
                  source={require('../../../assets/v2_images/icon/des-billets.png')}
                  style={styles.shareButtonIcon}
                  resizeMode="contain"
                />
                <Text style={styles.shareButtonText}>
                  Inviter à rejoindre OrthoMaster
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.favoriteButton,
                  shouldStackVertically && styles.favoriteButtonVertical
                ]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('settings-view')}
              >
                <Image
                  source={require('../../../assets/v2_images/icon/coeur.png')}
                  style={styles.favoriteButtonIcon}
                  resizeMode="contain"
                />
                <Text style={styles.favoriteButtonText}>
                  Mes centres d'intérêt
                </Text>
              </TouchableOpacity>
            </View>

            {!user?.has_company && !user?.student_flg &&
              <TouchableOpacity style={styles.proButton} onPress={openCompanyInfo}>
                <Image
                  source={require('../../../assets/v2_images/icon/equipe.png')}
                  style={styles.proButtonIcon}
                />
                <View style={styles.proTextContainer}>
                  <Text style={styles.proCardTitle}>Créer votre Espace Pro</Text>
                  <Text style={styles.proCardText}>pour utiliser OrthoMaster en équipe</Text>
                </View>
              </TouchableOpacity>
            }
          </View>

          {/* RIGHT COLUMN: Account & Support */}
          <View style={styles.columnRight}>
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
                showWarning={user?.reset_password_flg}
                onPress={() => (navigation.navigate('change-password'))}
              />
              <MenuItem
                iconName="folder-open-outline"
                title="Devis & Factures"
                isLast
                onPress={() => (navigation.navigate('document-view'))}
              />
            </View>

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
            </View>

            <View style={styles.section}>
              <TouchableOpacity
                style={styles.logoutButtonWeb}
                activeOpacity={0.7}
                onPress={() => setVisibleLogout(true)}
              >
                <Ionicons name="log-out-outline" size={24} color={Colors.primary} />
                <Text style={styles.logoutText}>Déconnexion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Portal Dialogs */}
      <Portal>
        <Dialog visible={visibleConfirmExit} onDismiss={() => setVisibleConfirmExit(false)} style={Styles.dialogWeb}>
          <Dialog.Title style={[Styles.dialogWebTitle, { color: Colors.red }]}>Quitter l'équipe</Dialog.Title>
          <Dialog.Content><Text style={Styles.dialogWebContent}>Êtes-vous sûr de vouloir quitter cette équipe ?</Text></Dialog.Content>
          <Dialog.Actions>
            <Button textColor={Colors.gray} labelStyle={{ fontFamily: 'Poppins-Medium' }} onPress={() => setVisibleConfirmExit(false)}>Annuler</Button>
            <Button textColor={Colors.danger} labelStyle={{ fontFamily: 'Poppins-Medium' }} onPress={handleConfirmExitCompany}>Quitter</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={visibleLogout} onDismiss={() => setVisibleLogout(false)} style={Styles.dialogWeb}>
          <Dialog.Title style={Styles.dialogWebTitle}>Déconnexion</Dialog.Title>
          <Dialog.Content><Text style={Styles.dialogWebContent}>Voulez-vous vraiment vous déconnecter ?</Text></Dialog.Content>
          <Dialog.Actions>
            <Button textColor={Colors.gray} labelStyle={{ fontFamily: 'Poppins-Medium' }} onPress={() => setVisibleLogout(false)}>Annuler</Button>
            <Button textColor={Colors.primary} labelStyle={{ fontFamily: 'Poppins-Medium' }} onPress={() => { setVisibleLogout(false); logout.mutate(); }}>Se déconnecter</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={alertConfig.visible} onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })} style={Styles.dialogWeb}>
          <Dialog.Title style={Styles.dialogWebTitle}>{alertConfig.title}</Dialog.Title>
          <Dialog.Content><Text style={Styles.dialogWebContent}>{alertConfig.message}</Text></Dialog.Content>
          <Dialog.Actions>
            <Button textColor={Colors.gray} labelStyle={{ fontFamily: 'Poppins-Medium' }} onPress={() => setAlertConfig({ ...alertConfig, visible: false })}>Fermer</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {isLoading && <BouncingDots color={Colors.primary} containerStyle={styles.loadingOverlay} />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 100,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  bodyRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.lg,
    flex: 1,
  },
  bodyCol: {
    flexDirection: 'column',
    maxWidth: 600,
    alignSelf: 'center'
  },
  columnLeft: {
    flex: 1,
    marginRight: Spacings.lg,
  },
  columnRight: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: Spacings.md,
    paddingHorizontal: Spacings.lg,
    borderRadius: 16,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
  },
  userProf: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.subtext2,
  },
  userExpiresAt: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  notificationButton: {
    padding: 4
  },
  userCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacings.lg,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  teamTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.purple,
    marginBottom: 8,
  },
  companyWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  companyType: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginBottom: -2,
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.blue,
  },
  quitButton: {
    paddingLeft: 10,
  },
  cusButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacings.md,
    marginVertical: 20,
  },
  cusButtonsContainerVertical: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#FF4B4B',
    borderRadius: 40,
    paddingVertical: 12,
    paddingLeft: 100,
    marginBottom: 20,
    position: 'relative',
  },
  shareButtonVertical: {
    flex: 0,
    width: '100%',
    minHeight: 50,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  shareButtonIcon: {
    width: 70,
    height: 70,
    position: 'absolute',
    left: 10,
    top: -14,
    zIndex: 10,
    resizeMode: 'contain'
  },
  shareButtonText: {
    color: Colors.white,
    paddingHorizontal: 10,
    fontFamily: 'Poppins-Medium',
  },
  favoriteButton: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    borderRadius: 40,
    paddingVertical: 12,
    marginBottom: 20,
    position: 'relative',
  },
  favoriteButtonVertical: {
    flex: 0,
    width: '100%',
    minHeight: 50,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  favoriteButtonIcon: {
    width: 60,
    height: 60,
    position: 'absolute',
    right: 20,
    top: -10,
    zIndex: 10,
    resizeMode: 'contain'
  },
  favoriteButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    paddingRight: 80,
    paddingLeft: 10,
    textAlign: 'center',
  },
  proButton: {
    backgroundColor: Colors.purple,
    borderRadius: 50,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
  },
  proButtonIcon: {
    width: 70,
    height: 90,
    marginTop: 0,
    resizeMode: 'contain'
  },
  proTextContainer: {
    paddingLeft: 10,
  },
  proCardTitle: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  proCardText: {
    color: Colors.white,
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
  },
  section: {
    marginBottom: 15,
  },
  sectionHeader: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.subtext2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
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
    marginLeft: 15,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
  },
  menuItemSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.subtext2,
  },
  logoutButtonWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    color: Colors.primary,
    marginLeft: 10,
    fontFamily: 'Poppins-Medium',
  },

  loadingOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  iconContainer: {
    position: 'relative',
  },
  warningBadge: {
    position: 'absolute',
    top: -2,
    right: -8,
  },
});