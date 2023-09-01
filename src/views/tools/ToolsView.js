import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  StatusBar,
  SafeAreaView,
  FlatList
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { getProductsBrands } from '../../services/ProductsService';
import { getQCcategories } from '../../services/tools/QueChoisirService';
import { useQuery } from 'react-query';
import { Ionicons } from '@expo/vector-icons';

import AppModal from '../../component/AppModal';

export const ToolsView = ({ navigation }) => {

  const brands = useQuery(['Tools', 'GET', 'Brands'], () => getProductsBrands())
  const qcCategories = useQuery(['Tools', 'GET', 'QC categories'], () => getQCcategories())
  const [showFilters, setShowFilters] = useState(false)

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
        <TouchableOpacity style={[{
          backgroundColor: '#fff',
          padding: 10,
          borderRadius: '100%',
          position: 'absolute',
          right: 10,
          top: 10,
          shadowOpacity: 0.25,
          shadowOffset: { width: 5, height: 5 }
        }]}
          onPress={() => setShowFilters(true)}>
          <Ionicons name="filter" size={24} color="#EC4E6E" />
        </TouchableOpacity>

        <Image
          style={styles.toolQCImage}
          source={require('../../../assets/tools/exam.png')}
        />
        <Text style={styles.toolTitle}>
          Que choisir ?
        </Text>

        <FlatList
          data={qcCategories.data}
          keyExtractor={(item, index) => index}
          renderItem={(item) => (<TouchableOpacity
            style={styles.containerButtons}
            onPress={() => navigation.navigate('tools-que-choisir', {
              category: item.item.name
            })}
          >
            <Text style={styles.toolButtonText}>{item.item.name}</Text>
          </TouchableOpacity>)
          }
          numColumns={2}
          columnWrapperStyle={{
            flex: 1,
            justifyContent: 'space-evenly',
            paddingVertical: 10
          }}
          style={{ width: '70%' }}
        />
      </LinearGradient>

      <AppModal isVisible={showFilters} style={{
        width: '90%'
      }}
        customRender={<View>

        </View>}
        onClose={() => setShowFilters(false)}
      />
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

