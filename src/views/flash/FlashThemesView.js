import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Image
} from 'react-native';

import { FlashCategoriesView } from './FlashCategoriesView';
import { QaLayout } from '../home/QaLayout';

const FlashButton = ({ label, onPress, buttonColor, flashImg }) => {

  return (<View style={styles.buttonContainer}>
    <TouchableOpacity style={[styles.button]}
      onPress={onPress}>
      <Image
        source={flashImg}
        style={{
          width: 100, height: 100,
          resizeMode: 'contain',
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

  useEffect(() => {
    console.log(themeSelected);
  }, [themeSelected])


  return (
    <SafeAreaView style={[styles.container, styles.AndroidSafeArea]}>

      <View style={styles.rowContainer}>
        <FlashButton
          label={'Mon Patient'}
          onPress={() => {
            setThemeSelected({
              type: "flash",
              theme_id: 5,
              color: '#FBAF31'
            })
            setQaSelected(false)
          }}
          flashImg={require("../../../assets/flash/Mon-patient.png")}
        />
        <FlashButton
          label={'Ressources'}
          onPress={() => {
            setThemeSelected({
              type: "flash",
              theme_id: 6,
              color: "#1B70C0"
            })
            setQaSelected(false)
          }}
          flashImg={require("../../../assets/flash/Ressources2.png")}
        />
        <FlashButton
          label={'Question & Réponse'}
          onPress={() => {
            setThemeSelected(null)
            setQaSelected(true)
          }}
          flashImg={require("../../../assets/flash/Question-reponse.png")}
        />
      </View>
      {
        themeSelected &&
        <FlashCategoriesView navigation={navigation} theme_id={themeSelected.theme_id} color={themeSelected.color} />
      }
      {
        qaSelected &&
        <QaLayout navigation={navigation} />
      }

      {
        (themeSelected === null && qaSelected == false) &&
        <Text style={{ alignSelf: 'center', marginTop: 200 }}>Aucune catégorie séléctionner</Text>
      }

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  AndroidSafeArea: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  container: {
    backgroundColor: '#fffefd',
    flex: 1,
    flexDirection: 'column',
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
  },
  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    borderColor: "#BDBDBD",
    borderWidth: 0.5,
    padding: 10
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
  }
})