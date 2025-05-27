
import {
    Dimensions,
    View,
    Text,
    TouchableWithoutFeedback,
    Image
} from "react-native";
import Animated, { useSharedValue, withTiming, runOnJS, Easing } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { getS3Image } from "../../../../../services/S3Service";
import { useOrthoMasterRoles } from "../../../../../hooks/useOrthoMasterRoles";

export const ProductCard = ({ product, onPress }) => {
    const imgUrl = useQuery({queryKey: ['Product', 'GET', "productImage", product.id], queryFn: () => getS3Image(product.image_path)})
    const containerSideSize = Dimensions.get('window').width * 0.45
    const height = useSharedValue(0);
    const { isTester } = useOrthoMasterRoles()

    const handleLongPress = (isPressed) => {
        if (isTester == false) // TODO à supprimer quand test fini
            return
        height.value = withTiming(isPressed ?
            height.value + (containerSideSize - height.value)
            : 0, {
            duration: 500,
            easing: Easing.linear
        }, (isEnded) => {
            if (onPress && isEnded && isPressed == true) {
                runOnJS(onPress)(product)
            }
        })
    }

    return (
        <View style={{
            margin: 5,
            width: containerSideSize,
            height: containerSideSize,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 20,
            shadowOpacity: 0.2,
            shadowOffset: {
                width: 0, height: 0
            }
        }}
        >
            <TouchableWithoutFeedback
                onPressIn={() => handleLongPress(true)}
                onPressOut={() => handleLongPress(false)}
            >

                <View style={{
                    width: '100%',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'center'
                }}>

                    <Animated.View
                        style={{
                            width: "100%",
                            height: height,
                            backgroundColor: '#D1FFFC',
                            position: 'absolute',
                            bottom: 0,
                            borderRadius: 20
                        }}
                    />
                    <View style={{ width: '100%' }}>
                        {
                            imgUrl.data ?
                                <Image source={{ uri: imgUrl.data }} style={{
                                    width: "80%",
                                    marginBottom: 10,
                                    resizeMode: "contain",
                                    height: 100,
                                    alignSelf: 'center',
                                }} />
                                : <View style={{ width: '80%', height: 100, backgroundColor: '#fff' }} />
                        }
                        <View style={{ position: 'absolute', right: 0, bottom: 0 }}>
                            {
                                product.more?.split(";").map((value, index) => {
                                    return <View
                                        key={index}
                                        style={{
                                            backgroundColor: '#33C0B7',
                                            paddingLeft: 5, paddingRight: 10,
                                            paddingVertical: 1,
                                            marginVertical: 1,
                                            alignSelf: 'flex-end',
                                            opacity: 0.9
                                        }}>
                                        <Text key={index} style={{ color: "#fff", fontSize: 8, fontWeight: 'bold' }}>{value}</Text>
                                    </View>
                                })
                            }
                            {/* <Text style={{ fontSize: 10, color: '#EC4E6E', width: '80%', textAlign: 'left' }}>{product.more}</Text> */}
                        </View>
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: 300, width: '80%', textAlign: 'left' }}>{product.type}</Text>
                    <Text style={{ fontSize: 12, fontWeight: 700, width: '80%', textAlign: 'left' }}>{product.model}</Text>
                    <Text style={{ fontSize: 10, fontWeight: 500, width: '80%', textAlign: 'left' }}>{product.option} <Text style={{ color: '#33C0B7' }}>{product.brand}</Text></Text>




                </View>
            </TouchableWithoutFeedback>
        </View>
    );
}
