import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

interface StepperProps {
  currentStep: number;
}

const steps = ['Paiement', 'Membres', 'Formations', 'Complété'];

const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  return (
    <View style={styles.stepperContainer}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <View style={styles.stepWrapper}>
            <View style={[
              styles.stepCircle,
              index <= currentStep && styles.stepCircleActive,
              index < currentStep && styles.stepCircleCompleted
            ]}>
              {index < currentStep ? (
                <Ionicons name="checkmark" size={12} color={Colors.white} />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  index <= currentStep && styles.stepNumberActive
                ]}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              index <= currentStep && styles.stepLabelActive
            ]}>
              {step}
            </Text>
          </View>
          {index < steps.length - 1 && (
            <View style={[
              styles.stepLine,
              index < currentStep && styles.stepLineActive
            ]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacings.md,
  },
  stepWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.gray,
  },
  stepCircleActive: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  stepCircleCompleted: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  stepNumber: {
    fontSize: 8,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
  },
  stepNumberActive: {
    fontSize: 9,
    fontFamily: 'Poppins-Bold',
    color: Colors.white,
  },
  stepLabel: {
    fontSize: 8,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray,
    marginTop: Spacings.xxs,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.blue,
    fontFamily: 'Poppins-Medium',
  },
  stepLine: {
    height: 1,
    backgroundColor: Colors.gray,
    flex: 0.5,
    marginHorizontal: -8,
    marginTop: -14,
  },
  stepLineActive: {
    backgroundColor: Colors.blue,
  },
});

export default Stepper;