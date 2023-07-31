import React, { useState } from "react";
import { TextInput, View, Text, StyleSheet } from "react-native";
import SelectDropdown from 'react-native-select-dropdown'

const DropDownField = ({props}) => {
    const [alertRequired, setAlertRequired] = useState(false)

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
                setAlertRequired(true)
            } else {
                setAlertRequired(false)
            }
        }
    }}
    buttonStyle={{
        borderColor: alertRequired ? 'red' : '#828282',
        borderWidth: 0.5,
        borderRadius: 5,
        width: '100%',
        height: 40,
        marginTop: 5
    }}
    defaultButtonText="Sélectionnez une option"
/>
}

const TextField = ({ props }) => {
    const [text, setText] = useState("")
    const [alertRequired, setAlertRequired] = useState(false)

    const checkEmail = () => {
        console.log('checking');
    }

    return <TextInput
        defaultValue={text}
        style={[{
            borderColor: alertRequired ? 'red' : '#828282'
        }, styles.field]}
        onChangeText={(text) => {
            props.onChange({ text, value: props.value, target: props.target })
            setText(text)
        }}
        onBlur={(event) => {
            if (props.type == "email") {
                checkEmail()
            }
            if (props.required) {
                if (event.nativeEvent.text.trim().length == 0) {
                    setAlertRequired(true)
                } else {
                    setAlertRequired(false)
                }
            }
        }}
        inputMode={props.type}
        autoCapitalize={props.type == 'email' ? 'none' : 'sentences'}
        autoComplete="off"
        autoCorrect={props.type == 'email' ? false : true}
        secureTextEntry={props.password ? true : false}
    />

}


export const FormField = (props) => {


    const formType = (props) => {
        switch (props.type) {
            case 'text':
            case 'email':
            case 'tel':
                return <TextField props={props} />
            case 'dropdown':
                return <DropDownField props={props}/>
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
        backgroundColor: '#fff',
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