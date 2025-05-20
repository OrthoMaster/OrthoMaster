import React, { useEffect } from "react";
import { Modal, Text, TouchableOpacity, View, StyleSheet, Dimensions } from "react-native";
import { constructVASTObjectWithUrlFromAdButler } from "../../../utils/vastParser";
import { IVASTObject } from "../../../utils/interfaces";

const { width: screenWidth, height } = Dimensions.get("screen")

type AdServingModalMediaAccessProps = {
    enabled: boolean
    onClose: () => void
}
export const AdServingModalMediaAccess: React.FC<AdServingModalMediaAccessProps> = ({ enabled, onClose }) => {

    //const vastClient = new VASTClient();
    const VAST_URL = "https://servedbyadbutler.com/vast.spark?setID=63510&ID=188636&pageid=123456&place=0&_abdk[Job Function]=pharmacien"
    const VAST_URL_2 = "https://servedbyadbutler.com/vast.spark?setID=63510&ID=188636&pageid=123456&place=1&_abdk[Job Function]=pharmacien"
    // const VAST_URL = 'https://statics.dmcdn.net/h/html/vast/simple-inline.xml';



    useEffect(() => {
        constructVASTObjectWithUrlFromAdButler(VAST_URL)
        .then((vastObject: IVASTObject) => {
        });
        
    }, [])

    return (
        <Modal animationType="slide"
            transparent={true}
            visible={enabled}
            onRequestClose={() => {
                onClose()
            }}>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
                <View style={{ width: "90%", backgroundColor: "white", borderRadius: 10, padding: 20 }}>
                    <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>Accès aux médias</Text>
                    <Text style={{ fontSize: 16, marginBottom: 20 }}>Afin de pouvoir accéder à ce contenu, veuillez séléctionnez une annonce à visionner.</Text>
                    <View style={{
                        display: "flex",
                        flexDirection: "row",
                        flexWrap: "wrap",
                        backgroundColor: 'red',
                        justifyContent: 'center',
                    }}>
                        <TouchableOpacity style={styles.buttonAdsContainer}></TouchableOpacity>
                        <TouchableOpacity style={styles.buttonAdsContainer}></TouchableOpacity>
                        <TouchableOpacity style={styles.buttonAdsContainer}></TouchableOpacity>
                    </View>
                    <TouchableOpacity style={{
                        backgroundColor: '#ffaf31',
                        alignSelf: 'center',
                        paddingVertical: 5, paddingHorizontal: 15,
                        borderRadius: 5,
                        marginTop: 20,
                    }} onPress={onClose}>
                        <Text style={{ fontSize: 16, color: "#fff", fontWeight: 'bold' }}>Annuler</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}



const styles = StyleSheet.create({
    buttonAdsContainer: {
        backgroundColor: "#007BFF",
        width: screenWidth / 3,
        height: (screenWidth / 3) * 9 / 16,
        margin: 5,
    }
})