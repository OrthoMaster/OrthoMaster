import React, { useState, useEffect } from 'react';
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
import { getQCcategories } from '../../services/tools/QueChoisirService';
import { getProductsBrands } from '../../services/ProductsService';
import { useQuery } from 'react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AppModal from '../../component/AppModal';
import FiltersQC from './QueChoisir/FiltersQC';


export const ToolsView = ({ navigation }) => {
  const qcCategories = useQuery(['Tools', 'GET', 'QC categories'], () => getQCcategories())
  const brandsAvailable = useQuery(['Tools', 'GET', 'Brands'], () => getProductsBrands(), {
    onSuccess: (data) => {
      setFilters({
        ...filters,
        queChoisir: {
          ...filters.queChoisir,
          default: data.brands
        }
      })
    }
  })
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    queChoisir: {
      default: [],
      selected: []
    }
  })

  const handleFilters = (newFilters) => {
    setFilters({
      ...filters,
      queChoisir: {
        ...filters.queChoisir,
        selected: newFilters
      }
    })
  }

  useEffect(() => {
    AsyncStorage.getItem("qcFilters", (err, result) => {
      if (result) {
        handleFilters(result.split(','))
      }
    })
  }, [])


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
          borderRadius: 100,
          position: 'absolute',
          right: 10,
          top: 10,
          shadowOpacity: 0.25,
          shadowOffset: { width: 5, height: 5 }
        }]}
          onPress={() => setShowFilters(true)}>
          <MaterialCommunityIcons name="format-list-numbered" size={24} color="#EC4E6E" />
          {
            filters.queChoisir.selected.length > 0 &&
            <View style={{
              backgroundColor: '#EC5369',
              borderColor: '#fff',
              borderWidth: 1,
              alignItems: 'center',
              borderRadius: 100,
              position: 'absolute',
              width: 20, height: 20,
              bottom: -5, right: -5,
              justifyContent: 'center',
              shadowOpacity: 0.25, shadowOffset: { width: 0, height: 0 }
            }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 10 }}>1</Text>
            </View>
          }
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
              category: item.item.name,
              filtersConfig: filters.queChoisir
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
        customRender={<FiltersQC onChange={(filters) => {
          AsyncStorage.setItem("qcFilters", filters.toString())
          handleFilters(filters)
        }}
          filterConfig={filters.queChoisir}
        />}
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

