import React, { useState } from "react";
import { TextInput, View, Text, StyleSheet } from "react-native";
import SelectDropdown from 'react-native-select-dropdown'


const DropDownField = ({ props }) => {
    const [alertError, setAlertError] = useState(false)
    return <SelectDropdown
        data={props.data}
        onSelect={(selectedItem, index) => {
            props.onChange({ text: selectedItem.value, value: props.value, target: props.target })
        }}
        buttonTextAfterSelection={(selectedItem, index) => {
            // text represented after item is selected
            // if data array is an array of objects then return selectedItem.property to render after item is selected
            return selectedItem.name
        }}
        rowTextForSelection={(item, index) => {
            // text represented for each item in dropdown
            // if data array is an array of objects then return item.property to represent item in dropdown
            return item.name
        }}
        onBlur={(data) => {
            if (props.required) {
                if (data == 'undefined') {
                    setAlertError(true)
                } else {
                    setAlertError(false)
                }
            }
        }}
        buttonStyle={{
            borderColor: alertError ? 'red' : '#828282',
            borderWidth: 0.5,
            borderRadius: 5,
            width: '100%',
            height: 40,
            marginTop: 5,
            backgroundColor: '#fff'
        }}
        buttonTextStyle={{
            fontSize: 13
        }}
        rowStyle={{
            backgroundColor: '#fff',
            height: 40,
            width: '100%',
            alignSelf: 'center'
        }}
        rowTextStyle={{
            fontSize: 12
        }}
        dropdownStyle={{
            backgroundColor: '#fff',
        }}
        defaultButtonText="Sélectionnez une option"
    />
}

const TextField = ({ props }) => {
    const [text, setText] = useState("")
    const [alertError, setAlertError] = useState('')

    const checkEmail = (text) => {
        let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
        if (reg.test(text) === false) {
            return false
        } else {
            return true
        }
    }

    return <View>
        <TextInput
            defaultValue={text}
            style={[{
                borderColor: alertError.length > 0 ? 'red' : '#828282',
                backgroundColor: '#fff'
            }, styles.field]}
            onChangeText={(text) => {
                props.onChange({ text, value: props.value, target: props.target })
                setText(text)
            }}
            onBlur={(event) => {
                if (props.required) {
                    if (event.nativeEvent.text.trim().length == 0) {
                        setAlertError('Ce champs ne peut pas être vide')
                        return
                    } else {
                        setAlertError('')
                    }
                }
                if (props.type == "email") {
                    if (checkEmail(event.nativeEvent.text) == false) {
                        setAlertError('Adresse email invalide')
                    } else {
                        setAlertError('')
                    }
                }
            }}
            inputMode={props.type}
            autoCapitalize={props.type == 'email' ? 'none' : 'sentences'}
            autoComplete="off"
            autoCorrect={props.type == 'email' ? false : true}
            secureTextEntry={props.password ? true : false}
            editable={props.isActive}
        />
        {
            alertError.length > 0 &&
            <Text style={{
                color: 'red',
                fontSize: 12,
                alignSelf: 'flex-end'
            }}>{alertError}</Text>
        }
    </View>


}


export const FormField = (props) => {


    const formType = (props) => {
        switch (props.type) {
            case 'text':
            case 'email':
            case 'tel':
                return <TextField props={props} />
            case 'dropdown':
                return <DropDownField props={props} />
            default:
                break;
        }
    }


    return <View style={[styles.container, props.style]}>
        <Text style={styles.fieldLabel}>{props.name}{props.required && '  *'}</Text>
        {formType(props)}
    </View>
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
        marginVertical: 5,
        marginHorizontal: 10
    },
    fieldLabel: {
        fontSize: 15
    },
    field: {
        borderWidth: 0.5,
        borderRadius: 5,
        height: 40,
        marginTop: 5,
        paddingLeft: 10
    }
})