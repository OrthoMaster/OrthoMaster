import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native-paper';

import Stepper from './components/Stepper';

import { BouncingDots } from '../../component/LoadingDots';
import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

import { syncMembers } from '../../services/v2/CartService';

interface Member {
  id: string;
  name: string;
  first_name: string;
  email: string;
  organization: {
    name: string
  };
  missing_fields_message: string;
}

interface MemberCardProps {
  member: Member;
  isSelected: boolean;
  onToggle: (id: string) => void;
  isDisabled: boolean;
  disabled?: boolean
}

const MemberCard: React.FC<MemberCardProps> = ({ member, isSelected, onToggle, isDisabled, disabled }) => {
  return (
    <TouchableOpacity
      activeOpacity={isDisabled ? 1 : 0.7}
      onPress={() => !isDisabled && onToggle(member.id)}
      style={[
        styles.memberCard,
        isSelected && styles.memberCardSelected,
        isDisabled && styles.memberCardDisabled
      ]}
      disabled={disabled}
    >
      {/* Avatar Placeholder */}
      <View style={[
        styles.avatarPlaceholder,
        isSelected && styles.avatarPlaceholderSelected,
        isDisabled && styles.avatarPlaceholderDisabled
      ]}>
        <Text style={[
          styles.avatarText,
          isSelected && styles.avatarTextSelected,
          isDisabled && styles.avatarTextDisabled
        ]}>
          {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </Text>
      </View>

      {/* Member Info */}
      <View style={styles.memberInfo}>
        <Text
          numberOfLines={1}
          ellipsizeMode='tail'
          style={[
            styles.memberName,
            isSelected && styles.memberNameSelected,
            isDisabled && styles.memberNameDisabled
          ]}>
          {member.name + ' ' + member.first_name}
        </Text>
        <Text style={[
          styles.memberEmail,
          isSelected && styles.memberEmailSelected,
          isDisabled && styles.memberEmailDisabled
        ]} numberOfLines={1}>
          {member.email}
        </Text>
        {member.organization &&
          <View style={[
            styles.roleBadge,
            isSelected && styles.roleBadgeSelected,
            isDisabled && styles.roleBadgeDisabled
          ]}>
            <Text style={[
              styles.roleText,
              isSelected && styles.roleTextSelected,
              isDisabled && styles.roleTextDisabled
            ]}>
              {member.organization?.name}
            </Text>
          </View>
        }
        {member.missing_fields_message &&
          <Text style={styles.memberMissingText}>{member.missing_fields_message}</Text>
        }
      </View>

      {/* Selection Indicator */}
      <View style={styles.selectionIndicator}>
        {isDisabled ? (
          <Ionicons name="warning" size={20} color={Colors.warning} />
        ) : isSelected ? (
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
        ) : (
          <MaterialCommunityIcons name="circle-outline" size={20} color={Colors.gray} />
        )}
      </View>
    </TouchableOpacity>
  );
};

export const AttachMemberView = ({ navigation, route }) => {
  const { memberIds, members, paymentMethod } = route.params;

  const [selectedMembers, setSelectedMembers] = useState<string[]>(memberIds || []);
  const [synchronizing, setSynchronizing] = useState(false);

  const handleToggleMember = (id: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(id)) {
        return prev.filter(memberId => memberId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    // Only select members without missing fields
    const selectableMembers = members.filter(m => !m.missing_fields_message);

    if (selectedMembers.length === selectableMembers.length) {
      // Deselect all
      setSelectedMembers([]);
    } else {
      // Select all selectable members
      setSelectedMembers(selectableMembers.map(m => m.id));
    }
  };

  const handleContinueChosePackage = async () => {
    if (selectedMembers.length === 0) return;

    setSynchronizing(true);
    const result = await syncMembers(selectedMembers);
    if (result) {
      setSynchronizing(false);

      navigation.navigate('select-package-view', { paymentMethod });
    } else {
      Alert.alert('Erreur', "Le processus d'assinger les membres a échoué, veuillez réessayer.");
      setSynchronizing(false);
    }
  };

  const selectableMembers = members.filter(m => !m.missing_fields_message);
  const allSelected = selectableMembers.length > 0 && selectedMembers.length === selectableMembers.length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sélectionez les bénéficiaires</Text>

        </View>
        <TouchableOpacity onPress={() => { navigation.popToTop() }}>
          <Ionicons name="close" size={26} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {members.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={80} color={Colors.gray} />
          <Text style={styles.emptyTitle}>Aucun membre</Text>
          <Text style={styles.emptySubtitle}>
            Ajoutez des membres à votre équipe pour leur assigner des formations
          </Text>
        </View>
      ) : (
        <>
          {/* Stepper */}
          <Stepper currentStep={1} />

          {/* Select All Button */}
          <View style={styles.selectAllContainer}>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={handleSelectAll}
              disabled={synchronizing}
            >
              <Ionicons
                name={allSelected ? "checkbox" : "square-outline"}
                size={24}
                color={allSelected ? Colors.success : Colors.gray}
              />
              <Text style={[
                styles.selectAllText,
                allSelected && styles.selectAllTextActive
              ]}>
                {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
              </Text>
            </TouchableOpacity>

            {selectedMembers.length > 0 && (
              <View style={styles.selectedCountBadge}>
                <Text style={styles.selectedCountText}>
                  {selectedMembers.length} sélectionné{selectedMembers.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Members List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isSelected={selectedMembers.includes(member.id)}
                onToggle={handleToggleMember}
                isDisabled={!!member.missing_fields_message}
                disabled={synchronizing}
              />
            ))}

            {/* Spacer for bottom button */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Review Button */}
          <View style={styles.reviewContainer}>
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewLabel}>Membres sélectionnés</Text>
              <Text style={styles.reviewCount}>
                {selectedMembers.length} / {selectableMembers.length}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.reviewButton,
                selectedMembers.length === 0 && styles.reviewButtonDisabled,
                synchronizing && styles.reviewButtonDisabled
              ]}
              onPress={handleContinueChosePackage}
              disabled={selectedMembers.length === 0 || synchronizing}
            >
              <Text style={[
                styles.reviewButtonText,
                selectedMembers.length === 0 && styles.reviewButtonTextDisabled,
                synchronizing && styles.reviewButtonTextDisabled
              ]}>
                Confirmer
              </Text>
              {synchronizing
                ? <ActivityIndicator size={20} animating={true} color={Colors.gray} />
                : <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={selectedMembers.length === 0 ? Colors.gray : Colors.white}
                />
              }
            </TouchableOpacity>
          </View>
        </>
      )}
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
    backgroundColor: Colors.grayLight,
  },
  scrollContent: {
    padding: Spacings.lg,
    paddingTop: Spacings.md,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.sm,
    paddingBottom: Spacings.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 4,
    paddingRight: Spacings.md
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },

  // Select All Section
  selectAllContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  selectAllText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
  },
  selectAllTextActive: {
    color: Colors.success,
  },
  selectedCountBadge: {
    backgroundColor: Colors.successBackground,
    paddingHorizontal: Spacings.md,
    paddingVertical: Spacings.xxs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.success
  },
  selectedCountText: {
    fontSize: 9,
    fontFamily: 'Poppins-Medium',
    color: Colors.success,
  },

  // Member Card
  memberCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacings.md,
    marginBottom: Spacings.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.line,
    elevation: 1,
    shadowColor: Colors.gray,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  memberCardSelected: {
    borderColor: Colors.success,
    backgroundColor: Colors.successBackground,
    elevation: 3,
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  memberCardDisabled: {
    backgroundColor: Colors.grayLight,
    borderColor: Colors.line,
    opacity: 0.95,
    elevation: 0,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacings.md,
  },
  avatarPlaceholderSelected: {
    backgroundColor: Colors.success,
  },
  avatarPlaceholderDisabled: {
    backgroundColor: Colors.gray,
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
  avatarTextSelected: {
    color: Colors.white,
  },
  avatarTextDisabled: {
    color: Colors.white,
    opacity: 0.7,
  },
  memberInfo: {
    flex: 1,
    marginRight: Spacings.sm,
  },
  memberName: {
    fontSize: 14,
    fontFamily: 'Roboto',
    color: Colors.text,
  },
  memberNameSelected: {
    color: Colors.success,
  },
  memberNameDisabled: {
    color: Colors.gray,
  },
  memberEmail: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginBottom: Spacings.xxs,
  },
  memberEmailSelected: {
    color: Colors.text,
  },
  memberEmailDisabled: {
    color: Colors.gray,
    opacity: 0.7,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.grayLight,
    paddingHorizontal: Spacings.sm,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: Spacings.xxs,
  },
  roleBadgeSelected: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  roleBadgeDisabled: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray,
    opacity: 0.5,
  },
  roleText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
  },
  roleTextSelected: {
    color: Colors.success,
  },
  roleTextDisabled: {
    color: Colors.gray,
    opacity: 0.7,
  },
  selectionIndicator: {
    marginLeft: Spacings.xs,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacings.xl,
    backgroundColor: Colors.grayLight,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginTop: Spacings.lg,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: Spacings.xs,
    textAlign: 'center',
  },

  // Review Button (Similar to Checkout)
  reviewContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: Spacings.lg,
    paddingTop: Spacings.md,
    paddingBottom: Spacings.xxxl,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  reviewCount: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
  },
  reviewButton: {
    backgroundColor: Colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
    paddingVertical: Spacings.xs,
    paddingHorizontal: Spacings.md,
    borderRadius: 24,
    elevation: 3,
    shadowColor: Colors.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  reviewButtonDisabled: {
    backgroundColor: Colors.grayLight,
    elevation: 0,
  },
  reviewButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  reviewButtonTextDisabled: {
    color: Colors.gray,
  },

  memberMissingText: {
    fontSize: 7,
    fontFamily: 'Poppins-Light',
    color: Colors.danger,
  },
});