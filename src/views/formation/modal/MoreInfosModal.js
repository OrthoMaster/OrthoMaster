import React from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity
} from "react-native";
import TextSectionOpener from "../../../component/TextSectionOpener";

export default MoreInfosModal = ({ formation, onClose }) => {

    return <View style={{
        alignItems: 'center',
        width: "100%", height: "100%",
    }}>
        <Text style={{
            fontWeight: 'bold',
            color: '#000'
        }}>{formation.formation_name}</Text>
        <ScrollView style={{ marginVertical: 10, paddingHorizontal: 10 }}
            persistentScrollbar={true}
        >
            <Text style={styles.paragraphe}>{formation.description}</Text>

            <TextSectionOpener title={"Objectifs de connaissances"} text={formation.learning_obj} />

            <TextSectionOpener title={"Objectifs de compétences"} text={formation.competencies_obj} />

            <TextSectionOpener title={"Formateur"} text={formation.trainer} />

            <TextSectionOpener title={"Public cible"} text={formation.public_desc} />

            <TextSectionOpener title={"Prérequis"} text={formation.requirements} />

            <TextSectionOpener title={"Organismes financeurs"} text={formation.organism} />

            <TextSectionOpener title={"Sommaire"} text={formation.learning_summary} />

        </ScrollView>
    </View>
}

const styles = StyleSheet.create({
    subtitle: {
        fontWeight: 'bold',
        fontSize: 14,
        color: "#000"
    },
    paragraphe: {
        fontSize: 12,
        color: '#000',
        marginBottom: 20
    },
    sectionContainer: {
        marginVertical: 10
    }
})