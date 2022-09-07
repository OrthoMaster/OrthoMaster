import { resizeMode } from 'deprecated-react-native-prop-types/DeprecatedImagePropType';
import React from 'react'
import {
    SafeAreaView,
    Text,
    Dimensions,
    Image
} from "react-native";


export const LoadingView = () => {
    return (
        <SafeAreaView style={{
            flex:1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#FFFEFD'
        }}>
            <Image
                source={require('../../assets/logo.png')}
                style={{
                    width: 250,
                    height: 250,
                    resizeMode: 'contain'
            }}
            />
            <Text style={{
                fontWeight: '700',
                fontSize: 20
            }}>
                Chargement ...
            </Text>
        </SafeAreaView>
    )
}