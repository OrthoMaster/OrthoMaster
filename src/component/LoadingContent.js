import React from 'react'
import {
    View,
    Text,
    Dimensions,
    Image,
    TouchableOpacity
} from "react-native";


export const LoadingContent = ({state, onRetry}) => {

    return (
        <View style={{
            flex:1,
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <Image
                source={require('../../assets/logo.png')}
                style={{
                    width: state == 'error' ? 100 : 200,
                    height: state == 'error' ? 100 : 200,
                    resizeMode: 'contain'
            }}
            />
            <Text style={{
                fontWeight: '700',
                fontSize: 20,
                marginTop: 15
            }}>
                {
                    state == 'error'
                    ? "Une erreur est survenue"
                    : "Chargement ..."
                }
            </Text>

            {/* {
                state == 'error'
                && <TouchableOpacity style={{padding: 10, backgroundColor: 'orange'}}
                onPress={onRetry}
                >
                    <Text style={{color: '#ffffff', fontWeight: 'bold'}}>Rééssayer</Text>
                </TouchableOpacity>
            } */}
        </View>
    )
}