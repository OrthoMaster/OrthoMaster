import React, { useState, useEffect } from 'react'

import {
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  View,
  Linking
} from 'react-native'

import { SearchFilters } from '../search/components/SearchFilters';
import { ContentSelection } from '../search/components/ContentSelection';

import { useQuery } from "react-query"
import { fetchSearchList } from '../../services/SearchService';

import { LoadingView } from '../LoadingView'

import { HomeHeaderButton } from './components/HomeHeaderButton';


export const QaLayout = ({ navigation, route }) => {

  const [filters, setFilters] = useState(null)

  const qaList = useQuery("qaList", () => fetchSearchList({
    contentType: 'qa',
    filters: filters,
    body: null,
    searchText: null
  }
    , null
  ), {
    onError: (error) => {
      throw error
    }
  })


  useEffect(() => {
    if (filters) {
      qaList.refetch()
    }
  }, [filters]);

  if (qaList.isLoading) return <LoadingView />
  if (qaList.error) return <Text>Error</Text>


  return (<View style={styles.container}>

    <SearchFilters
      route={route}
      values={['Connaissance médicale', 'Prise en charge du patient', 'Solution orthopédique', 'Gestion de l\'officine', 'Divers']}
      onSelect={(filters) => { setFilters(filters) }}
    />

    <ContentSelection
      content={qaList.data}
      onSelect={(card) => {
        navigation.navigate('home-content', {
          content: card.content
        })
      }}
      cardLayout={'qa'}
      onRetry={() => qaList.refetch}
    />
    <HomeHeaderButton
      value='Poser une question'
      color='#386CDA'
      icon={require('../../../assets/home/header/header_button_question.png')}
      style={styles.askQuestionButton}
      onPress={() => {
        Linking.openURL('mailto:question@orthomaster.fr')
      }}
    />

  </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fffefd',
    width: '100%',
    alignItems: 'center',
    height: '100%'
  },
  scrollContainer: {
    //width: '100%'
    marginTop: 10
  },
  card: {
    //flexDirection: 'column',
    width: '95%',
    marginBottom: 20,
    alignSelf: 'center'
  },
  cardThumbnail: {
    flexDirection: 'column-reverse',
    width: '100%',
    height: 200
  },
  cardDescriptionContainer: {
    paddingLeft: 5,
    paddingVertical: 10,
    borderWidth: 1,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  cardImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    position: 'absolute'
  },
  cardTitleContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    height: '70%',
    justifyContent: 'flex-end'
  },

  cardTitle: {
    color: '#fffefd',
    fontWeight: '700',
    fontSize: 15,
  },
  askQuestionButton: {
    position: 'absolute',
    top: '84%'
  },
  askQuestionButtonText: {
    fontWeight: '600',
    fontSize: 15,
    alignSelf: 'center',
    color: '#fffefd'
  }
})