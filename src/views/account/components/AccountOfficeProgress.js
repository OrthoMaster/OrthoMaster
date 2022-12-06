import React, { useEffect, useState } from 'react'

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    FlatList
} from 'react-native'

import { useQuery } from 'react-query'
import { getOfficeProgression, getCollaboratorsProgression } from '../../../services/ProgressionService'
import { useDispatch } from 'react-redux'
import { logout } from '../../../actions/auth'

import { getUserTrophy } from '../../../services/TrophyService'
import { TrophyCard } from './trophies/TrophieCard'

const UserProgressDetails = ({ user }) => {
    const [isToggle, setIsToggle] = useState(false)
    const userTrophy = useQuery('getCollaboratorTrophies', () => getUserTrophy(user.id_user))


    if (userTrophy.isLoading) return <ActivityIndicator />
    if (userTrophy.error) return <Text>Error</Text>

    return (
        <View style={styles.userProgressContainer}>
            <TouchableOpacity style={styles.userProgressButtonContainer}
                onPress={() => setIsToggle(!isToggle)}
            >
                <View style={styles.userProgressButton}>
                    <Text style={styles.userProgressButtonText}>{user.name + ' ' + user.lastname}</Text>
                    <View style={styles.userProgressBar} >
                        <View style={[styles.userFormationProgress, { width: user.progress.formation_progress + '%' }]} />
                    </View>
                </View>
                <Image
                    style={[styles.userProgressButtonIcon, { transform: [{ rotate: isToggle ? '90deg' : '0deg' }] }]}
                    source={require('../../../../assets/navigation/right-arrow.png')}
                />
            </TouchableOpacity>
            {
                isToggle ?
                <View style={[styles.userProgressDetailsContainer, { paddingVertical: 20 }]}>
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.stat}><Text style={{fontWeight: 'bold'}}>{Math.round(user.progress.formation_progress)}</Text>%</Text>
                        <Text style={styles.statText}>progression formation</Text>
                    </View>
                    <View style={[styles.statBox, {flex: 2}]}>
                        <Text style={styles.stat}><Text style={{fontWeight: 'bold'}}>{Math.round(user.progress.formation_logtime / 3600)}</Text>h</Text>
                        <Text style={[styles.stat, { fontSize: 17 }]}><Text style={{fontWeight: 'bold'}}>{Math.round(user.progress.formation_logtime % 3600 / 60)}</Text>min</Text>
                        <Text style={styles.statText}>temps formation</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.stat}><Text style={{fontWeight: 'bold'}}>{Math.round(user.progress.app_logtime / 3600)}</Text>h</Text>
                        <Text style={[styles.stat, { fontSize: 17 }]}><Text style={{fontWeight: 'bold'}}>{Math.round(user.progress.app_logtime % 3600 / 60)}</Text>min</Text>
                        <Text style={styles.statText}>temps appli</Text>
                    </View>
                </View>
                
                <FlatList
                    data={userTrophy.data}
                    renderItem={(item) => <TrophyCard item={item.item}/>}
                    keyExtractor={item => item.trophy.id_trophy}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{width: '90%', alignSelf: 'center', marginTop: 30}}
                />
            </View>
            : null
            }
            
        </View>
    )
}


export const AccountOfficeProgress = ({ officeId }) => {
    const dispatch = useDispatch()
    const collaborators = useQuery('fetchOfficeCollaboratorsProgress', () => getCollaboratorsProgression(officeId), {
        onError: (error) => {
            throw error
        }
    })
    const office = useQuery('fetchOfficeProgress', () => getOfficeProgression(officeId), {
        onError: (error) => {
            throw error
        }
    })

    if (collaborators.isLoading || office.isLoading) return <Text>Loading</Text>
    if (collaborators.error || office.error) return <Text>Error</Text>

    return (
        <View style={styles.container}>
            <View style={styles.statBox}>
                <Text style={[styles.officeStat, { color: '#fffefd' }]}>{Math.round(office.data.stat)}%</Text>
                <Text style={[styles.officeStatText, { color: '#fffefd' }]}>Total formation complété</Text>
            </View>
            {collaborators.data.map((value, key) => {
                return <UserProgressDetails user={value} key={key} />
            })}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    officeStat: {
        fontSize: 40,
        fontWeight: '800'
    },
    officeStatText: {
        fontSize: 20,
        fontWeight: '500'
    },
    userProgressContainer: {
        width: '95%'
    },
    userProgressButtonContainer: {
        backgroundColor: '#fffefd',
        width: '100%',
        marginVertical: 5,
        paddingVertical: 10,
        borderRadius: 5,
        flexDirection: 'row'
    },
    userProgressButton: {
        width: '80%',
        marginLeft: 20

    },
    userProgressButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    userProgressBar: {
        backgroundColor: '#ADADAD',
        height: 5,
        width: '100%',
        marginTop: 5
    },
    userFormationProgress: {
        backgroundColor: '#E75A08',
        height: '100%',

    },
    userProgressButtonIcon: {
        width: 15,
        height: 15,
        alignSelf: 'center',
        marginLeft: 20
    },
    userProgressDetailsContainer: {
        backgroundColor: '#fffefd',
    },
    statsContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
        alignSelf: 'center',
        alignItems: 'flex-end'
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    stat: {
        fontWeight: '600',
        fontSize: 25,
    },
    statText: {
        fontWeight: '400',
        fontSize: 15,
        color: '#fffefd',
    },
    statText: {
        fontWeight: '400',
        fontSize: 13,
        width: '80%',
        textAlign: 'center'
    },
   
})