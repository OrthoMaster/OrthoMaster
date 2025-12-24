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
  Modal
} from 'react-native';
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
  let colorProcess = Colors.primary;
  let colorProcessBackground = '#E5E5EA';

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
            <Text style={styles.memberOrganization}>{item.organization?.name}</Text>
          </View>
        }
        {item.missing_fields_message &&
          <Text style={styles.memberMissingText}>{item.missing_fields_message}</Text>
        }
      </View>
      {item.progress &&
        <View style={styles.progressContainer}>
          <View style={styles.progressCircle}>
            <View
              style={[
                styles.progressRing,
                {
                  borderColor: item.progress >= 100 ? colorProcess : colorProcessBackground,
                  borderTopColor: colorProcess,
                  borderRightColor: item.progress >= 50 ? colorProcess : colorProcessBackground,
                  borderBottomColor: item.progress >= 75 ? colorProcess : colorProcessBackground,
                  borderLeftColor: item.progress >= 25 ? colorProcess : colorProcessBackground,
                }
              ]}
            />
            <Text style={styles.progressText}>{item.progress}%</Text>
          </View>
        </View>
      }
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

      <ScrollView style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={reload}
            colors={[Colors.blue]}
            tintColor={Colors.blue}
          />
        }>
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

            {/* Mamber Section */}
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
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabPrimary}
          onPress={() => setShowAddMemberModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-sharp" size={26} color={Colors.white} />
        </TouchableOpacity>
      </View>

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
              <Ionicons name="person-circle" size={40} color={Colors.gray} />
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
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
    padding: 24,
    marginBottom: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.sm,
    borderRadius: 8,
    marginBottom: Spacings.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gray,
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
    paddingHorizontal: Spacings.xxs,
  },
  memberMissingText: {
    fontSize: 7,
    fontFamily: 'Poppins-Light',
    color: Colors.danger,
  },
  progressContainer: {
    marginLeft: 12,
  },
  progressCircle: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    transform: [{ rotate: '-45deg' }],
  },
  progressText: {
    fontSize: 7,
    fontFamily: 'Poppins-Light',
    color: Colors.gray,
  },

  // Member Modal Styles
  memberModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    elevation: 8,
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