import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

interface StepperProps {
  currentStep: number;
}

const steps = ['1. Financement', '2. Membres', '3. Formations', '4. Complété'];

const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  return (
    <View style={styles.stepperContainer}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepWrapper}>
          <View style={[
            styles.stepBox,
            index <= currentStep && styles.stepBoxActive
          ]}>
            <Text style={[
              styles.stepLabel,
              index <= currentStep && styles.stepLabelActive
            ]}>
              {step}
            </Text>
          </View>
          {index < steps.length - 1 && (
            <View style={[
              styles.arrow,
              index <= currentStep && styles.arrowActive
            ]} />
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepBox: {
    backgroundColor: Colors.gray,
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.md,
    height: 60,
    flex: 1,
  },
  stepBoxActive: {
    backgroundColor: Colors.blue,
  },
  stepLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: Colors.white,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.white,
    fontFamily: 'Poppins-Medium',
  },
  arrow: {
    width: 0,
    height: 0,
    borderTopWidth: 30,
    borderBottomWidth: 30,
    borderLeftWidth: 12,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: Colors.gray,
  },
  arrowActive: {
    borderLeftColor: Colors.blue,
  },
});

export default Stepper;