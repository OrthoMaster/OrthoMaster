import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  StatusBar,
  SafeAreaView
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';


export const ToolsView = ({ navigation }) => {
  return (
    <SafeAreaView style={[styles.container, styles.AndroidSafeArea]}>
      <Text style={styles.containerTitle}>
        Mes outils
      </Text>

      <LinearGradient
        colors={['#E8764A', '#EC4C70']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.containerTool}
      >
        <Image
          style={styles.toolQCImage}
          source={require('../../../assets/tools/exam.png')}
        />
        <Text style={styles.toolTitle}>
          Que choisir ?
        </Text>

        <View
          style={styles.containerButtons}
          //onPress={() => navigation.navigate('tools-que-choisir')}
        >
          <Text style={styles.toolButtonText}>Bientôt disponible</Text>
        </View>
        {/* <TouchableOpacity
          style={styles.containerButtons}
          //onPress={() => navigation.navigate('tools-que-choisir')}
        >
          <Text style={styles.toolButtonText}>Commencer</Text>
          <Image 
            style={styles.toolButtonIcon}
            source={require('../../../assets/navigation/right-arrow.png')}
          />
        </TouchableOpacity> */}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  AndroidSafeArea: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  containerTitle: {
    fontSize: 35,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginLeft: 40,
    marginVertical: 30
  },
  containerTool: {
    width: '80%',
    alignItems: 'center',
    paddingVertical: 30,
    borderRadius: 16
  },
  toolQCImage: {
    height: 200,
    width: 200,
    resizeMode: 'contain',
  },
  toolTitle: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: 'bold',
    marginVertical: 20
  },
  containerButtons: {
    backgroundColor: '#ffffff',
    width: '90%',
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  toolButtonText: {
    fontSize: 17,
    color: '#EC4C70',
    marginRight: 20
  },
  toolButtonIcon: {
    width: 15,
    height: 15,
    tintColor: '#EC4C70'
  }

})

