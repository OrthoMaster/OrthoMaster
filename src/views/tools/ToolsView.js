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




export const ToolsView = ({navigation}) => {
  return (
    <View style={[styles.container, styles.AndroidSafeArea]}>
      <TouchableOpacity
      style={styles.containerButtons}
      onPress={()=>navigation.navigate('tools-que-choisir')}
      >
        <Text>Que choisir</Text>
      </TouchableOpacity>
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
    backgroundColor: '#ffffff'
  },
  containerButtons: {
    backgroundColor: 'orange',
    padding: 20
  },

})

