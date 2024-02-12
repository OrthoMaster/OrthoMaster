import React, { useCallback, useState, useEffect } from 'react';
import {
  SafeAreaView,
  Text,
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  StatusBar,
  Image,
  RefreshControl
} from 'react-native';
import { useStore } from 'react-redux';

import { AccountProgress } from './components/AccountProgress';
import { Trophies } from './components/trophies/Trophies';

import { AccountOfficesProgress } from './components/AccountOfficesProgress';

import { AccountMenu } from './menu/AccountMenu';
import { useQuery } from 'react-query'
import { useDispatch } from 'react-redux'
import { getOfficeInfos } from '../../services/OfficeService'
import { CertifiedFormationProgress } from './components/CertifiedFormationProgress';
import { useOrthoMasterRoles } from '../../hooks/useOrthoMasterRoles';


const AccountHeader = ({ user, menuActive, toggleMenu }) => {

  return (
    <SafeAreaView style={[styles.header]} >
      <View style={styles.headerText}>
        <Text style={styles.profilName}>{user ? user.name + ' ' + user.lastname : ''}</Text>
        <Text style={styles.profilUsername}><Text style={{fontWeight: 'bold'}}>Nom d'utilisateur :</Text> {user.username}</Text>
      </View>
      <TouchableOpacity
        style={styles.headerLogoutButton}
        onPress={() => {
          toggleMenu()
        }}
      >
        <Image

          style={{
            width: 30, height: 30,
            alignSelf: 'center',
            transform: [{ rotateZ: menuActive ? '90deg' : '0deg' }]
          }}
          source={require('../../../assets/navigation/menu.png')}
        />

      </TouchableOpacity>
    </SafeAreaView>
  )
}

export const AccountView = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false)
  const [menuIsActive, setMenuIsActive] = useState(false)
  const store = useStore()
  const user = store.getState().auth.userCurrentSession
  const roles = useOrthoMasterRoles()

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <AccountHeader
        user={user}
        menuActive={menuIsActive}
        toggleMenu={() => {
          setMenuIsActive(!menuIsActive)
        }}
      />
      <View>
        <ScrollView
          contentContainerStyle={[styles.container, styles.AndroidSafeArea]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={styles.sectionTitle}>Ma progression</Text>
          <AccountProgress userId={user.id_user} refreshing={refreshing} />

          <Text style={[styles.sectionTitle]}>Mes trophées</Text>

          <Trophies refreshing={refreshing} />

          <CertifiedFormationProgress />

          <AccountOfficesProgress
            enableConfig={roles.isPrimaryManager || roles.isSecondaryManager}
            refreshing={refreshing}
            navigation={navigation}
          />

          <View style={{ height: 200 }} />
        </ScrollView>
        {
          menuIsActive ?
            <AccountMenu user={user} navigation={navigation} />
            : null
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  AndroidSafeArea: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  container: {
    backgroundColor: '#fffefd',
    alignItems: 'center',
    width: '100%'
  },
  header: {
    width: '100%',
    //height: Platform.OS === "android" ? StatusBar.currentHeight+100 : 120,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffaf31'
  },
  headerLogoutButton: {
    marginRight: 20,
    justifyContent: 'center'
  },

  profilName: {
    fontWeight: 'bold',
    fontSize: 28,
    marginLeft: 10,
    alignSelf: 'flex-start',
    color: '#ffffff'
  },
  officeName: {
    fontSize: 15,
    marginLeft: 10,
    marginBottom: 10,
    alignSelf: 'flex-start',
    color: '#ffffff'
  },
  profilUsername: {
    fontSize: 15,
    marginLeft: 10,
    marginBottom: 10,
    alignSelf: 'flex-start',
    color: '#ffffff'
  },
  Trophiesname: {
    fontWeight: '400',
    fontSize: 15,
    marginLeft: 10,
    alignSelf: 'flex-start',
    color: '#2B2B2B'
  },
  profilTitle: {
    marginLeft: 10,
    alignSelf: 'flex-start',
    fontWeight: '600',
    fontSize: 20,
    marginBottom: 30
  },
  sectionTitle: {
    marginLeft: 10,
    alignSelf: 'flex-start',
    fontWeight: 'bold',
    fontSize: 20,
    marginVertical: 20,
    color: '#ffaf31'
  },
})




