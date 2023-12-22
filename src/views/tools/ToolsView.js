import React, { useState, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  View
} from 'react-native';


import { QueChoisirMenu } from './QueChoisir/QueChoisirMenu';
import { GuidePatientMenu } from './GuidePatient/GuidePatientMenu';
export const ToolsView = ({ navigation }) => {



  return (
    <SafeAreaView style={{}}>
      <ScrollView contentContainerStyle={{alignItems: 'center'}}>

        <Text style={styles.containerTitle}>
          Mes outils
        </Text>

        <QueChoisirMenu navigation={navigation}/>
        <View style={{height: 30}}/>
        <GuidePatientMenu />


      </ScrollView>
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
    width: 80, height: 80,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.2,
    shadowOffset: {
      width: 5, height: 5
    }
  },
  toolButtonText: {
    fontSize: 17,
    color: '#EC4C70',
  },
  toolButtonIcon: {
    width: 15,
    height: 15,
    tintColor: '#EC4C70'
  }

})

