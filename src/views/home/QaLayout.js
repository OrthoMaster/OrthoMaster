import React, { useState, useEffect } from 'react'

import {
  Text,
  Alert,
  StyleSheet,
  Image,
  View,
  Linking,
  TouchableOpacity
} from 'react-native'

import { SearchFilters } from '../search/components/SearchFilters';
import { ContentSelection } from '../search/components/ContentSelection';

import { useQuery } from "react-query"
import { fetchSearchList } from '../../services/SearchService';

import { LoadingContent } from '../../component/LoadingContent'

import { HomeHeaderButton } from './components/HomeHeaderButton';


export const QaLayout = ({ navigation }) => {

  const [filters, setFilters] = useState(null)

  const qaList = useQuery(['Qa', 'GET', "qaList"], () => fetchSearchList({
    contentType: 'qa',
    filters: filters,
    body: null,
    searchText: null
  }
    , null
  ))


  useEffect(() => {
    if (filters) {
      qaList.refetch()
    }
  }, [filters]);

  if (qaList.isLoading) return <LoadingContent />
  if (qaList.error) return <Text>Error</Text>


  return (<View style={styles.container}>


    <ContentSelection
      content={qaList.data}
      onSelect={(card) => {
        navigation.navigate('flash-content-viewer', {
          content: card.content
        })
      }}
      cardLayout={'qa'}
      onRetry={() => qaList.refetch}
    />

    <TouchableOpacity style={[{
      backgroundColor: "#DF8501",
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      right: 10,
      bottom: 170,
      padding: 5,
      borderRadius: 10
    }]}
      onPress={() => {
        Linking.openURL('mailto:question@orthomaster.fr')
      }
      }
    >
      <Image
        style={{
          width: 50, height: 50,
          resizeMode: 'contain',
        }}
        source={require('../../../assets/navigation/question-icon.png')}
      />
      <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 10 }}>
        Poser une question
      </Text>
    </TouchableOpacity>
  </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fffefd',
    width: '100%',
    alignItems: 'center',
    height: '100%',
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
    borderWidth: 0.3,
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