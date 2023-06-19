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
import { getCollaboratorsProgression, getOfficesProgressionForManager } from '../../../services/ProgressionService'


import { getUserTrophy } from '../../../services/TrophyService'
import { TrophyCard } from './trophies/TrophieCard'

const UserProgress = ({ user, refreshing }) => {
    const [isToggle, setIsToggle] = useState(false)
    const userTrophy = useQuery(['Account','GET','collaboratorTrophies', user.id_user], () => getUserTrophy(user.id_user), {
        enabled: false
    })

    useEffect(() => {
        if (refreshing) {
            userTrophy.refetch()
        }
    }, [refreshing])

    useEffect(() => {
        if (isToggle) {
            userTrophy.refetch()
        }
    }, [isToggle])


    return (
        <View style={styles.userProgressContainer}>
            <Text style={styles.progressButtonText}>{user.name + ' ' + user.lastname}</Text>

            <View style={[styles.userProgressContainer]}>
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

            </View>

            {
                isToggle ?
                    <FlatList
                        data={userTrophy.data}
                        renderItem={(item) => <TrophyCard item={item.item} />}
                        keyExtractor={item => item.trophy.id_trophy}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ width: '90%', alignSelf: 'center', marginTop: 30 }}
                    />
                    : null
            }

            <TouchableOpacity style={styles.trophiesTriggerContainer}
                onPress={() => setIsToggle(!isToggle)}
            >
                <Text style={styles.trophiesTriggerText}>
                    {isToggle ? 'Cacher les trophées' : 'Voir les trophées'}
                </Text>
            </TouchableOpacity>

        </View>
    )
}

const OfficeButton = ({ office }) => {
    const [isToggle, setIsToggle] = useState(false)
    const collaborators = useQuery(['Account','GET','officeCollaboratorsProgress', office.id_office], () => getCollaboratorsProgression(office.id_office), {
        enabled: false
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
                    <View style={[styles.formationProgress, { width: (office.progress.formation_progress || '0') + '%' }]} />
                </View>
            </View>
            <Image
                style={[styles.progressButtonIcon, { transform: [{ rotate: isToggle ? '90deg' : '0deg' }] }]}
                source={require('../../../../assets/navigation/right-arrow.png')}
            />
        </TouchableOpacity>
        {isToggle ?
            <View style={{ backgroundColor: '#ffffff' }}>
                {!collaborators.data ?
                    <ActivityIndicator />
                    : collaborators.data.map((value, index) => {
                        return <UserProgress user={value} key={index} />
                    })
                }
            </View>
            : null
        }
    </View>

}

export const AccountOfficesProgress = ({ managerId, refreshing, navigation }) => {
    const office = useQuery(['Account', 'GET', 'officeProgress'], () => getOfficesProgressionForManager(managerId))

    useEffect(() => {
        if (refreshing) {
            office.refetch()
        }
    }, [refreshing])

    if (!office.data || office.data.length == 0) return null

    return (
        <View style={styles.container}>
            <View style={styles.displayContainer}>
                <View style={styles.headerContainer}>
                    <Text style={[styles.sectionTitle, { color: '#fffefd' }]}>Mes collaborateurs</Text>
                    <TouchableOpacity style={styles.headerButton}
                    onPress={()=>{
                        navigation.push('account-team-manager', {
                            managerId: managerId
                        })
                    }}
                    >
                        <Text style={styles.headerButtonText}>Gérer ⚙️</Text>
                    </TouchableOpacity>
                </View>

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
    headerContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    headerButton: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5
    },
    headerButtonText: {
        fontWeight: 'bold',
        color: '#F76F10'
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
    userProgressContainer: {
        backgroundColor: '#fffefd',
        padding: 10
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
        textAlign: 'center'
    },
    trophiesTriggerContainer: {
        alignItems: 'center'
    },
    trophiesTriggerArrow: {
        width: 15,
        height: 15,
        tintColor: '#F76F10'
    },
    trophiesTriggerText: {
        color: '#F76F10',
        marginTop: 10,
        marginBottom: 20
    }
})