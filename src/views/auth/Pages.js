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
    return (<View style={styles.container}>
        <ScrollView contentContainerStyle={[styles.containerScroll, { alignItems: 'center' }]} style={{ width: '100%'}}>
            <Image
                source={require('../../../assets/logo-text.png')}
                style={{
                    width: '90%',
                    height: '30%',
                    resizeMode: 'contain',
                    marginBottom: 30,
                }}
            />

            <Image
                source={require('../../../assets/auth/client.jpeg')}
                style={{
                    width: '100%',
                    height: '30%',
                    resizeMode: 'contain',
                }}
            />

            <Text style={[styles.textSecondary, {marginBottom: 50, textAlign: 'center' }]}>
                <Text style={{ color: '#E05808' }}>OrthoMaster </Text>
                vous accompagne pour mieux prendre en charge vos patients en orthopédie.
            </Text>

            <Text style={[styles.textSecondary, { fontStyle: 'italic', fontSize: 15, textAlign: 'center' }]}>Application reservée aux professionnels de santé</Text>

        </ScrollView>

    </View>)
}

export const Page2 = () => {
    return (<View style={styles.container}>

        <ScrollView contentContainerStyle={styles.containerScroll} style={{ width: '100%' }}>

            <Image
                source={require('../../../assets/auth/app.png')}
                style={{
                    width: '100%',
                    height: '30%',
                    resizeMode: 'contain',
                    marginBottom: 20
                }}
            />

            <Text style={[styles.textSecondary, {marginBottom: 20}]}>
                Gagnez en qualité, efficacité et rentabilité grâce au premier <Text style={{color: '#E75A08'}}>assistant orthopédique</Text> que vous pouvez utiliser:
            </Text>



            <Text style={[styles.textSecondary, {marginLeft: 30}]}><Text style={{color: '#E75A08'}}>•</Text> à tout moment</Text>
            <Text style={[styles.textSecondary, {marginLeft: 30}]}><Text style={{color: '#E75A08'}}>•</Text> rapidement</Text>
            <Text style={[styles.textSecondary, {marginLeft: 30}]}><Text style={{color: '#E75A08'}}>•</Text> sans limite</Text>
            <Text style={[styles.textSecondary, {marginLeft: 30}]}><Text style={{color: '#E75A08'}}>•</Text> pour toutes les équipes</Text>


            <Text style={[styles.textSecondary, { marginTop: 20 }]}>
                Gagnez en confiance et en autonomie dans la prise en charge de vos patients grâce à une solution indépendante et experte.
            </Text>

        </ScrollView>
    </View>)
}

export const Page3 = () => {
    return (<View style={styles.container}>

        <ScrollView contentContainerStyle={{ alignItems: 'center' }} style={{ width: '100%', marginTop: 30 }}>
            <Text style={[styles.textSecondary, { fontSize: 18, fontWeight: 'bold' }]}>
                Optimisez votre activité !
            </Text>
            <Text style={[styles.textSecondary, {marginBottom: 10}]}>
                retrouvez dans une seule application les <Text style={{color: '#E75A08'}}>ressources</Text> qu'il vous faut au quotidien:
            </Text>
            <Text style={[styles.textSecondary, { marginLeft: 30}]}><Text style={{color: '#E75A08'}}>•</Text> +250 vidéos courtes</Text>
            <Text style={[styles.textSecondary, { marginLeft: 30}]}><Text style={{color: '#E75A08'}}>•</Text> Supports pédagogiques pour vos patients</Text>
            <Text style={[styles.textSecondary, { marginLeft: 30}]}><Text style={{color: '#E75A08'}}>•</Text> Tests de produits</Text>
            <Text style={[styles.textSecondary, { marginLeft: 30}]}><Text style={{color: '#E75A08'}}>•</Text> Reportages, actualités, interviews</Text>

            <Text style={[styles.textSecondary, { fontSize: 18, marginTop: 40, fontWeight: 'bold' }]}>
                Une difficulté ? une question ?
            </Text>
            <Text style={[styles.textSecondary]}>les experts ORTHOMASTER vous accompagnent de manière <Text style={{color: '#E75A08'}}>interactive</Text> .</Text>

            <Text style={[styles.textSecondary, { fontSize: 18, marginTop: 40, fontWeight: 'bold' }]}>Affichez votre expertise</Text>
            <Text style={[styles.textSecondary, {}]}>en devenant membre du premier <Text style={{color: '#E75A08'}}>réseau orthopédique</Text> multidisciplinaire.</Text>

            <Text style={[styles.textSecondary, { marginTop: 50, fontSize: 15 }]}>Pour en savoir plus, rendez vous sur: <Text style={{color: '#E75A08'}}>www.orthomaster.fr</Text></Text>
        </ScrollView>
    </View>)
}


const styles = StyleSheet.create({
    container: {
        width: '90%',
        height: Dimensions.get('screen').height * 0.75,
        alignSelf: 'center',
        //alignItems: 'center',
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
        color: '#E75A08',
        marginVertical: 10
    },
    textSecondary: {
        fontSize: 15,
        width: '90%',
        alignSelf: 'center',
        color: '#50515A',
        textAlign: 'left'
    }
})

const styles1 = StyleSheet.create({

})

const styles2 = StyleSheet.create({


})

const styles3 = StyleSheet.create({

})
