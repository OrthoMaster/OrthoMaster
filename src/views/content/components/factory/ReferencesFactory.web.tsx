import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import Colors from "../../../../../constants/Colors";
import Spacings from "../../../../../constants/Spacings";

export const ReferencesFactory = ({ config }) => {
  const [isTriggered, setIsTriggered] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsTriggered(!isTriggered)}
        activeOpacity={0.7}
      >
        <Text style={styles.title}>Nos références</Text>
        <Ionicons 
          name={isTriggered ? "chevron-down" : "chevron-forward"} 
          size={20} 
          color={Colors.text}
        />
      </TouchableOpacity>
      
      {isTriggered && (
        <View style={styles.refBox}>
          <Text style={styles.refTxt}>{config.value}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.grayLight,
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.md,
    cursor: 'pointer',
    width: '100%',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.6
  },
  refBox: {
    marginBottom: Spacings.md,
    paddingHorizontal: Spacings.md,
    width: '100%',
  },
  refTxt: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Roboto',
    textAlign: "justify"
  }
});