import React from "react";
import {
    Dimensions,
    Image,
    Text,
    View,
    StyleSheet,
    ScrollView
} from "react-native";

export const Page1 = () => {
    return (
        <View style={styles.container}>
            <Image
                source={require('../../../assets/logo-text.png')}
                style={{
                    width: '90%',
                    height: '20%',
                    resizeMode: 'contain'
                }}
            />

            <Image
                source={require('../../../assets/auth/formation.png')}
                style={{
                    width: '80%',
                    height: '20%',
                    resizeMode: 'contain',
                    marginVertical: 50
                }}
            />
            <ScrollView style={styles.containerScroll} contentContainerStyle={{alignItems: 'center'}}>
                <Text style={[styles.textSecondary, { marginTop: 40 }]}>
                    <Text>OrthoMaster est une solution digitale qui accompagne</Text>
                    <Text style={{ fontWeight: 'bold' }}> les professionels de santé</Text>
                    <Text> au quotidien pour développer leurs expertises.</Text>

                </Text>
            </ScrollView>

        </View>)
}

export const Page2 = () => {
    return (<View style={styles.container}>
        <ScrollView style={styles.containerScroll} contentContainerStyle={{alignItems: 'center'}}>
            <Text style={styles.textPrimary}>
                Se former
            </Text>
            <Text style={styles.textSecondary}>• un accès immédiat et à volonté aux connaissances essentielles en orthopédie </Text>
            <Text style={styles.textSecondary}>• des conseils à mettre en pratique dans le cadre de son activité</Text>
            <Text style={styles.textSecondary}>• un gain d'autonomie par rapport aux prescriptions "génériques" et aux laboratoires</Text>
            <Text style={styles.textSecondary}>• plus de confiance dans la prise en charge du patient</Text>

            <Text style={styles.textPrimary}>
                Informer son patient
            </Text>
            <Text style={styles.textSecondary}>• des outils pédagogiques pour rendre son expertise plus visible</Text>
            <Text style={styles.textSecondary}>• améliorer leur expérience du parcours de soin</Text>
            <Text style={styles.textSecondary}>• gagner en adhésion et en reconnaissance</Text>

        </ScrollView>
    </View>)
}

export const Page3 = () => {
    return (<View style={styles.container}>
        <ScrollView style={styles.containerScroll} contentContainerStyle={{alignItems: 'center'}}>
            <Text style={styles.textPrimary}>Le programme</Text>
            <Image
                source={require('../../../assets/auth/programme.png')}
                style={{
                    width: '70%',
                    height: '20%',
                    resizeMode: 'contain',
                    marginVertical: 50
                }}
            />
            <Text style={styles.textSecondary}>
                <Text style={{ fontWeight: 'bold' }}>8 heures</Text>
                <Text> de formation regroupées en</Text>
                <Text style={{ fontWeight: 'bold' }}> 50 module</Text>
                <Text> thématiques, destinés aux pharmaciens et préparateurs, sans prérequis de formation.</Text>


            </Text>

            <Text style={styles.textSecondary}>
                <Text style={{ fontWeight: 'bold' }}>240 leçon</Text>
                <Text> sur des sujets clairs et pratiques</Text>

            </Text>
            <Text style={styles.textSecondary}>Des centaines de vidéos, d'animations et de quiz pour apprendre de manière visuelle et ludique.</Text>

            <View style={{ height: 100 }} />

            <Text style={styles.textSecondary}>Pour en savoir plus, rendez-vous sur <Text style={{ fontWeight: 'bold' }}>orthomaster.fr</Text></Text>
            <View style={{ height: 200 }} />
        </ScrollView>
    </View>)
}


const styles = StyleSheet.create({
    container: {
        width: '90%',
        height: Dimensions.get('screen').height * 0.75,
        alignSelf: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    containerScroll: {
        alignSelf: 'center',
        width: '100%',
        height: '100%'
    },
    textPrimary: {
        fontSize: 25,
        fontWeight: 'bold',
        color: '#FFA500',
        marginVertical: 10
    },
    textSecondary: {
        fontSize: 18,
        width: '90%',
        alignSelf: 'center',
        marginVertical: 5,
        color: '#50515A',
        textAlign: 'center'
    }
})

const styles1 = StyleSheet.create({

})

const styles2 = StyleSheet.create({


})

const styles3 = StyleSheet.create({

})