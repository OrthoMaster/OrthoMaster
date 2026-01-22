import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import Colors from "../../../../../constants/Colors";
import Spacings from "../../../../../constants/Spacings";

export const ReferencesFactory = ({ config }) => {
  const [isTriggered, setIsTriggered] = useState(true)

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.header}
        onPress={() => setIsTriggered(!isTriggered)}
      >
        <Text style={styles.title}>Nos références</Text>
        <Ionicons name={isTriggered ? "chevron-down" : "chevron-forward"} size={20} color={Colors.text}/>
      </Pressable>
      {isTriggered ?
        <View style={styles.refBox}>
          <Text style={styles.refTxt}>{config.value}</Text>
        </View>
        : null
      }
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.grayLight,
    alignItems: 'center',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacings.md,
    paddingHorizontal: Spacings.md,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  buttonArrow: {},
  refBox: {
    marginBottom: Spacings.md,
    paddingHorizontal: Spacings.md,
  },
  refTxt: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Roboto'
  }
})