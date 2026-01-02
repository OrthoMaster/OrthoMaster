import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Svg, Circle } from 'react-native-svg';
import { TextInput } from 'react-native-paper';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';
import { Styles } from '../../../constants/Styles';

import { useQuery } from "@tanstack/react-query";
import { getCompany } from "../../services/v2/CompanyService";
import { BouncingDots } from '../../component/LoadingDots';

import { updateManager, removeMember, inviteMember } from '../../services/v2/CompanyService';

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
  // Tab State
  const [activeTab, setActiveTab] = useState<'membres' | 'formations'>('membres');

  // Calculate dynamic circle width
  const screenWidth = Dimensions.get('window').width;
  const containerPadding = Spacings.lg * 2;
  const numberOfCircles = 6;
  const gapWidth = Spacings.sm * (numberOfCircles - 1);
  const circleWidth = (screenWidth - containerPadding - gapWidth) / numberOfCircles;
  const circleSize = circleWidth - 10; // Reduce slightly for padding

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['company'],
    queryFn: () => getCompany(),
    retry: 1,
    retryDelay: 1000,
  });

  // Demo courses data
  const demoCoursesData = [
    { id: 1, name: 'Formation 1' },
    { id: 2, name: 'Formation 2' },
    { id: 3, name: 'Formation 3' },
    { id: 4, name: 'Formation 4' },
    { id: 5, name: 'Formation 5' },
    { id: 6, name: 'Formation 6' },
    { id: 7, name: 'Formation 7' },
    { id: 8, name: 'Formation 8' },
    { id: 9, name: 'Formation 9' },
    { id: 10, name: 'Formation 10' },
    { id: 11, name: 'Formation 11' },
    { id: 12, name: 'Formation 12' },
  ];

  // Expanded members state
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());

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
        Alert.alert('Succès', result.message);
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

  // User trainings - STA
  // Render course circle
  const renderCourseCircle = (course) => {
    const progress = course.pivot?.progress || 0;
    const strokeWidth = 2.5;
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
            backgroundColor: course.training?.background_color || Colors.blueBackground,
          }]}>
            <Text style={styles.courseIcon}>📚</Text>
          </View>

          {/* Progress border using SVG */}
          <Svg
            width={circleSize}
            height={circleSize}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            {/* Background circle (gray/light border) */}
            <Circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              stroke={course.training?.background_color || Colors.blueBackground}
              strokeWidth={strokeWidth}
              fill="none"
            />

            {/* Progress circle */}
            <Circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              stroke={course.training?.color || Colors.blue}
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

        <Text style={styles.courseName} numberOfLines={1} ellipsizeMode='tail'>
          {course.name}
        </Text>
        <Text style={[styles.courseProgress, { color: course.training?.color || Colors.blue }]}>
          {progress}%
        </Text>
      </View>
    );
  };

  // Render member formation item
  const renderMemberFormationItem = (member) => {
    const isExpanded = expandedMembers.has(member.id);

    const sliceNumber = member.packages.length <= 6 ? 6 : 5
    const displayCourses = isExpanded ? member.packages : member.packages.slice(0, sliceNumber);
    const remainingCount = member.packages.length - sliceNumber;

    const toggleExpand = () => {
      const newExpanded = new Set(expandedMembers);
      if (isExpanded) {
        newExpanded.delete(member.id);
      } else {
        newExpanded.add(member.id);
      }
      setExpandedMembers(newExpanded);
    };

    return (
      <View key={member.id} style={styles.formationMemberCard}>
        <View style={styles.formationMemberHeader}>
          <View style={styles.formationMemberInfo}>
            <Text style={styles.formationMemberName}>
              {member.name + ' ' + member.first_name}
            </Text>
            <Text style={styles.formationMemberEmail}>{member.email}</Text>
          </View>
          {member.packages.length > sliceNumber && (
            <TouchableOpacity onPress={toggleExpand} activeOpacity={0.7}>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={Colors.blue}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.coursesContainer}>
          {member.packages.length == 0 && (
            <View style={styles.coursesGrid}>
              <Text style={styles.coursesEmptyText}>Aucune formation pour le moment</Text>
            </View>
          )}

          <View style={styles.coursesGrid}>
            {displayCourses.map(course => renderCourseCircle(course))}
            {!isExpanded && remainingCount > 0 && (
              <TouchableOpacity
                key="more"
                style={[styles.courseItem, { width: circleWidth }]}
                onPress={toggleExpand}
                activeOpacity={0.7}
              >
                <View style={[styles.courseCircle, styles.moreCircle, { width: circleSize, height: circleSize, borderRadius: circleSize / 2 }]}>
                  <Text style={styles.moreText}>+{remainingCount}</Text>
                </View>
                <Text style={styles.textViewMore}>Voir plus</Text>
              </TouchableOpacity>
            )}
          </View>
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
            <View style={styles.companyIconWrapper}>
              <Ionicons name={'medical-sharp'} size={30} color={Colors.blue} />
            </View>
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

  // User trainings - END

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.blue} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Équipe</Text>
        <View style={styles.headerActions}>
          {/* Share button */}
          {/* <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => {}}
          >
            <Ionicons name="share-social-outline" size={20} color={Colors.white} />
          </TouchableOpacity> */}
        </View>
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
      </ScrollView>

      {/* Floating Action Buttons - Only show on Membres tab */}
      {activeTab === 'membres' && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fabPrimary}
            onPress={() => setShowAddMemberModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-sharp" size={26} color={Colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Action Buttons - Only show on Membres tab */}
      {activeTab === 'formations' && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fabSecondary}
            onPress={() => navigation.navigate('payment-method')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name={'book-open-page-variant-outline'} size={18} color={Colors.white} />
            <Text style={styles.fabSecondaryText}>Ajouter formations</Text>
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
              <Ionicons name="person-add" size={32} color={Colors.blue} />
              <Text style={styles.addMemberTitle}>Inviter un membre</Text>
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.blue,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.grayLight
  },
  header: {
    backgroundColor: Colors.blue,
    paddingHorizontal: Spacings.lg,
    paddingBottom: Spacings.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
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
    backgroundColor: Colors.blue,
    paddingHorizontal: Spacings.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacings.sm,
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.grayLight,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  activeTabText: {
    fontFamily: 'Poppins-Bold',
    color: Colors.blue,
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
    borderColor: Colors.blue
  },
  companyIconWrapper: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyMetadata: {
    paddingRight: Spacings.md
  },
  companyType: {
    fontSize: 10,
    marginBottom: -3,
    paddingLeft: 1,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
  },
  companyName: {
    fontSize: 17,
    fontFamily: 'Poppins-Medium',
    color: Colors.blue,
  },
  companyData: {
    fontSize: 10,
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
    fontSize: 10,
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
    fontSize: 7,
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
    gap: Spacings.sm,
  },
  fabPrimary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    paddingHorizontal: Spacings.md,
    borderRadius: 16,
    backgroundColor: Colors.blue,
    opacity: 0.8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabSecondaryText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
    marginLeft: Spacings.xxs
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
    fontSize: 14,
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
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: '400',
    color: Colors.text,
    marginBottom: -2,
  },
  formationMemberEmail: {
    fontSize: 9,
    fontFamily: 'Poppins-Light',
    color: Colors.gray,
  },
  coursesContainer: {
    flexDirection: 'row',
  },
  coursesEmptyText: {
    fontSize: 8,
    fontFamily: 'Poppins-Light',
    color: Colors.subtext,
    textAlign: 'center',
    marginTop: -8,
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
    backgroundColor: Colors.blueBackground,
    borderWidth: 1,
    borderColor: Colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacings.xxs,
  },
  moreCircle: {
    backgroundColor: Colors.grayLight,
  },
  moreText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.blue,
  },
  textViewMore: {
    fontSize: 8,
    fontFamily: 'Roboto',
    color: Colors.blue,
  },

  courseIcon: {
    fontSize: 14,
  },
  courseName: {
    fontSize: 8,
    fontFamily: 'Poppins-Light',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: -2
  },
  courseProgress: {
    fontSize: 9,
    fontFamily: 'Poppins-Medium',
    color: Colors.subtext,
    textAlign: 'center',
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
});