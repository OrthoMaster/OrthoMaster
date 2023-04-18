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
import { getOfficesProgression, getCollaboratorsProgression } from '../../../services/ProgressionService'
import { useDispatch } from 'react-redux'
import { logout } from '../../../actions/auth'

import { getUserTrophy } from '../../../services/TrophyService'
import { TrophyCard } from './trophies/TrophieCard'

const UserProgressDetails = ({ user, refreshing }) => {
    const [isToggle, setIsToggle] = useState(false)
    const userTrophy = useQuery('getCollaboratorTrophies', () => getUserTrophy(user.id_user))

    useEffect(() => {
        if (refreshing) {
            userTrophy.refetch()
        }
    }, [refreshing])

    return (
        <View style={styles.userProgressContainer}>
            <TouchableOpacity style={styles.progressButtonContainer}
                onPress={() => setIsToggle(!isToggle)}
            >
                <View style={styles.progressButton}>
                    <Text style={styles.progressButtonText}>{user.name + ' ' + user.lastname}</Text>
                    <View style={styles.progressBar} >
                        <View style={[styles.formationProgress, { width: user.progress.formation_progress + '%' }]} />
                    </View>
                </View>
                <Image
                    style={[styles.progressButtonIcon, { transform: [{ rotate: isToggle ? '90deg' : '0deg' }] }]}
                    source={require('../../../../assets/navigation/right-arrow.png')}
                />
            </TouchableOpacity>
            {
                isToggle ?
                    <View style={[styles.userProgressDetailsContainer, { paddingVertical: 20 }]}>
                        <View style={styles.statsContainer}>
                            <View style={styles.statBox}>
                                <Text style={styles.stat}><Text style={{ fontWeight: 'bold' }}>{Math.round(user.progress.formation_progress)}</Text>%</Text>
                                <Text style={styles.statText}>progression formation</Text>
                            </View>
                            <View style={[styles.statBox, { flex: 2 }]}>
                                <Text style={styles.stat}><Text style={{ fontWeight: 'bold' }}>{Math.round(user.progress.formation_logtime / 3600)}</Text>h</Text>
                                <Text style={[styles.stat, { fontSize: 17 }]}><Text style={{ fontWeight: 'bold' }}>{Math.round(user.progress.formation_logtime % 3600 / 60)}</Text>min</Text>
                                <Text style={styles.statText}>temps formation</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.stat}><Text style={{ fontWeight: 'bold' }}>{Math.round(user.progress.app_logtime / 3600)}</Text>h</Text>
                                <Text style={[styles.stat, { fontSize: 17 }]}><Text style={{ fontWeight: 'bold' }}>{Math.round(user.progress.app_logtime % 3600 / 60)}</Text>min</Text>
                                <Text style={styles.statText}>temps appli</Text>
                            </View>
                        </View>

                        <FlatList
                            data={userTrophy.data}
                            renderItem={(item) => <TrophyCard item={item.item} />}
                            keyExtractor={item => item.trophy.id_trophy}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={{ width: '90%', alignSelf: 'center', marginTop: 30 }}
                        />
                    </View>
                    : null
            }

        </View>
    )
}

const OfficeButton = ({ office }) => {
    const [isToggle, setIsToggle] = useState(false)
    const collaborators = useQuery(['fetchOfficeCollaboratorsProgress', office.id_office], () => getCollaboratorsProgression(office.id_office), {
        onError: (error) => {
            throw error
        },
        enabled: false,
        onSuccess: (data) => {
            console.log(data);
        }
    })

    useEffect(() => {
      if (isToggle) {
        collaborators.refetch()
      }
    }, [isToggle])
    

    return <View>
        <TouchableOpacity style={styles.progressButtonContainer}
            onPress={() => setIsToggle(!isToggle)}
        >
            <View style={styles.progressButton}>
                <Text style={styles.progressButtonText}>{office.name}</Text>
                <View style={styles.progressBar} >
                    <View style={[styles.formationProgress, { width: office.progress.formation_progress + '%' }]} />
                </View>
            </View>
            <Image
                style={[styles.progressButtonIcon, { transform: [{ rotate: isToggle ? '90deg' : '0deg' }] }]}
                source={require('../../../../assets/navigation/right-arrow.png')}
            />
        </TouchableOpacity>
        {isToggle ?
        <View style={{backgroundColor: '#ffffff'}}>
            {!collaborators.data ?
            <ActivityIndicator />
            : collaborators.data.map((value, index) => {
                return <UserProgressDetails user={value} />
            })
        }
        </View>
        : null
    }
    </View>

}

export const AccountOfficesProgress = ({ officeId, refreshing }) => {
    const office = useQuery('fetchOfficeProgress', () => getOfficesProgression(), {
        onError: (error) => {
            throw error
        }
    })

    useEffect(() => {
        if (refreshing) {
            collaborators.refetch()
            office.refetch()
        }
    }, [refreshing])

    if (!office.data) return null

    return (
        <View style={styles.container}>
            <View style={styles.displayContainer}>
                <Text style={[styles.sectionTitle, { color: '#fffefd' }]}>Mes collaborateurs</Text>

                {office.data.map((value, key) => {
                    return <OfficeButton office={value} key={key} />
                })}
            </View>
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F76F10',
        width: '100%',
        alignItems: 'center',
    },
    sectionTitle: {
        marginLeft: 10,
        alignSelf: 'flex-start',
        fontWeight: 'bold',
        fontSize: 20,
        marginVertical: 20,
        color: '#F76F10'
    },
    displayContainer: {
        width: '95%',
        paddingBottom: 20,
        marginVertical: 5
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
    progressButtonContainer: {
        backgroundColor: '#fffefd',
        width: '100%',
        marginVertical: 5,
        paddingVertical: 10,
        borderRadius: 5,
        flexDirection: 'row'
    },
    progressButton: {
        width: '80%',
        marginLeft: 20

    },
    progressButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    progressBar: {
        backgroundColor: '#ADADAD',
        height: 5,
        width: '100%',
        marginTop: 5
    },
    formationProgress: {
        backgroundColor: '#E75A08',
        height: '100%',

    },
    progressButtonIcon: {
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