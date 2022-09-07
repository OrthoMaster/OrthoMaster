import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  StatusBar
} from 'react-native';




export const ProductView = () => {
  return (
    <View style={[styles.container, styles.AndroidSafeArea]}>
      {/* <View style={styles.containerButtons}>
        <TouchableOpacity style={[styles.button, styles.buttonLeft]}
        onPress={()=>Alert.alert('Nous travaillons actuellement sur vôtre future nouvel assistant')}
        >
          <Image
            style={styles.buttonImg}
            source={require('../../../assets/queChoisir/produit.jpg')}
          />
          <View style={styles.buttonImgBlur} />
          <Text style={styles.buttonText}>Je pars du produit</Text>


        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonRight]}
        onPress={()=>Alert.alert('Nous travaillons actuellement sur vôtre future nouvel assistant')}
        >
          <Image
            style={styles.buttonImg}
            source={require('../../../assets/queChoisir/patient.jpg')}
          />
          <View style={styles.buttonImgBlur} />
          <Text style={styles.buttonText}>Je pars du patient</Text>
        </TouchableOpacity>


      </View>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../../assets/queChoisir/logo.png')}
          style={styles.logo}
        />
      </View> */}
      <Text style={{ fontSize: 40, fontWeight: '800' }}>Que choisir ?</Text>
      <Text style={{ fontSize: 30, fontWeight: '600', textAlign: 'center' }}>Aide décisionelle pour faire le bon choix</Text>
      <Image
      style={{
        width: Dimensions.get('screen').width,
        height: Dimensions.get('screen').width,
        resizeMode: 'contain'
      }}
        width={Dimensions.get('screen').width}
        source={require('../../../assets/queChoisir/construction.gif')}
      />
      <Text style={{ fontSize: 20, fontWeight: '400', textAlign: 'center' }}>Nous travaillons actuellement sur votre future nouvel assistant</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  AndroidSafeArea: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC600'
  },
  containerButtons: {
    backgroundColor: '#fffefd',
    flex: 1,
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    justifyContent: 'center'
  },
  buttonLeft: {
    borderRightWidth: 5,
    borderRightColor: '#fffefd',
    alignItems: 'flex-start',
  },
  buttonRight: {
    borderLeftWidth: 5,
    borderLeftColor: '#fffefd',
    alignItems: 'flex-end',
  },
  buttonText: {
    fontWeight: '700',
    color: '#fffefd',
    fontSize: 18,
    margin: 20,
    textAlign: 'center'
  },
  buttonImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute'

  },
  buttonImgBlur: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#1B1C1E',
    opacity: 0.6
  },
  logoContainer: {
    position: 'absolute',
    width: 70,
    height: 70,
    backgroundColor: '#E75A08',
    borderRadius: 50,
    borderWidth: 8,
    borderColor: '#fffefd',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    width: '70%',
    height: '70%',
    resizeMode: 'contain',
  }

})

