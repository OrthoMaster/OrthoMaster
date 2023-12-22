import React, { useEffect, useState } from 'react'
import { Text, View, Pressable, StyleSheet } from 'react-native'

import { ModuleLayout } from './ModuleLayout'
import { MenuLayout } from './menu/MenuLayout'

import { useTheme } from '@react-navigation/native'
import LaboFormationView from './labo/LaboFormationView'

const FORMATION_TYPE_MODULE = 'formation-module'
const FORMATION_TYPE_MENU = 'formation-menu'


const FormationTypeNav = ({ displayView, navigation }) => {
    const [selected, setselected] = useState('lesson')


    return <View style={styles.formationTypeNavContainer}>
        <Pressable
            style={[
                styles.formationTypeNavButton,
                {
                    backgroundColor: selected == 'lesson' ? '#ffffff' : '#20113A'
                }
            ]}
            onPress={() => {
                displayView(FORMATION_TYPE_MODULE)
                setselected('lesson')
                navigation.setParams({ title: 'Se former' })
            }}>
            <Text
                style={[styles.formationTypeNavText, { color: selected == 'lesson' ? '#20113A' : '#ffffff' }]}>
                Parcours
            </Text>
        </Pressable>
        <Pressable
            style={[styles.formationTypeNavButton, { backgroundColor: selected == 'menu' ? '#ffffff' : '#20113A' }]}
            onPress={() => {
                displayView(FORMATION_TYPE_MENU)
                setselected('menu')
            }}>
            <Text
                style={[styles.formationTypeNavText, { color: selected == 'menu' ? '#20113A' : '#ffffff' }]}>
                A la carte
            </Text>
        </Pressable>
    </View>
}


const FormationTypeDisplay = ({ type, navigation, route }) => {
    if (type == FORMATION_TYPE_MODULE) {
        return <ModuleLayout navigation={navigation} route={route}/>
    } else {
        return <MenuLayout navigation={navigation} route={route} />
    }
}

export const FormationView = ({ navigation, route }) => {
    const [formationType, setformationType] = useState(FORMATION_TYPE_MODULE)
    const {isLabo} = useTheme()

    if (isLabo == false) {
        return <View style={styles.container}>
            <FormationTypeDisplay type={formationType} navigation={navigation} route={route} />

            <FormationTypeNav displayView={(view) => { setformationType(view) }}
                navigation={navigation}
            />
        </View>
    } else {
        return <LaboFormationView navigation={navigation}/>
    }


}

const styles = StyleSheet.create({
    container: {
        height: '100%',
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#fffefd'
    },
    formationTypeNavContainer: {
        backgroundColor: '#1F113A',
        borderRadius: 40,
        width: '50%',
        height: 42,
        padding: 4,
        marginBottom: 15,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        top: '92%'
    },
    formationTypeNavButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        borderRadius: 40
    },
    formationTypeNavText: {
        fontWeight: '600'
    }
})