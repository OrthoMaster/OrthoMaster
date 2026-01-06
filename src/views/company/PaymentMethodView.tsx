import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import { useQuery } from "@tanstack/react-query";
import { getProCartDetails, getPaymentMethods } from '../../services/v2/CartService';

import Stepper from './components/Stepper';

import Colors from '../../../constants/Colors';
import Spacings from '../../../constants/Spacings';

interface PaymentMethod {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  terms?: string[];
}

interface PaymentCardProps {
  method: PaymentMethod;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
}

const PaymentCard: React.FC<PaymentCardProps> = ({
  method,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onSelect(method.id)}
      style={[
        styles.paymentCard,
        isSelected && styles.paymentCardSelected
      ]}
    >
      {/* Icon and Title */}
      <View style={styles.paymentHeader}>
        <View style={[
          styles.paymentIconContainer,
          isSelected && styles.paymentIconContainerSelected
        ]}>
          {
            method.id == '0'
              ?
              <FontAwesome6
                name={'credit-card'}
                size={20}
                color={isSelected ? Colors.white : Colors.blue}
              />
              : (method.id == '1'
                ? <FontAwesome6
                  name={'file-signature'}
                  size={20}
                  color={isSelected ? Colors.white : Colors.blue}
                />
                : <FontAwesome6
                  name={'signature'}
                  size={20}
                  color={isSelected ? Colors.white : Colors.blue}
                />
              )
          }
        </View>

        <View style={styles.paymentInfo}>
          <Text style={[
            styles.paymentTitle,
            isSelected && styles.paymentTitleSelected
          ]}>
            {method.title}
          </Text>
          <Text style={[
            styles.paymentDescription,
            isSelected && styles.paymentDescriptionSelected
          ]}>
            {method.description}
          </Text>
        </View>

        {/* Selection Indicator */}
        <View style={styles.selectionIndicator}>
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          ) : (
            <MaterialCommunityIcons name="circle-outline" size={20} color={Colors.gray} />
          )}
        </View>
      </View>

      {/* Terms Section */}
      {method.terms && method.terms.length > 0 && (
        <View style={[styles.termsSection, { borderTopColor: isSelected ? Colors.success : Colors.line }]}>
          <TouchableOpacity
            style={styles.termsHeader}
            onPress={() => onToggleExpand(method.id)}
            activeOpacity={0.7}
          >
            <View style={styles.termsHeaderLeft}>
              <Ionicons name="information-circle-outline" size={16} color={isSelected ? Colors.success : Colors.gray} />
              <Text style={[styles.termsHeaderText, { color: isSelected ? Colors.success : Colors.gray }]}>
                Points importants :
              </Text>
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={isSelected ? Colors.success : Colors.gray}
            />
          </TouchableOpacity>

          {isExpanded && (
            <View style={styles.termsContent}>
              {method.terms.map((term, index) => (
                <View key={index} style={styles.termItem}>
                  <View style={[styles.termBullet, { backgroundColor: isSelected ? Colors.success : Colors.blue }]} />
                  <Text style={[styles.termText, { color: isSelected ? Colors.text : Colors.gray }]}>{term}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export const PaymentMethodView = ({ navigation, route }) => {
  // Hide bottom nav
  useEffect(() => {
    // Hide
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });

    // Re-Show when unmount
    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'flex' }
      });
    };
  }, [navigation]);

  // Load current member list
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => getPaymentMethods(),
    retry: 1,
    retryDelay: 1000,
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  // Default open expend
  const [expandedMethods, setExpandedMethods] = useState<string[]>(
    paymentMethods.filter(m => m.terms && m.terms.length > 0).map(m => m.id)
  );

  // Update payment methods when data is fetched
  useEffect(() => {
    setPaymentMethods(() => [...data || []]);
    setExpandedMethods(paymentMethods.filter(m => m.terms && m.terms.length > 0).map(m => m.id));
  }, [data]);



  const handleSelectMethod = (id: string) => {
    setSelectedMethod(id);
  };

  const handleToggleExpand = (id: string) => {
    setExpandedMethods(prev => {
      if (prev.includes(id)) {
        return prev.filter(methodId => methodId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleContinue = async () => {
    if (selectedMethod == null) return;

    const cartData = await getProCartDetails(selectedMethod);

    // TODO: Check cartData

    // Navigate to next screen
    navigation.navigate('attach-member-view', {
      members: cartData.members,
      paymentMethod: paymentMethods.find(m => m.id === selectedMethod)
    });
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
            <Text style={styles.headerTitle}>Méthode de paiement</Text>
            <Text style={styles.headerSubtitle}>
              Choisissez votre mode de financement
            </Text>
          </View>
        </View>
      </View>
              {/* Stepper */}
        <Stepper currentStep={0} />

      {/* Payment Methods List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            colors={[Colors.blue]}
            tintColor={Colors.blue}
          />
        }
      >
        {paymentMethods.map((method) => (
          <PaymentCard
            key={method.id}
            method={method}
            isSelected={selectedMethod === method.id}
            isExpanded={expandedMethods.includes(method.id)}
            onSelect={handleSelectMethod}
            onToggleExpand={handleToggleExpand}
          />
        ))}

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.continueContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedMethod && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedMethod}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedMethod && styles.continueButtonTextDisabled
          ]}>
            Continuer
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={!selectedMethod ? Colors.gray : Colors.white}
          />
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
  scrollContent: {
    padding: Spacings.lg,
  },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacings.lg,
    paddingBottom: Spacings.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.sm,
    flex: 1,
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
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: Colors.subtext,
    marginTop: -4,
  },

  // Payment Card
  paymentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacings.md,
    marginBottom: Spacings.md,
    borderWidth: 2,
    borderColor: Colors.line,
    elevation: 1,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  paymentCardSelected: {
    borderColor: Colors.success,
    backgroundColor: Colors.successBackground,
    elevation: 3,
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.blueBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacings.md,
  },
  paymentIconContainerSelected: {
    backgroundColor: Colors.success,
  },
  paymentInfo: {
    flex: 1,
    marginRight: Spacings.sm,
  },
  paymentTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
  },
  paymentTitleSelected: {
    color: Colors.success,
  },
  paymentDescription: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  paymentDescriptionSelected: {
    color: Colors.text,
  },
  selectionIndicator: {
    marginLeft: Spacings.xs,
  },

  // Terms Section
  termsSection: {
    marginTop: Spacings.md,
    paddingTop: Spacings.md,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  termsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  termsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacings.xs,
  },
  termsHeaderText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: Colors.gray,
  },
  termsContent: {
    marginTop: Spacings.sm,
    paddingLeft: Spacings.xs,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacings.xs,
  },
  termBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.blue,
    marginTop: 6,
    marginRight: Spacings.sm,
  },
  termText: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    lineHeight: 16,
  },

  // Continue Button
  continueContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacings.lg,
    paddingBottom: Spacings.xxl,
  },
  continueButton: {
    backgroundColor: Colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacings.sm,
    paddingVertical: Spacings.md,
    borderRadius: 24,
    elevation: 3,
    shadowColor: Colors.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.grayLight,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Colors.white,
  },
  continueButtonTextDisabled: {
    color: Colors.gray,
  },
});