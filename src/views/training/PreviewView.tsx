import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

interface Course {
  id: string;
  title: string;
  image: string;
  modules: number;
  lessons: number;
  duration: number;
  originalPrice?: number;
  instructor?: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface PreviewViewProps {
  navigation: any;
  route: any;
}

const CourseItem = ({ course }: { course: Course }) => {
  const hasDiscount = course.originalPrice && course.originalPrice > course.price;

  return (
    <View style={styles.courseItem}>
      <Image
        source={{ uri: course.image }}
        style={styles.courseImage}
      />
      <View style={styles.courseItemInfo}>
        <Text style={styles.courseItemTitle} numberOfLines={2}>
          {course.title}
        </Text>
        <View style={styles.courseItemMeta}>
          <Ionicons name="book-outline" size={12} color={Colors.gray} />
          <Text style={styles.courseItemMetaText}>
            {course.modules} modules • {course.lessons} lessons
          </Text>
        </View>
      </View>
      <View style={styles.courseItemPrice}>
        <Text style={styles.priceText}>{course.duration.toFixed(2)} h</Text>
        {hasDiscount && (
          <Text style={styles.originalPriceText}>
            {course.originalPrice?.toFixed(2)} €
          </Text>
        )}
      </View>
    </View>
  );
};

const MemberItem = ({ member }: { member: Member }) => {
  return (
    <View style={styles.memberItem}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>
          {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </Text>
      </View>
      <View style={styles.memberItemInfo}>
        <Text style={styles.memberItemName}>{member.name}</Text>
        <Text style={styles.memberItemEmail} numberOfLines={1}>
          {member.email}
        </Text>
      </View>
      <View style={styles.memberRoleBadge}>
        <Text style={styles.memberRoleText}>{member.role}</Text>
      </View>
    </View>
  );
};

// Mock data for demo
const DEMO_COURSES: Course[] = [
  {
    id: '1',
    title: 'Graffiti Mastery',
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80',
    modules: 3,
    lessons: 24,
    duration: 2,
    originalPrice: 79.99,
    instructor: 'Jean'
  },
  {
    id: '2',
    title: 'Base de l\'orthopédie',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    modules: 5,
    lessons: 32,
    duration: 4,
    originalPrice: 129.99,
    instructor: 'Dr. Marie Martin'
  },
  {
    id: '3',
    title: 'Bases biomécaniques',
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80',
    modules: 4,
    lessons: 28,
    duration: 10,
    instructor: 'Prof. Pierre Leroy'
  }
];

const DEMO_MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    role: 'OPCO-EP'
  },
  {
    id: '2',
    name: 'Marie Martin',
    email: 'marie.martin@example.com',
    role: 'OPCO-EP'
  },
  {
    id: '3',
    name: 'Pierre Leroy',
    email: 'pierre.leroy@example.com',
    role: 'OPCO-EP'
  },
  {
    id: '4',
    name: 'Sophie Bernard',
    email: 'sophie.bernard@example.com',
    role: 'OPCO-EP'
  },
  {
    id: '5',
    name: 'Luc Petit',
    email: 'luc.petit@example.com',
    role: 'OPCO-EP'
  }
];


export const PreviewView: React.FC<PreviewViewProps> = ({ navigation, route }) => {
  const { cartItems = DEMO_COURSES, selectedMembers = DEMO_MEMBERS } = route.params || {};

  // Calculate totals
  const totalDuration = cartItems.reduce((sum: number, item: Course) => sum + item.duration, 0);
  const totalSavings = 0;
  const pricePerMember = selectedMembers.length > 0 ? totalDuration * 4 : 0;
  

  const totalPrice = pricePerMember * selectedMembers.length;
  const finalTotal = totalPrice;

  const handleConfirmPayment = () => {
    Alert.alert(
      'Confirmer le paiement',
      `Vous allez payer ${finalTotal.toFixed(2)} € pour ${cartItems.length} formation${cartItems.length > 1 ? 's' : ''} assignée${cartItems.length > 1 ? 's' : ''} à ${selectedMembers.length} membre${selectedMembers.length > 1 ? 's' : ''}.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            // TODO: Process payment
            navigation.navigate('contract-view');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
          <View>
            <Text style={styles.headerTitle}>Résumé de la commande</Text>
            <Text style={styles.headerSubtitle}>Vérifiez avant de payer</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Courses Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="book" size={20} color={Colors.blue} />
              <Text style={styles.sectionTitle}>
                Formations sélectionnées ({cartItems.length})
              </Text>
            </View>
            <View style={styles.sectionContent}>
              {cartItems.map((course: Course) => (
                <CourseItem key={course.id} course={course} />
              ))}
            </View>
          </View>

          {/* Members Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={20} color={Colors.success} />
              <Text style={styles.sectionTitle}>
                Membres assignés ({selectedMembers.length})
              </Text>
            </View>
            <View style={styles.sectionContent}>
              {selectedMembers.map((member: Member) => (
                <MemberItem key={member.id} member={member} />
              ))}
            </View>
          </View>

          {/* Price Summary Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="grid" size={20} color={Colors.warning} />
              <Text style={styles.sectionTitle}>Détails de la commande</Text>
            </View>
            <View style={styles.priceSummaryContent}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Total duration:</Text>
                <Text style={styles.priceValue}>{totalDuration.toFixed(2)} h</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Prix par heur:</Text>
                <Text style={styles.priceValue}>4.00 €</Text>
              </View>

              {totalSavings > 0 && (
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, styles.savingsLabel]}>
                    Réductions:
                  </Text>
                  <Text style={[styles.priceValue, styles.savingsValue]}>
                    -{totalSavings.toFixed(2)} €
                  </Text>
                </View>
              )}

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Nombre de membres:</Text>
                <Text style={styles.priceValue}>× {selectedMembers.length}</Text>
              </View>

              {selectedMembers.length > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Prix par membre:</Text>
                  <Text style={styles.priceValue}>{pricePerMember.toFixed(2)} €</Text>
                </View>
              )}

              <View style={styles.dividerLine} />

              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total à payer:</Text>
                <Text style={styles.totalValue}>{finalTotal.toFixed(2)} €</Text>
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.blue} />
                <Text style={styles.infoText}>
                  Les formations seront immédiatement disponibles pour tous les membres sélectionnés après le paiement.
                </Text>
              </View>
            </View>
          </View>

          {/* Spacer for bottom button */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Confirm Payment Button */}
      <View style={styles.confirmContainer}>
        <View style={styles.confirmInfo}>
          <Text style={styles.confirmLabel}>Total</Text>
          <Text style={styles.confirmAmount}>{finalTotal.toFixed(2)} €</Text>
          <Text style={styles.confirmDetails}>
            {cartItems.length} cours • {selectedMembers.length} membre{selectedMembers.length > 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmPayment}
        >
          <FontAwesome6 name="signature" size={20} color={Colors.white} />
          <Text style={styles.confirmButtonText}>Confirmer et Signer</Text>
        </TouchableOpacity>
      </View>
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
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingBottom: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: -4,
  },
  content: {
    padding: Spacings.lg,
  },

  // Section
  section: {
    marginBottom: Spacings.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    marginBottom: Spacings.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  sectionContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Course Item
  courseItem: {
    flexDirection: 'row',
    padding: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  courseImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.grayLight,
    marginRight: Spacings.sm,
  },
  courseItemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  courseItemTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginBottom: 2,
  },
  courseItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseItemMetaText: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.gray,
    marginHorizontal: 2,
  },
  courseItemPrice: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: Spacings.sm,
  },
  priceText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: Colors.blue,
  },
  originalPriceText: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    textDecorationLine: 'line-through',
  },

  // Member Item
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacings.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacings.sm,
  },
  memberAvatarText: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
  memberItemInfo: {
    flex: 1,
  },
  memberItemName: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  memberItemEmail: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  memberRoleBadge: {
    backgroundColor: Colors.successBackground,
    paddingHorizontal: Spacings.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  memberRoleText: {
    fontSize: 9,
    fontFamily: 'Poppins-Medium',
    color: Colors.success,
  },

  // Price Summary
  priceSummaryContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacings.lg,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacings.sm,
  },
  priceLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  priceValue: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  savingsLabel: {
    color: Colors.success,
  },
  savingsValue: {
    color: Colors.success,
    fontFamily: 'Poppins-Bold',
  },
  dividerLine: {
    height: 1,
    backgroundColor: Colors.line,
    marginVertical: Spacings.md,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: Colors.blue,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.blue || '#E3F2FD',
    padding: Spacings.md,
    borderRadius: 8,
    marginTop: Spacings.md,
    gap: Spacings.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.white,
    lineHeight: 16,
  },

  // Confirm Button
  confirmContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingVertical: Spacings.md,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  confirmInfo: {
    marginBottom: Spacings.sm,
  },
  confirmLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  confirmAmount: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
  },
  confirmDetails: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: -2,
  },
  confirmButton: {
    backgroundColor: Colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.sm,
    paddingVertical: Spacings.md,
    borderRadius: 24,
    elevation: 4,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  confirmButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
});