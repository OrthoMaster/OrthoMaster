import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Linking,
  Dimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from "@tanstack/react-query";
import { getProductsBrands } from '../../../../../services/ProductsService';
import FiltersQC from './components/Filters/FiltersQC';
import FiltersButton from './components/Filters/FiltersButton';
import CategoriesSelection from './components/Categories/CategoriesSelection';

import Spacings from '../../../../../../constants/Spacings';

import {
  getSelectedProductBrands,
  updateSelectedProductBrands
} from "../../../../../services/v2/ToolService";

const { width: screenWidth } = Dimensions.get('screen');
const isWeb = Platform.OS === 'web';

export const QueChoisirButton: React.FC<{ onPress: () => any }> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#33C0B7',
        padding: 20,
        borderRadius: 15,
        marginVertical: 10,
      }}
      onPress={onPress}
    >
      <Image
        source={require('../../../../../../assets/tools/que-choisir/access-icon.png')}
        style={{
          width: isWeb ? 100 : screenWidth / 6,
          height: isWeb ? 100 : screenWidth / 6,
          marginBottom: 10
        }}
      />
      <Text style={{ fontSize: 20, color: '#fff', fontFamily: 'Poppins-Medium' }}>
        Que Choisir ?
      </Text>
    </TouchableOpacity>
  )
}

type QueChoisirMenuProps = {
  onClose: () => any;
  onStart: (category: string, filtersConfig: any) => any;
}

export const QueChoisirMenu: React.FC<QueChoisirMenuProps> = ({ onClose, onStart }) => {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    queChoisir: {
      default: [],
      selected: []
    }
  })

  useQuery({
    queryKey: ['Tools', 'GET', 'Brands'],
    queryFn: () => getProductsBrands().then((res) => {
      setFilters({
        ...filters,
        queChoisir: {
          ...filters.queChoisir,
          default: res.brands
        }
      })
      return res
    })
  });

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchSelectedBrands = async () => {
      try {
        const data = await getSelectedProductBrands();
        if (data) {
          setFilters(prev => ({
            ...prev,
            queChoisir: {
              ...prev.queChoisir,
              selected: data
            }
          }));
        }
      } catch (e) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchSelectedBrands();
  }, []);

  const handleFilters = async (newFilters) => {
    setFilters({
      ...filters,
      queChoisir: {
        ...filters.queChoisir,
        selected: newFilters
      }
    });
    if (newFilters.length > 0) {
      await updateSelectedProductBrands(newFilters);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ width: '100%', height: '95%', alignItems: 'center' }}>
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 0, left: 5,
            padding: 10
          }}
          onPress={() => {
            Linking.openURL("https://www.orthomaster.fr/cgu-que-choisir")
          }}>
          <AntDesign name="info-circle" size={24} color="white" />
        </TouchableOpacity>

        <FiltersButton
          style={{
            backgroundColor: '#fff',
            padding: 10,
            borderRadius: 5,
            shadowOpacity: 0.25,
            shadowOffset: { width: 0, height: 0 },
            alignItems: 'center',
            // À gauche : le coin haut droit est réservé au bouton Fermer, comme sur les autres popups.
            top: 10, left: 10,
            alignSelf: 'flex-start',
            zIndex: 1000,
            position: 'absolute'
          }}
          nbFiltersSelected={filters.queChoisir.selected.length}
          onPress={() => {
            setShowFilters(!showFilters)
          }}
          showFilters={showFilters}
        />
        <Image
          source={require('../../../../../../assets/tools/que-choisir/que-choisir.png')}
          style={{
            width: "95%", resizeMode: 'contain', height: 250,
          }}
        />
        <CategoriesSelection
          onSelect={(category) => {
            onStart(category, filters.queChoisir)
          }}
        />

        {
          showFilters &&
          <View style={{
            position: 'absolute',
            height: '100%', width: '100%',
            zIndex: 2,
            alignItems: 'center',
          }}

          >
            <FiltersQC onChange={(filters) => {
              AsyncStorage.setItem("qcFilters", filters.toString())
              handleFilters(filters)
            }}
              filterConfig={filters.queChoisir}
            />
          </View>
        }

        {/* Fermer en haut à droite, même pastille que Supports pédagogiques. */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer">
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    top: Spacings.md,
    right: Spacings.md,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: Spacings.sm,
    borderRadius: 40,
    zIndex: 99999,
  },
  container: {
    width: '100%', height: '95%',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: "#33C0B7",
  },
  toolTitle: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: 'bold',
    marginTop: 10
  },
  containerButtons: {
    backgroundColor: '#F97302',
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
    fontSize: 12,
    color: '#fff',
    width: '90%',
    textAlign: 'center'
  },
  toolButtonIcon: {
    width: 15,
    height: 15,
    tintColor: '#EC4C70'
  }
})