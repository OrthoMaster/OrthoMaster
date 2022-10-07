import React from "react";
import {
    Dimensions,
    Image,
    Text,
    View,
    StyleSheet
} from "react-native";

export const Page1 = () => {
    return (<View style={styles.container}>
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

        <Text style={[styles.textSecondary, { marginTop: 40 }]}>
            <Text>OrthoMaster est une solution digitale reservée aux </Text>
            <Text style={{ fontWeight: 'bold' }}>professionels de santé.</Text>
        </Text>
        <Text style={styles.textSecondary}> OrthoMaster vous accompagne au quotidien pour développer votre expertise en orthopédie.</Text>


    </View>)
}

export const Page2 = () => {
    return (<View style={styles.container}>
        <Text style={styles.textPrimary}>
            Vous former
        </Text>
        <Text style={[styles.textSecondary, { fontSize: 15 }]}>• un accès immédiat et à volonté aux connaissances essentielles en orthopédie </Text>
        <Text style={[styles.textSecondary, { fontSize: 15 }]}>• des conseils à mettre en pratique dans le cadre de votre activité</Text>
        <Text style={[styles.textSecondary, { fontSize: 15 }]}>• un gain d'autonomie par rapport aux prescriptions "génériques" et aux laboratoires</Text>
        <Text style={[styles.textSecondary, { fontSize: 15 }]}>• plus de confiance dans la prise en charge du patient</Text>

        <Text style={[styles.textPrimary, { marginTop: 50 }]}>
            Informer vos patients
        </Text>
        <Text style={[styles.textSecondary, { fontSize: 15 }]}>• des outils pédagogiques pour rendre votre expertise plus visible</Text>
        <Text style={[styles.textSecondary, { fontSize: 15 }]}>• améliorer l'expérience du parcours de soin patient</Text>
        <Text style={[styles.textSecondary, { fontSize: 15 }]}>• gagner en adhésion et en reconnaissance</Text>

    </View>)
}

export const Page3 = () => {
    return (<View style={styles.container}>

        <Text style={[styles.textSecondary, { fontSize: 15, marginBottom: 20 }]}>
            Retrouvez dans une application les <Text style={{ color: '#E75A08' }}>ressources</Text> qu'il vous faut pour optimiser votre activité orthopédique:

        </Text>
        <Text style={[styles.textSecondary, { fontSize: 15}]}>• +250 vidéos de 2 minutes</Text>
        <Text style={[styles.textSecondary, { fontSize: 15}]}>• Supports pour vos patients</Text>
        <Text style={[styles.textSecondary, { fontSize: 15}]}>• Tests de produits</Text>
        <Text style={[styles.textSecondary, { fontSize: 15}]}>• Reportages, actualités, interviews</Text>

        <Text style={[styles.textSecondary, { fontSize: 15, marginTop: 40, marginBottom: 20 }]}>
            Restez en <Text style={{ color: '#E75A08' }}>contact</Text> avec les experts ORTHOMASTER via notre outil:
        </Text>
        <Text style={[styles.textSecondary, { fontSize: 15 }]}>• Question/Réponse interactif</Text>

        <Text style={[styles.textSecondary, { fontSize: 15, marginTop: 40 }]}>Et de venez membre du premier <Text style={{ color: '#E75A08' }}>réseau</Text> orthopédique multidisciplinaire.</Text>

        <Image
            source={require('../../../assets/auth/programme.png')}
            style={{
                width: '60%',
                height: '15%',
                resizeMode: 'contain',
                marginVertical: 50
            }}
        />
    </View>)
}


const styles = StyleSheet.create({
    container: {
        width: '90%',
        height: Dimensions.get('screen').height * 0.75,
        alignSelf: 'center',
        alignItems: 'center',
        paddingTop: 50
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