import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Modal,
  Image,
  Linking,
  Dimensions
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TextInput, Portal, Dialog, Button } from 'react-native-paper';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

import { useQuery } from "@tanstack/react-query";
import { getCompany } from "../../services/v2/CompanyService";
import { BouncingDots } from '../../component/LoadingDots';

import { DiplomaModalContent } from './components/DiplomaModalContent';

import { updateManager, removeMember, inviteMember, removeCompany, preRegDiploma } from '../../services/v2/CompanyService';
import { useGetUser } from '../../../src/hooks/auth.hook';

const SCREEN_HEIGHT = Dimensions.get('window').height;

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
  packages: any[];
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

  const circleSize = 70; // Fixed size for web

  const { data: user, refetch: refetchUser } = useGetUser();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['company'],
    queryFn: () => getCompany(),
    retry: 1,
    retryDelay: 1000,
  });

  // Current member - STA
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Dialog states
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showRemoveCompanyDialog, setShowRemoveCompanyDialog] = useState(false);
  const [messageDialog, setMessageDialog] = useState({ title: '', message: '' });

  const isSelectedMananger = () => {
    return data?.managers?.some(manager => manager.id === selectedMember?.id) || false;
  };

  const handleRemoveMember = () => {
    setShowMemberModal(false);
    setShowRemoveDialog(true);
  };

  const confirmRemoveMember = async () => {
    setShowRemoveDialog(false);
    try {
      const result = await removeMember({ user_id: selectedMember?.id });
      if (result?.success) {
        setMessageDialog({ title: 'Succès', message: result.message || 'Membre retiré avec succès' });
        setShowMessageDialog(true);
        refetch();
      } else {
        setMessageDialog({ title: 'Erreur', message: result?.message || 'Une erreur est survenue' });
        setShowMessageDialog(true);
      }
    } catch (error) {
      setMessageDialog({ title: 'Erreur', message: error.message });
      setShowMessageDialog(true);
    }
  };

  const handlePromoteToManager = () => {
    setShowMemberModal(false);
    setShowPromoteDialog(true);
  };

  const confirmPromoteToManager = async () => {
    setShowPromoteDialog(false);
    try {
      const result = await updateManager({ user_id: selectedMember?.id });
      if (result?.success) {
        setMessageDialog({ title: 'Succès', message: result.message || 'Statut de membre mis à jour' });
        setShowMessageDialog(true);
        refetch();
      } else {
        setMessageDialog({ title: 'Erreur', message: result?.message || 'Une erreur est survenue' });
        setShowMessageDialog(true);
      }
    } catch (error) {
      setMessageDialog({ title: 'Erreur', message: error.message });
      setShowMessageDialog(true);
    }
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
        setMessageDialog({ title: 'Invitation envoyée', message: result.message });
        setShowMessageDialog(true);
        setInviteEmail('');
        setEmailError('');
        setShowAddMemberModal(false);
      } else {
        setShowAddMemberModal(false);
        setMessageDialog({ title: 'Erreur', message: result?.message || 'Une erreur est survenue' });
        setShowMessageDialog(true);
      }
    } catch (error) {
      setShowAddMemberModal(false);
      setMessageDialog({ title: 'Erreur', message: error.message });
      setShowMessageDialog(true);
    }
  };
  // Invite member - END

  // Remove company
  const handleRemoveCompany = async () => {
    try {
      const result = await removeCompany();
      if (result?.success) {
        refetchUser();
        navigation.navigate('profile');
      } else {
        setShowAddMemberModal(false);
        setMessageDialog({ title: 'Erreur', message: result?.message || 'Une erreur est survenue' });
        setShowMessageDialog(true);
      }
    } catch (error) {
      setShowAddMemberModal(false);
      setMessageDialog({ title: 'Erreur', message: error.message });
      setShowMessageDialog(true);
    } finally {
      setShowRemoveCompanyDialog(false);
    }
  }

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
      <View key={course.id} style={styles.courseItem}>
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
        <Text style={styles.courseName} numberOfLines={2} ellipsizeMode='tail'>
          {course.short_name ?? course.name}
        </Text>
      </View >
    );
  };

  // Check if member is manager
  const isMemberManager = (memberId: string) => {
    return data?.managers?.some(manager => manager.id === memberId) || false;
  };

  // Render member with formations
  const renderMemberWithFormations = ({ item }: { item: Member }) => {
    const hasFormations = item.packages && item.packages.length > 0;
    const isManager = isMemberManager(item.id);

    return (
      <View style={styles.memberSection}>
        <TouchableOpacity
          style={[styles.memberItem, isManager && styles.managerInfo]}
          disabled={isManager}
          onPress={() => {
            setSelectedMember(item);
            setShowMemberModal(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{item.name + ' ' + item.first_name}</Text>
            <Text style={styles.memberRole}>{item.email}</Text>
            {item.missing_fields_message &&
              <Text style={styles.memberMissingText}>{item.missing_fields_message}</Text>
            }
          </View>
          {item.organization?.name && (
            <View style={styles.organizationContainer}>
              <Text style={styles.memberOrganization}>{item.organization.name}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Formations for this member */}
        {hasFormations && (
          <View style={styles.memberFormationsContainer}>
            <View style={styles.coursesGrid}>
              {item.packages.map(course => renderCourseCircle(course))}
            </View>
          </View>
        )}

        {!hasFormations && (
          <View style={styles.memberFormationsContainer}>
            <Text style={styles.coursesEmptyText}>Aucune formation pour le moment</Text>
          </View>
        )}
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

  /** Pre-reg Diploma - STA */
  const [showPreRegDiplomaModal, setShowPreRegDiplomaModal] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState(false);

  const preReg = async () => {
    setShowPreRegDiplomaModal(false);
    const result = await preRegDiploma();
    setAlertMessage(result.message);
    setShowAlertDialog(true);
  }
  /** Pre-reg Diploma - END */

  // Separate users into managers and members
  const allUsers = data?.users || [];
  const managers = data?.managers || [];
  const members = data?.members || [];

  // Create a map to enrich users with organization data
  const userMap = new Map();

  // Add managers with their organization
  managers.forEach(manager => {
    userMap.set(manager.id, { ...manager });
  });

  // Add members with their organization
  members.forEach(member => {
    if (!userMap.has(member.id)) {
      userMap.set(member.id, { ...member });
    }
  });

  // Enrich with packages from users
  allUsers.forEach(user => {
    if (userMap.has(user.id)) {
      const existing = userMap.get(user.id);
      userMap.set(user.id, {
        ...existing,
        packages: user.packages || []
      });
    } else {
      userMap.set(user.id, user);
    }
  });

  const enrichedUsers = Array.from(userMap.values());
  const managerIds = managers.map(m => m.id);
  const managersWithFormations = enrichedUsers.filter(user => managerIds.includes(user.id));
  const membersWithFormations = enrichedUsers.filter(user => !managerIds.includes(user.id));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.purple} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Équipe</Text>
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
        {data && !error && (
          <View style={styles.webLayout}>
            {/* Left Column - 30% */}
            <View style={styles.leftColumn}>
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

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowAddMemberModal(true)}
                  activeOpacity={0.8}
                >
                  <Image
                    style={{ width: 40, height: 40 }}
                    resizeMode="contain"
                    source={require('../../../assets/v2_images/icon/add-member.png')}
                  />
                  <Text style={styles.actionButtonText}>Ajouter des membres</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={() => setShowAddPkgInfoModal(true)}
                  activeOpacity={0.8}
                >
                  <Image
                    style={{ width: 40, height: 40 }}
                    resizeMode="contain"
                    source={require('../../../assets/v2_images/icon/add-package.png')}
                  />
                  <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                    Ajouter des formations
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonSuccess]}
                  onPress={() => setShowPreRegDiplomaModal(true)}
                  activeOpacity={0.8}
                >
                  <Image
                    style={{ width: 40, height: 40 }}
                    resizeMode="contain"
                    source={require('../../../assets/v2_images/icon/add-diploma.png')}
                  />
                  <Text style={[styles.actionButtonText, styles.actionButtonTextSuccess]}>
                    Pré-inscription Diplôme
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonDanger]}
                  onPress={() => setShowRemoveCompanyDialog(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-bin-outline" size={24} color={Colors.danger} />
                  <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                    Supprimer mon équipe
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Column - 70% */}
            <View style={styles.rightColumn}>
              <View style={styles.membersCard}>
                {/* Managers Section */}
                {managersWithFormations.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>
                        {managersWithFormations.length > 1 ? 'Responsables' : 'Responsable'}
                      </Text>
                    </View>
                    {managersWithFormations.map((manager) => (
                      <View key={manager.id}>
                        {renderMemberWithFormations({ item: manager })}
                      </View>
                    ))}
                  </View>
                )}

                {/* Members Section */}
                {membersWithFormations.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>
                        {membersWithFormations.length > 1 ? 'Membres (' + membersWithFormations.length + ')' : 'Membre'}
                      </Text>
                    </View>
                    {membersWithFormations.map((member) => (
                      <View key={member.id}>
                        {renderMemberWithFormations({ item: member })}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

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
                    <Text style={styles.addPkgInfoBullet}>Sélectionnez l'<Text style={styles.textBold}>organisme</Text></Text>
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

      {/* Dialog using Portal */}
      <Portal>
        {/* Remove Member Confirmation Dialog */}
        <Dialog
          visible={showRemoveDialog}
          onDismiss={() => setShowRemoveDialog(false)}
          style={Styles.dialogWeb}
        >
          <Dialog.Title style={[Styles.dialogWebTitle, { color: Colors.danger }]}>Confirmer la suppression</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>Voulez-vous vraiment retirer {selectedMember?.name} de l'équipe ?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={Colors.gray} labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => {
                setShowRemoveDialog(false);
                setShowMemberModal(true);
              }}>Annuler</Button>
            <Button onPress={confirmRemoveMember} textColor={Colors.danger} labelStyle={{ fontFamily: 'Poppins-Medium' }}>Supprimer</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Promote to Manager Confirmation Dialog */}
        <Dialog
          visible={showPromoteDialog}
          onDismiss={() => setShowPromoteDialog(false)}
          style={Styles.dialogWeb}
        >
          <Dialog.Title style={[Styles.dialogWebTitle, { color: Colors.blue }]}>Promouvoir</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>Voulez-vous promouvoir {selectedMember?.name} en tant que responsable ?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={Colors.gray} labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => {
                setShowPromoteDialog(false);
                setShowMemberModal(true);
              }}>Annuler</Button>
            <Button
              textColor={Colors.blue} labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={confirmPromoteToManager}>Confirmer</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Remove Company Dialog */}
        <Dialog
          visible={showRemoveCompanyDialog}
          onDismiss={() => setShowRemoveCompanyDialog(false)}
          style={Styles.dialogWeb}
        >
          <Dialog.Title style={[Styles.dialogWebTitle, { color: Colors.danger }]}>{'Confirmer la suppression'}</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>{
              data?.managers?.length > 1 ? "Êtes-vous sûr de vouloir supprimer votre équipe ? Elle restera active avec un autre responsable."
                : (data?.members?.length > 0
                  ? "Êtes-vous sûr de vouloir supprimer votre équipe ? Les autres membres la quitteront automatiquement."
                  : "Êtes-vous sûr de vouloir supprimer votre équipe ?"
                )
            }</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={Colors.gray} labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => setShowRemoveCompanyDialog(false)}>Fermer</Button>
            <Button
              textColor={Colors.danger} labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => handleRemoveCompany()}>Supprimer</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Alert Dialog */}
        <Dialog
          visible={showAlertDialog}
          onDismiss={() => setShowAlertDialog(false)}
          style={Styles.dialogWeb}
        >
          <Dialog.Title style={[Styles.dialogWebTitle, { color: Colors.warning }]}>Pré-inscription Diplôme</Dialog.Title>
          <Dialog.Content>
            <Text style={Styles.dialogWebContent}>{alertMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={Colors.gray} labelStyle={{ fontFamily: 'Poppins-Medium' }}
              onPress={() => { setShowAlertDialog(false) }}>Fermer</Button>
          </Dialog.Actions>
        </Dialog>


      </Portal>

      {/* Pre-reg Diploma */}
      <Modal
        visible={showPreRegDiplomaModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPreRegDiplomaModal(false)}
      >
        <TouchableOpacity
          style={styles.addPkgInfoModalOverlay}
          activeOpacity={1}
          onPress={() => setShowPreRegDiplomaModal(false)}
        >
          <TouchableOpacity
            style={styles.addPkgInfoModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.addPkgInfoHeader}>
              <View style={styles.addPreRegTitleWrapper}>
                <Text style={styles.addPreRegSubTitle}>Pour la pharmacie, un diplôme unique et inédit</Text>
                <Text style={styles.addPreRegTitle}>Conseiller expert en orthopédie</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPreRegDiplomaModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.addPkgInfoCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.gray} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.75 }} contentContainerStyle={{ padding: Spacings.md }}>
              <DiplomaModalContent onPreReg={preReg} />
            </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 100,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    textAlign: 'right',
    color: Colors.white,
  },

  // Web Layout - 2 columns
  webLayout: {
    flexDirection: 'row',
    padding: Spacings.xl,
    gap: Spacings.xl,
    alignSelf: 'center',
    width: '100%',
  },
  leftColumn: {
    width: '30%',
    minWidth: 300,
  },
  rightColumn: {
    flex: 1,
  },

  // Company Card
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    gap: Spacings.xs,
    borderRadius: 16,
    padding: Spacings.lg,
    marginBottom: Spacings.lg,
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
    fontSize: 14,
    paddingLeft: 1,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
    marginBottom: Spacings.xxs,
  },
  companyName: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.purple,
    marginBottom: Spacings.xs
  },
  companyData: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.subtext2,
  },

  // Action Buttons (Left Column)
  actionButtons: {
    gap: Spacings.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.purpleDark,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.lg,
    borderRadius: 12,
    gap: Spacings.sm,
    shadowColor: Colors.purpleDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
    height: 60,
  },
  actionButtonSecondary: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.purple,
  },
  actionButtonSuccess: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.success,
    shadowColor: Colors.success,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  actionButtonTextSecondary: {
    color: Colors.purple,
  },
  actionButtonTextSuccess: {
    color: Colors.success,
  },
  actionButtonDanger: {
    backgroundColor: Colors.red3,
    borderWidth: 2,
    borderColor: Colors.danger,
    shadowColor: Colors.danger,
  },
  actionButtonTextDanger: {
    color: Colors.danger,
  },

  // Members Card (Right Column)
  membersCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacings.xl,
    shadowColor: Colors.gray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },

  section: {
    marginBottom: Spacings.xl,

  },
  sectionHeader: {
    marginBottom: Spacings.md,
    marginLeft: -Spacings.xl - 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    backgroundColor: Colors.purple,
    alignSelf: 'flex-start',
    paddingLeft: Spacings.xl,
    paddingRight: Spacings.lg,
    paddingVertical: Spacings.xs,
    borderBottomEndRadius: 8,
    borderTopEndRadius: 8,
  },

  // Member Section (with formations)
  memberSection: {
    marginBottom: Spacings.lg,
    paddingBottom: Spacings.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
  },

  // Member Item
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
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
    fontSize: 16,
    color: Colors.text,
    fontFamily: 'Roboto',
    fontWeight: '400',
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
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    borderWidth: 1,
    borderRadius: 4,
    borderColor: Colors.gray,
    paddingVertical: Spacings.xxxs,
    paddingHorizontal: Spacings.sm,
  },
  memberMissingText: {
    fontSize: 10,
    fontFamily: 'Poppins-Light',
    color: Colors.danger,
    marginTop: 2,
  },
  organizationContainer: {
    marginLeft: 12,
  },

  // Member Formations
  memberFormationsContainer: {
    paddingLeft: Spacings.md,
    marginTop: Spacings.xs,
  },
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacings.md,
  },
  coursesEmptyText: {
    fontSize: 12,
    fontFamily: 'Poppins-Light',
    color: Colors.subtext,
    fontStyle: 'italic',
  },
  courseItem: {
    alignItems: 'center',
    width: 80,
  },
  courseCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacings.xxs,
    padding: Spacings.xxs
  },
  courseIcon: {
    fontSize: 16,
  },
  courseName: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
    textAlign: 'center',
  },
  courseProgress: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },

  // Member Avatar
  memberAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.successBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 30,
    fontFamily: 'Poppins-Bold',
    color: Colors.success,
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
    maxWidth: 400,
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
    fontSize: 20,
    fontFamily: 'Roboto',
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacings.md
  },
  memberModalRole: {
    fontSize: 14,
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
    paddingVertical: Spacings.sm,
    borderRadius: 8,
    gap: Spacings.xs,
  },
  promoteButton: {
    backgroundColor: Colors.blueBackground,
    borderWidth: 1,
    borderColor: Colors.blue,
  },
  promoteButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.blue,
  },
  removeButton: {
    backgroundColor: Colors.dangerBackground,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  removeButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: Colors.danger,
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
    paddingVertical: Spacings.md,
    borderRadius: 8,
    gap: Spacings.xs,
  },
  sendInviteButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
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
    maxWidth: 600,
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
    lineHeight: 20,
    marginLeft: Spacings.xs,
    flexWrap: 'wrap',
  },
  addPkgInfoBulletNumber: {
    width: 25,
    alignItems: 'flex-end'
  },
  addPkgInfoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.grayLight,
    padding: Spacings.md,
    borderRadius: 8,
    marginBottom: Spacings.md,
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
  },

  // Pre-reg
  addPreRegTitleWrapper: {
    flex: 1
  },
  addPreRegSubTitle: {
    fontSize: 14,
    color: Colors.success,
    fontFamily: 'Poppins-Medium',
    marginBottom: -2,
  },
  addPreRegTitle: {
    fontSize: 20,
    color: Colors.success,
    fontFamily: 'Poppins-Bold',
  },
});