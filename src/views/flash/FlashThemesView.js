import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image
} from 'react-native';

import { Text as SvgText, TextPath, TSpan, G, Svg, Defs, Path, Use }
  from 'react-native-svg';

const FlashButton = ({ label, onPress, buttonColor }) => {
  var buttonImage = null
  switch (label) {
    case 'Mon patient':
      buttonImage= require('../../../assets/flash/patient.png')
      break;
      case 'Mon activité':
        buttonImage= require('../../../assets/flash/activite.png')
      
      break;
      case 'Les solutions':
        buttonImage= require('../../../assets/flash/les_solutions.png')
      
      break;
      case 'Ressources':
        buttonImage= require('../../../assets/flash/ressources.png')
      
      break;
  
    default:
      
      break;
  }
  return ( <View style={styles.buttonContainer}>
    <Image
      source={buttonImage}
      style={{
        width: '100%', height: '100%',
        resizeMode: 'cover',
        position: 'absolute'
      }}
    />
        <TouchableOpacity style={[styles.button]}
            onPress={onPress}>
  
            <Text style={styles.buttonText}>{label}</Text>
          </TouchableOpacity>
  </View>
    )
}

export const FlashThemesView = ({ navigation, route }) => {

  return (
    <SafeAreaView style={[styles.container, styles.AndroidSafeArea]}>

      <View style={styles.rowContainer}>
      <FlashButton
          label={'Mon activité'}
          onPress={() => navigation.navigate('flash-categories', {
            theme_id: 2,
            theme_title: 'Mon activié',
            theme_color: '#E6E6E6'
          })}
        />
        <FlashButton
          label={'Mon patient'}
          onPress={() => navigation.navigate('flash-categories', {
            theme_id: 1,
            theme_title: 'Mon patient',
            theme_color: '#E6E6E6'
          })}
        />
        
      </View>
      <View style={styles.rowContainer}>
        <FlashButton
          label={'Les solutions'}
          onPress={() => navigation.navigate('flash-categories', {
            theme_id: 3,
            theme_title: 'Les solutions',
            theme_color: '#E6E6E6'
          })}
        />
        <FlashButton
          label={"Ressources"}
          onPress={() => navigation.navigate('flash-categories', {
            theme_id: 4,
            theme_title: "Ressources",
            theme_color: '#E6E6E6'
          })}
        />
      </View>

      <View style={styles.orthoLogo}>

        <Svg
          width={Dimensions.get('screen').width / 3}
          height={Dimensions.get('screen').width / 3}
          viewBox="0 0 200 200"
        >
          <G>
            <SvgText fill="black" fontSize={22} fontWeight='600'>
              <TextPath href="#pathUp" startOffset="20%">
                <TSpan dy="-15">
                  Les infos utiles
                </TSpan>
              </TextPath>
            </SvgText>
            <SvgText fill="black" fontSize={22} fontWeight='600'>
              <TextPath href="#pathDown" startOffset="20%" >
                <TSpan dy="25">
                  sur l'orthopédie
                </TSpan>
              </TextPath>
            </SvgText>
          </G>
          <Defs>
            <Path id="pathUp" d="M10 100 C 10 100, 100 -55, 190 100" fill="blue" />
            <Path id="pathDown" d="M10 100 C 10 100, 100 255, 190 100" fill="blue" />
          </Defs>
        </Svg>

        <Image
          style={{
            position: 'absolute',
            alignSelf: 'center',
            width: Dimensions.get('screen').width / 5,
            height: Dimensions.get('screen').width / 5
            
          }}
          source={require('../../../assets/logo.png')}
        />
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
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center'
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
    flex: 1
  },
  buttonContainer: {
    flex: 1,
    marginHorizontal: 5,
    marginVertical: 5
  },
  button: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fffefd',
    textAlign: 'center'
  }
})