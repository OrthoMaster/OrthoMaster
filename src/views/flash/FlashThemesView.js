import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Image,
  Platform
} from 'react-native';

import { FlashCategoriesView } from './FlashCategoriesView';
import { QaLayout } from '../home/QaLayout';

const FlashButton = ({ label, onPress, buttonColor, flashImg, active }) => {

  return (<View style={styles.buttonContainer}>
    <TouchableOpacity style={[styles.button, {
      opacity: active ? 1 : 0.5
    }]}
      onPress={onPress}>
      <Image
        source={flashImg}
        style={{
          width: 85, height: 85,
          resizeMode: 'contain',
          marginBottom: 10,
        }}
      />

      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  </View>
  )
}

export const FlashThemesView = ({ navigation, route }) => {

  const [themeSelected, setThemeSelected] = useState(null)
  const [qaSelected, setQaSelected] = useState(false)

  return (
    <SafeAreaView style={[styles.container, styles.AndroidSafeArea]}>

      <View style={styles.rowContainer}>
        <FlashButton
          label={'Mon Patient'}
          onPress={() => {
            setThemeSelected({
              type: "flash",
              theme_id: 5,
              color: '#FBAF31',
              textColor: "#000"
            })
            setQaSelected(false)
          }}
          active={themeSelected?.theme_id === 5}
          flashImg={require("../../../assets/flash/Mon-patient.png")}
        />
        <FlashButton
          label={'Médias'}
          onPress={() => {
            setThemeSelected({
              type: "flash",
              theme_id: 6,
              color: "#1B70C0",
              textColor: "#fff"
            })
            setQaSelected(false)
          }}
          flashImg={require("../../../assets/flash/Ressources2.png")}
          active={themeSelected?.theme_id === 6}
        />

      </View>
      <View style={{
        flex: 1
      }}>
        {
          themeSelected &&
          <FlashCategoriesView
            navigation={navigation} theme_id={themeSelected.theme_id}
            color={themeSelected.color}
            text_color={themeSelected.textColor}
          />
        }

        {
          (themeSelected === null && qaSelected == false) &&
          <Text style={{ alignSelf: 'center', marginTop: 200 }}>Veuillez sélectionner une catégorie</Text>
        }
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  AndroidSafeArea: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  container: {
    backgroundColor: '#fffefd',
    flexDirection: 'column',
    flex: 1
  },
  orthoLogo: {
    position: 'absolute',
    alignSelf: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffefd',
    padding: 10,
    borderRadius: 200
  },
  rowContainer: {
    flexDirection: 'row',
    width: '90%',
    alignSelf: 'center',
    height: "20%"
  },
  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 10
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 13,
    color: '#000',
    textAlign: 'center',
  }
})