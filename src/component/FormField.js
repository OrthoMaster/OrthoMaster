import React, { useState } from "react";
import { TextInput, View, Text, StyleSheet } from "react-native";
import SelectDropdown from 'react-native-select-dropdown'
import { AntDesign } from '@expo/vector-icons';

const DropDownField = ({ props }) => {
    const [alertError, setAlertError] = useState(false)
    return <SelectDropdown
        data={props.data}
        onSelect={(selectedItem, index) => {
            props.onChange({ text: selectedItem.value, value: props.value, target: props.target })
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
        renderButton={(selectedItem, isOpened) => {
            return (
                <View style={stylesDropdown.dropdownButtonStyle}>

                    <Text style={stylesDropdown.dropdownButtonTxtStyle}>
                        {(selectedItem && selectedItem.name) || 'Sélectionnez une option'}
                    </Text>
                    <AntDesign name={isOpened ? 'caretup' : 'caretdown'} size={15} color="black" />
                </View>
            );
        }}
        renderItem={(item, index, isSelected) => {
            return (
                <View style={{ ...stylesDropdown.dropdownItemStyle, ...(isSelected && { backgroundColor: '#D2D9DF' }) }}>
                    <Text style={stylesDropdown.dropdownItemTxtStyle}>{item.name}</Text>
                </View>
            );
        }}
        showsVerticalScrollIndicator={false}
        dropdownStyle={stylesDropdown.dropdownMenuStyle}
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
            }, styles.field, {
                height: 40 * (props.numberOfLines ? props.numberOfLines : 1)
            }]}
            onChangeText={(text) => {
                props.onChange({ text, value: props.value, target: props.target })
                setText(text)
            }}
            onBlur={(event) => {
                if (props.required) {
                    if (event.nativeEvent.text?.trim().length == 0) {
                        setAlertError('Ce champs ne peut pas être vide')
                        return
                    } else {
                        setAlertError('')
                    }
                }
                if (props.type == "email") {
                    if (checkEmail(text) == false) {
                        setAlertError('Adresse email invalide')
                    } else {
                        setAlertError('')
                    }
                }
            }}
            inputMode={props.type}
            placeholder={props.placeholder}
            autoCapitalize={'none'}
            autoComplete="off"
            autoCorrect={props.type == 'email' ? false : true}
            secureTextEntry={props.password ? true : false}
            editable={props.isActive}
            multiline={props.multiline ? props.multiline : false}
            numberOfLines={props.numberOfLines ? props.numberOfLines : 1}
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
        marginTop: 5,
        paddingLeft: 10
    }
})

const stylesDropdown = StyleSheet.create({
    dropdownButtonStyle: {
        width: 300,
        height: 30,
        backgroundColor: '#fff',
        borderRadius: 5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderColor: "#ffaf31",
        alignSelf: 'center',
        marginVertical: 10
    },
    dropdownButtonTxtStyle: {
        flex: 1,
        fontSize: 15,
        color: '#000',
    },
    dropdownButtonArrowStyle: {
        fontSize: 15,
    },
    dropdownButtonIconStyle: {
        fontSize: 28,
        marginRight: 8,
    },
    dropdownMenuStyle: {
        backgroundColor: '#E9ECEF',
        borderRadius: 8,
    },
    dropdownItemStyle: {
        width: '100%',
        flexDirection: 'row',
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        backgroundColor: '#fff',
        marginVertical: 2
    },
    dropdownItemTxtStyle: {
        flex: 1,
        fontSize: 15,
        color: '#000',
    },

});