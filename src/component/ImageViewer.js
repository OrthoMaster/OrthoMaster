import React, { useState } from "react"
import { Dimensions, Modal, StyleSheet, StatusBar, Image, TouchableOpacity } from "react-native"
import ImageZoom from "react-native-image-pan-zoom"

export const ImageViewer = ({ url, visible, title, onClose }) => {
    const screenWidth = Dimensions.get("window").width
    const screenHeight = Dimensions.get("window").height
    const [imageSize, setImageSize] = useState({ width: screenWidth, height: screenWidth })


    return (
        <Modal visible={visible} onRequestClose={onClose} statusBarTranslucent animationType="slide">
            <StatusBar
                animated={true}
                backgroundColor="#000000"
                barStyle={'light-content'}
            />
            <ImageZoom
                style={styles.container}
                cropWidth={screenWidth}
                cropHeight={screenHeight}
                imageWidth={imageSize.width}
                imageHeight={imageSize.height}
                maxOverflow={0}
            >
                <Image
                    source={{
                        uri: url
                    }}
                    resizeMode="contain"
                    // loaderSize="large"
                    style={{
                        width: imageSize.width,
                        height: imageSize.height
                    }}
                />
            </ImageZoom>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
                <Image

                    source={require('../../assets/navigation/close.png')}
                    style={{ width: '50%', height: '50%', resizeMode: 'contain' }}
                />
            </TouchableOpacity>
        </Modal>
    )
}


const BG_COLOR = "rgba(0, 0, 0, 1)"
const TEXT_COLOR = "rgba(255, 255, 255, 1)"

const styles = StyleSheet.create({
    container: { backgroundColor: BG_COLOR },
    backButton: {
        width: 50,
        height: 50,
        position: 'absolute',
        top: '5%',
        alignItems: 'center', justifyContent: 'center',
        margin: 15
    },
    headerText: {
        color: TEXT_COLOR,
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        paddingLeft: 12,
        paddingRight: 6,
    },
})