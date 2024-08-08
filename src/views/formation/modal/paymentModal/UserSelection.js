import React, { useEffect, useState } from "react";

import {
    View,
    Image,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    FlatList,
    Linking,
    ActivityIndicator
} from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { useMutation, useQuery } from "react-query";
import { getUsersByOfficeId } from "../../../../services/UserService";
import { buyFormationLicence } from "../../../../services/PaymentService";
import { useStore } from 'react-redux';

export default EspaceProUserSelection = ({espace}) => {

    const [selectedCollaborators, setSelectedCollaborators] = useState([])
    const store = useStore()
    const managerUser = store.getState().auth.userCurrentSession
    const officeUsers = useQuery(["GET", "USER", "OFFICE", managerUser.office_id], () => getUsersByOfficeId(managerUser.office_id))

    const addCollaborator = (id, completeName) => {
        if (selectedCollaborators.find(val => val.id == id))
            return
        setSelectedCollaborators([...selectedCollaborators, { id_user: id, complete_name: completeName }])
    }
    const removeCollaborator = (id) => {
        const newArray = selectedCollaborators.filter(val => val.id_user != id)
        setSelectedCollaborators(newArray)
    }
    const addAllCollaborator = () => {
        const newArray = []
        officeUsers.data.forEach(user => {
            newArray.push({ id_user: user.id_user, complete_name: user.name + " " + user.lastname })
        });

        setSelectedCollaborators(newArray)
    }
    const removeAllCollaborator = () => {
        setSelectedCollaborators([])
    }

    return <View style={{
        borderWidth: 1,
        borderRadius: 10,
        padding: 5,
        width: '90%',
        alignSelf: 'center'
    }}>
        <BouncyCheckbox
            size={20}
            fillColor="#ffaf31"
            unFillColor="#FFFFFF"
            text={"Tous"}
            textStyle={styles.checkBoxText}
            innerIconStyle={{ borderWidth: 2 }}
            style={{ marginVertical: 5 }}
            onPress={(isChecked) => {
                if (isChecked)
                    addAllCollaborator()
                else
                    removeAllCollaborator()
            }}
        />
        <View style={{ height: 0.2, width: '100%', backgroundColor: '#000', alignSelf: "center" }} />
        <FlatList
            data={officeUsers.data}
            keyExtractor={(item, index) => index}

            renderItem={(item) => <BouncyCheckbox
                size={20}
                fillColor="#ffaf31"
                unFillColor="#FFFFFF"
                textStyle={styles.checkBoxText}
                text={item.item.name + " " + item.item.lastname +
                    (managerUser.id_user == item.item.id_user ? " (vous)" : "")}
                innerIconStyle={{ borderWidth: 2 }}
                style={{ marginVertical: 5 }}
                isChecked={selectedCollaborators.find(user => user.id_user == item.item.id_user)}
                onPress={(isChecked) => {
                    if (isChecked)
                        addCollaborator(item.item.id_user, item.item.name + " " + item.item.lastname)
                    else
                        removeCollaborator(item.item.id_user)
                }}
            />}
        />
    </View>
}
const styles = StyleSheet.create({
    container: {
        height: "60%",
        width: Dimensions.get('screen').width * 0.9
    },
    checkBoxText: {
        textDecorationLine: 'none'
    }
})