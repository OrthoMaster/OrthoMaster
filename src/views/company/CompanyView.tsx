import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Alert,
  Platform,
  Dimensions,
  Modal,
  Image,
  Linking
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TextInput } from 'react-native-paper';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

import { useQuery } from "@tanstack/react-query";
import { getCompany } from "../../services/v2/CompanyService";
import { BouncingDots } from '../../component/LoadingDots';

import { updateManager, removeMember, inviteMember } from '../../services/v2/CompanyService';
import { useGetUser } from '../../../src/hooks/auth.hook';

const { width } = Dimensions.get('screen');
const isTablet = Platform.OS !== 'web' && width >= 768;

interface Member {
  id: string;
  name: string;
  first_name: string,
  email: string;
  organization: {
    name: string
  };
  missing_fields_message: string;
  progress: number;
}

export const CompanyView = ({ navigation, route }) => {
  // Show bottom nav when screen is focused
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'flex' }
      });
    }, [navigation])
  );

  // Tab State
  const [activeTab, setActiveTab] = useState<'membres' | 'formations'>('formations');

  // Calculate dynamic circle width - 4 items per row
  const screenWidth = Dimensions.get('window').width;
  const isTablet = Platform.OS !== 'web' && screenWidth >= 768;

  const containerPadding = Spacings.lg * 2;
  const numberOfCircles = isTablet ? 8 : 4;
  const gapWidth = Spacings.sm * (numberOfCircles - 1);
  const circleWidth = (screenWidth - containerPadding - gapWidth) / numberOfCircles;
  const circleSize = circleWidth - 10;

  const { data: user } = useGetUser();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['company'],
    queryFn: () => getCompany(),
    retry: 1,
    retryDelay: 1000,
  });

  const renderMemberItem = ({ item, isAdmin = false }: { item: Member; isAdmin?: boolean }) => (
    <TouchableOpacity
      style={[styles.memberItem, isAdmin && styles.managerInfo]}
      disabled={isAdmin}
      onPress={() => {
        setSelectedMember(item);
        setShowMemberModal(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name + ' ' + item.first_name}</Text>
        <Text style={styles.memberRole}>{item.email}</Text>
        {item.organization &&
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-end'
          }}>
          </View>
        }
        {item.missing_fields_message &&
          <Text style={styles.memberMissingText}>{item.missing_fields_message}</Text>
        }
      </View>
      <View style={styles.organizationContainer}>
        <Text style={styles.memberOrganization}>{item.organization?.name}</Text>
      </View>
    </TouchableOpacity>
  );

  // Current member - STA
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const isSelectedMananger = () => {
    return data?.managers?.some(manager => manager.id === selectedMember?.id) || false;
  };
  const handleRemoveMember = () => {
    setShowMemberModal(false);
    Alert.alert(
      'Confirmer la suppression',
      `Voulez-vous vraiment retirer ${selectedMember?.name} de l'équipe ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => {
            setShowMemberModal(true);
          }
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeMember({ user_id: selectedMember?.id });
              if (result?.success) {
                Alert.alert('Succès', result.message || 'Membre retiré avec succès');
                refetch();
              } else {
                Alert.alert('Erreur', result?.message || 'Une erreur est survenue');
              }
            } catch (error) {
              Alert.alert('Erreur', error.message);
            }
          }
        }
      ]
    );
  };
  const handlePromoteToManager = () => {
    setShowMemberModal(false);
    Alert.alert(
      'Promouvoir',
      `Voulez-vous promouvoir ${selectedMember?.name} en tant que responsable ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => {
            setShowMemberModal(true);
          }
        },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              const result = await updateManager({ user_id: selectedMember?.id });
              if (result?.success) {
                Alert.alert('Succès', result.message || 'Statut de membre mis à jour');
                refetch();
              } else {
                Alert.alert('Erreur', result?.message || 'Une erreur est survenue');
              }
            } catch (error) {
              Alert.alert('Erreur', error.message);
            }
          }
        }
      ]
    );
  };
  // Current member - END

  // Invite member - STA
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleEmailChange = (value: string) => {
    setInviteEmail(value);

    // Clear error when typing
    if (emailError) {
      setEmailError('');
    }
  };
  const handleSendInvite = async () => {
    // Reset error
    setEmailError('');

    if (!inviteEmail.trim()) {
      setEmailError('Veuillez entrer une adresse email');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setEmailError('Veuillez entrer une adresse email valide');
      return;
    }

    // Invite
    try {
      const result = await inviteMember({ email: inviteEmail.trim() });
      if (result?.success) {
        Alert.alert('Invitation evoyée', result.message);
        setInviteEmail('');
        setEmailError('');
        setShowAddMemberModal(false);
      } else {
        Alert.alert('Erreur', result?.message || 'Une erreur est survenue');
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  };
  // Invite member - END

  const reload = () => { refetch(); };

  const openCompanyInfo = () => {
    navigation.navigate('company-info', {
      company: data.company,
      estabs: data.estabs
    });
  }

  /** User trainings - STA  */
  // Render course circle
  const renderCourseCircle = (course) => {
    const progress = course.pivot?.progress || 0;
    const strokeWidth = 2;
    const radius = (circleSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (circumference * progress) / 100;

    return (
      <View key={course.id} style={[styles.courseItem, { width: circleWidth }]}>
        <View style={{ position: 'relative' }}>
          {/* Background circle */}
          <View style={[styles.courseCircle,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            backgroundColor: course.training?.color,
          }]}>
            {course.image
              ? <Image
                source={{ uri: process.env.EXPO_PUBLIC_S3_URL + course.image }}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 100,
                }}
                resizeMode="contain"
              />
              : <Text style={styles.courseIcon}>📚</Text>}
          </View>

          {/* Progress border using SVG */}
          <Svg
            width={circleSize}
            height={circleSize}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <Circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              stroke={Colors.grayLight}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              stroke={Colors.lgreen}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${circleSize / 2}, ${circleSize / 2}`}
            />
          </Svg>
        </View>
        <Text style={[styles.courseProgress, { color: course.training?.color || Colors.blue }]}>
          {progress}%
        </Text>
        <Text style={styles.courseName} numberOfLines={1} ellipsizeMode='tail'>
          {course.short_name ?? course.name}
        </Text>
      </View >
    );
  };

  // Render member formation item
  const renderMemberFormationItem = (member) => {
    const hasFormations = member.packages.length > 0;

    return (
      <View key={member.id} style={styles.formationMemberCard}>
        <View style={styles.formationMemberHeader}>
          <View style={styles.formationMemberInfo}>
            <Text style={styles.formationMemberName} numberOfLines={1} ellipsizeMode='tail'>
              {member.name + ' ' + member.first_name}
            </Text>
            <Text style={styles.formationMemberEmail} numberOfLines={1} ellipsizeMode='tail'>{member.email}</Text>
          </View>
        </View>

        <View style={styles.coursesContainer}>
          {!hasFormations && (
            <View style={styles.coursesGrid}>
              <Text style={styles.coursesEmptyText}>Aucune formation pour le moment</Text>
            </View>
          )}

          {hasFormations && (
            <View style={styles.coursesGrid}>
              {member.packages.map(course => renderCourseCircle(course))}
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render Membres Tab Content
  const renderMembresContent = () => (
    <>
      {data && !error &&
        <View style={styles.content}>
          {/* Company Info Card */}
          <TouchableOpacity style={styles.companyCard} onPress={openCompanyInfo}>
            <View style={styles.companyMetadata}>
              <Text style={styles.companyType}>{data.company.establishment?.name}</Text>
              <Text style={styles.companyName}>{data.company.name}</Text>
              <Text style={styles.companyData}>{data.company.postal_code + ' ' + data.company.city + ' ' + data.company.country}</Text>
            </View>
            {data.company.establishment?.image
              ? <Image
                source={{ uri: process.env.EXPO_PUBLIC_S3_URL + data.company.establishment?.image }}
                style={styles.companyEstabImage}
                resizeMode='contain'
              />
              : <View style={styles.companyIconWrapper}>
                <Ionicons name={'medical-sharp'} size={30} color={Colors.purple2} />
              </View>
            }
          </TouchableOpacity>

          {/* Manager Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{data.managers.length > 1 ? 'Responsables' : 'Responsable'}</Text>
            </View>
            {data.managers.map((admin) => (
              <View key={admin.id}>{renderMemberItem({ item: admin, isAdmin: true })}</View>
            ))}
          </View>

          {/* Member Section */}
          {data.members &&
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{data.members.length > 1 ? 'Membres (' + data.members.length + ')' : 'Membre'}</Text>
              </View>
              {data.members.map((member) => (
                <View key={member.id}>{renderMemberItem({ item: member, isAdmin: false })}</View>
              ))}
            </View>
          }
        </View>
      }
    </>
  );

  // Render Formations Tab Content
  const renderFormationsContent = () => {
    if (!data || error) return null;

    const allMembers = [...(data.users || [])];

    return (
      <View style={styles.formationsContent}>
        {allMembers.map(member => renderMemberFormationItem(member))}
      </View>
    );
  };
  /** User trainings - END */

  /** Add Package - STA */
  const [showAddPkgInfoModal, setShowAddPkgInfoModal] = useState(false);
  const moveToAddPkg = () => {
    setShowAddPkgInfoModal(false);
    navigation.navigate('payment-method')
  }
  /** Add Package - END */

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.purple} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Équipe</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'membres' && styles.activeTab]}
          onPress={() => setActiveTab('membres')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'membres' && styles.activeTabText]}>
            Membres
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'formations' && styles.activeTab]}
          onPress={() => setActiveTab('formations')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'formations' && styles.activeTabText]}>
            Formations
          </Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      {isLoading && !error &&
        <BouncingDots
          color={Colors.blue}
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
      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={64}
            color={Colors.danger}
          />
          <Text style={styles.errorTitle}>Erreur de chargement</Text>
          <Text style={styles.errorMessage}>
            Impossible de charger les données de l'équipe
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Ionicons name="refresh" size={20} color={Colors.white} />
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={reload}
            colors={[Colors.blue]}
            tintColor={Colors.blue}
          />
        }
      >
        {activeTab === 'membres' && renderMembresContent()}
        {activeTab === 'formations' && renderFormationsContent()}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Buttons - Only show on Membres tab */}
      {activeTab === 'membres' && !error && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fabPrimary}
            onPress={() => setShowAddMemberModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-sharp" size={36} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Action Buttons - Only show on Membres tab */}
      {activeTab === 'formations' && !error && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fabSecondary}
            onPress={() => setShowAddPkgInfoModal(true)}
            activeOpacity={0.8}
          >
            <Image
              style={{ width: 45, height: 35 }}
              resizeMode="contain"
              source={require('../../../assets/v2_images/icon/add-package.png')}
            />
            <Text style={styles.fabSecondaryText}>Ajouter des{'\n'}formations</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Member Detail Modal */}
      <Modal
        visible={showMemberModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMemberModal(false)}
      >
        <View style={styles.memberModalOverlay}>
          <View style={styles.memberModalContent}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.memberModalClose}
              onPress={() => setShowMemberModal(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={Colors.gray} />
            </TouchableOpacity>

            {/* Member Info */}
            <View style={styles.memberModalInfo}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                  {selectedMember?.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              </View>
              <Text style={styles.memberModalName}>{selectedMember?.name}</Text>
              <Text style={styles.memberModalRole}>{selectedMember?.email}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.memberModalActions}>
              {!isSelectedMananger() && (
                <TouchableOpacity
                  style={[styles.memberModalButton, styles.promoteButton]}
                  onPress={handlePromoteToManager}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="account-key-outline" size={18} color={Colors.blue} />
                  <Text style={styles.promoteButtonText}>Promouvoir responsable</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.memberModalButton, styles.removeButton]}
                onPress={handleRemoveMember}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="account-remove-outline" size={18} color={Colors.danger} />
                <Text style={styles.removeButtonText}>Retirer de l'équipe</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.memberModalOverlay}>
          <View style={styles.memberModalContent}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.memberModalClose}
              onPress={() => {
                setShowAddMemberModal(false);
                setInviteEmail('');
                setEmailError('');
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={Colors.gray} />
            </TouchableOpacity>

            {/* Title */}
            <View style={styles.addMemberHeader}>
              <Ionicons name="person-add" size={50} color={Colors.blue} />
              <Text style={styles.addMemberTitle}>Ajouter un membre</Text>
            </View>

            {/* Email Input */}
            <View style={Styles.inputContainer}>
              <TextInput
                multiline={false}
                scrollEnabled={false}
                numberOfLines={1}
                maxLength={100}
                mode="outlined"
                label="Email"
                value={inviteEmail}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                disabled={false}
                returnKeyType="send"
                onSubmitEditing={handleSendInvite}
                error={!!emailError}
                style={Styles.textInput}
                contentStyle={Styles.textInputContent}
                outlineStyle={Styles.textInputOutline}
                theme={{
                  colors: {
                    primary: Colors.blue,
                    error: Colors.danger,
                  }
                }}
              />

              {emailError && (
                <Text style={Styles.fieldErrorText}>{emailError}</Text>
              )}
            </View>


            {/* Send Button */}
            <TouchableOpacity
              style={styles.sendInviteButton}
              onPress={handleSendInvite}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={18} color={Colors.white} />
              <Text style={styles.sendInviteButtonText}>Envoyer l'invitation</Text>
            </TouchableOpacity>

            <View style={styles.regMemberWrapper}>
              <Text style={styles.regMemberSubText}>Vous avez la possibilité de créer manuellement les comptes de vos membres via le bouton ci-dessous.</Text>
              <TouchableOpacity
                style={[styles.sendInviteButton, { backgroundColor: Colors.purple }]}
                onPress={() => { Linking.openURL('https://auth.orthomaster.fr/group/members?x_id=' + user.id + '&y_id=' + data.company.id); }}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={18} color={Colors.white} />
                <Text style={styles.sendInviteButtonText}>Ajouter moi-même</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Add Package */}
      <Modal
        visible={showAddPkgInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddPkgInfoModal(false)}
      >
        <TouchableOpacity
          style={styles.addPkgInfoModalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddPkgInfoModal(false)}
        >
          <TouchableOpacity
            style={styles.addPkgInfoModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.addPkgInfoHeader}>
              <View style={styles.addPkgInfoIconWrapper}>
                <Ionicons name="information-circle" size={24} color={Colors.blue} />
              </View>
              <Text style={styles.addPkgInfoTitle}>IMPORTANT</Text>
              <TouchableOpacity
                onPress={() => setShowAddPkgInfoModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.addPkgInfoCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.addPkgInfoBody}>
              <View style={[styles.addPkgInfoNote, { backgroundColor: Colors.blue3 }]}>
                <Text style={[styles.addPkgInfoDescription, { color: Colors.blueDark, marginBottom: 0 }]}>
                  Si vous souhaitez un financement par
                  un <Text style={[styles.textBold, { color: Colors.red }]}>organisme de compétence</Text> (OPCO, FIFPL, ...)
                </Text>
              </View>

              <Text style={styles.addPkgInfoDescription}>
                En raison des différences de prise en charge, vous ne pouvez créer
                de <Text style={styles.textBold}>demande de formations</Text> qu'<Text style={styles.textBold}>
                  un organisme de financement à la fois.</Text>
              </Text>

              <View style={styles.addPkgInfoSection}>
                <Text style={styles.addPkgInfoSectionTitle}>Voici comment faire :</Text>
                <View style={styles.addPkgInfoListContainer}>
                  <View style={styles.addPkgInfoBulletNumber}><Text style={styles.addPkgInfoBullet}>1.</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addPkgInfoBullet}>Sélectionnez l’<Text style={styles.textBold}>organisme</Text></Text>
                  </View>
                </View>
                <View style={styles.addPkgInfoListContainer}>
                  <View style={styles.addPkgInfoBulletNumber}><Text style={styles.addPkgInfoBullet}>2.</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addPkgInfoBullet}>Indiquez les <Text style={styles.textBold}>membres</Text> de votre équipe qui en bénéficient</Text>
                  </View>
                </View>
                <View style={styles.addPkgInfoListContainer}>
                  <View style={styles.addPkgInfoBulletNumber}><Text style={styles.addPkgInfoBullet}>3.</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addPkgInfoBullet}>Choisissez les <Text style={styles.textBold}>modules de formation</Text> à attribuer</Text>
                  </View>
                </View>
                <View style={styles.addPkgInfoListContainer}>
                  <View style={styles.addPkgInfoBulletNumber}><Text style={styles.addPkgInfoBullet}>4.</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.addPkgInfoBullet}>Signez en ligne les <Text style={styles.textBold}>documents</Text> (vous recevrez les informations complémentaires par mail)</Text>
                  </View>
                </View>
              </View>
              <Text style={[styles.addPkgInfoDescription, { marginBottom: Spacings.lg }]}>
                Répétez l'opération avec un autre organisme (selon vos besoins).
              </Text>

              <TouchableOpacity
                style={styles.sendInviteButton}
                onPress={moveToAddPkg}
                activeOpacity={0.8}
              >
                <Text style={styles.sendInviteButtonText}>Continuer</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.purple,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.grayLight,
  },
  header: {
    backgroundColor: Colors.purple,
    paddingHorizontal: Spacings.lg,
    flexDirection: 'row',
    alignItems: 'center',
    height: isTablet ? 100 : 60,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    textAlign: 'right',
    color: Colors.white,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.md,
  },
  headerIconButton: {
    paddingRight: Spacings.xxxs,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.purple,
    paddingHorizontal: Spacings.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacings.sm,
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: Colors.purple2,
  },
  activeTab: {
    backgroundColor: Colors.grayLight,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  activeTabText: {
    fontFamily: 'Poppins-Bold',
    color: Colors.purple,
  },

  content: {
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.lg,
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    gap: Spacings.xxs,
    borderRadius: 16,
    padding: Spacings.lg,
    marginBottom: Spacings.lg,
    marginTop: Spacings.md,
    shadowColor: Colors.gray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.purple
  },
  companyEstabImage: {
    width: 50,
    height: 60,
    flexShrink: 0,
  },
  companyIconWrapper: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyMetadata: {
    flex: 1,
    flexShrink: 1,
    marginRight: Spacings.xs,
  },
  companyType: {
    fontSize: 12,
    paddingLeft: 1,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
    marginBottom: Spacings.xxs,
  },
  companyName: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.purple,
  },
  companyData: {
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: Colors.text,
  },
  section: {
    marginBottom: Spacings.md,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingVertical: Spacings.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },

  // Noti
  notificationButton: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  iconContainer: {
    position: 'relative',
  },
  warningBadge: {
    position: 'absolute',
    top: -2,
    right: -8,
  },

  // Member
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.successBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacings.sm,
  },
  memberAvatarText: {
    fontSize: 30,
    fontFamily: 'Poppins-Bold',
    color: Colors.success,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.sm,
    borderRadius: 8,
    marginBottom: Spacings.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  managerInfo: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.blue,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: 'Roboto',
  },
  memberRole: {
    fontSize: 12,
    color: Colors.gray,
    fontFamily: 'Poppins-Light',
  },
  memberOrganization: {
    flex: 0,
    marginVertical: Spacings.xxs,
    color: Colors.gray,
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    borderWidth: 0.5,
    borderRadius: 4,
    borderColor: Colors.gray,
    paddingVertical: Spacings.xxxs,
    paddingHorizontal: Spacings.sm,
  },
  memberMissingText: {
    fontSize: 9,
    fontFamily: 'Poppins-Light',
    color: Colors.danger,
  },
  organizationContainer: {
    marginLeft: 12,
  },

  // Member Modal Styles
  memberModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacings.xl,
  },
  memberModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacings.xl,
    width: '100%',
    maxWidth: 340,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  memberModalClose: {
    position: 'absolute',
    top: Spacings.md,
    right: Spacings.md,
    zIndex: 1,
  },
  memberModalInfo: {
    alignItems: 'center',
    marginTop: Spacings.lg,
    marginBottom: Spacings.xxl,
  },
  memberModalName: {
    fontSize: 18,
    fontFamily: 'Roboto',
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacings.md
  },
  memberModalRole: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textAlign: 'center',
  },
  memberModalActions: {
    gap: Spacings.sm,
  },
  memberModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: Spacings.xl,
    paddingVertical: Spacings.xs,
    borderRadius: 8,
    gap: Spacings.xs,
  },
  promoteButton: {
    backgroundColor: Colors.blueBackground,
    borderWidth: 1,
    borderColor: Colors.blue,
  },
  promoteButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.blue,
  },
  removeButton: {
    backgroundColor: Colors.dangerBackground,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  removeButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.danger,
  },

  // Fab
  fabContainer: {
    position: 'absolute',
    right: Spacings.lg,
    bottom: Spacings.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPrimary: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.purpleDark,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.purpleDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 2,
    opacity: 0.7
  },
  fabSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.lg,
    borderRadius: 16,
    backgroundColor: Colors.white,
    opacity: 0.8,
    shadowColor: Colors.purpleDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: Colors.purple,
  },
  fabSecondaryText: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.purple,
    marginLeft: Spacings.xs
  },

  // Invite member
  addMemberHeader: {
    alignItems: 'center',
    marginTop: Spacings.lg,
    marginBottom: Spacings.xl,
  },
  addMemberTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginTop: Spacings.sm,
  },
  sendInviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blue,
    paddingVertical: Spacings.sm,
    borderRadius: 8,
    gap: Spacings.xs,
  },
  sendInviteButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },

  // Formations Tab Styles
  formationsContent: {
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.lg,
    paddingBottom: Spacings.xxxl,
  },
  formationMemberCard: {
    marginBottom: Spacings.lg,
  },
  formationMemberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacings.sm,
    borderLeftWidth: 2,
    borderLeftColor: Colors.blue,
    paddingLeft: Spacings.xs
  },
  formationMemberInfo: {
    flex: 1,
  },
  formationMemberName: {
    fontSize: 14,
    fontFamily: 'Roboto',
    fontWeight: '400',
    color: Colors.text,
    marginBottom: -2,
  },
  formationMemberEmail: {
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: Colors.gray,
  },
  coursesContainer: {
    flexDirection: 'row',
  },
  coursesEmptyText: {
    fontSize: 10,
    fontFamily: 'Roboto',
    color: Colors.subtext,
    textAlign: 'center',
    marginTop: -4,
  },
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.sm,
  },
  courseItem: {
    alignItems: 'center',
  },
  courseCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacings.xxs,
    padding: Spacings.xxs
  },
  courseIcon: {
    fontSize: 14,
  },
  courseName: {
    fontSize: 9,
    fontFamily: 'Poppins-Light',
    color: Colors.text,
    textAlign: 'center',
  },
  courseProgress: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    letterSpacing: 1,
  },

  // Empty state (for Formations tab)
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacings.xl,
    paddingVertical: Spacings.xxxl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginTop: Spacings.lg,
    marginBottom: Spacings.xs,
  },
  emptyMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textAlign: 'center',
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacings.xl,
    backgroundColor: Colors.grayLight,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginTop: Spacings.lg,
    marginBottom: Spacings.xs,
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: Spacings.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.sm,
    borderRadius: 8,
    gap: Spacings.xs,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },

  // Add Package Info Modal Styles
  addPkgInfoModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: Spacings.lg,
  },
  addPkgInfoModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '100%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  addPkgInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacings.lg,
    paddingTop: Spacings.lg,
    paddingBottom: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  addPkgInfoIconWrapper: {
    marginRight: Spacings.sm,
  },
  addPkgInfoTitle: {
    flex: 1,
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.blue,
  },
  addPkgInfoCloseButton: {
    paddingHorizontal: Spacings.lg,
  },
  addPkgInfoBody: {
    padding: Spacings.lg,
  },
  addPkgInfoDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    marginBottom: Spacings.md,
    textAlign: 'justify',
  },
  addPkgInfoSection: {
    marginBottom: Spacings.xs,
  },
  addPkgInfoSectionTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
    marginBottom: Spacings.md,
  },
  addPkgInfoListContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacings.sm,
  },
  addPkgInfoBullet: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    lineHeight: 16,
    marginLeft: Spacings.xs,
    flexWrap: 'wrap',
  },
  addPkgInfoBulletNumber: {
    width: 25,
    alignItems: 'flex-end'
  },
  addPkgInfoText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    lineHeight: 18,
  },
  addPkgInfoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
    padding: Spacings.sm,
    borderRadius: 8,
    marginBottom: Spacings.md,
  },
  addPkgInfoNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginLeft: Spacings.xs,
  },
  textBold: {
    fontFamily: 'Poppins-Bold',
  },

  // Open member register form
  regMemberWrapper: {
    marginTop: Spacings.lg,
    paddingTop: Spacings.md,
    borderTopWidth: 1,
    borderTopColor: Colors.line
  },
  regMemberSubText: {
    fontSize: 14,
    color: Colors.subtext2,
    fontFamily: 'Poppins-Regular',
    marginBottom: Spacings.sm,
  }
});