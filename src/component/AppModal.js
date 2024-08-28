import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, Pressable, View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default AppModal = ({ isVisible, onClose, customRender, style, title, subtitle, text }) => {
    if (!isVisible)
        return null
    return (
        <View
            style={{
                backgroundColor: 'rgba(0,0,0,0.2)',
                position: 'absolute',
                height: Dimensions.get('screen').height,
                width: Dimensions.get('screen').width,
            }}
        >
            <View style={styles.centeredView}>
                <View style={[styles.modalView, style]}>
                    {
                        customRender ?
                            customRender
                            : <View>
                                {title && <Text style={styles.modalText}>{title}</Text>}
                                {subtitle && <Text style={styles.modalText}>{subtitle}</Text>}
                                {text && <Text style={styles.modalText}>{text}</Text>}

                            </View>
                    }
                    <TouchableOpacity
                        style={{
                            padding: 10,
                            position: 'absolute',
                            top: 0, left: 0
                        }}
                        onPress={() => {
                            onClose()
                        }}
                    >
                        <Ionicons name="close" size={24} color="black" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)'
    },
    modalView: {
        backgroundColor: 'white',
        borderRadius: 15,
        paddingTop: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
});