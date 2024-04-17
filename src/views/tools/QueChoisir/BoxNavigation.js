import {
    View,
    TouchableOpacity,
    Text,
    Dimensions,
    Platform
} from "react-native"

const { width, height } = Dimensions.get('window')

import * as Device from 'expo-device';
import { Circle, Text as SvgText, TextPath, TSpan, G, Svg }
    from 'react-native-svg';

export const TreeType = {
    PATIENT: "patient",
    LOCALISATION: 'localisation',
    PATHOLOGIE: "pathologie"
}

export const BoxNavigation = ({
    currentNode,
    onSelect,
    isActive,
    history,
    textDictionary,
    treeContainerStyle,
    color = "#fff",
    textColorHistory = "#000",
    tree
}) => {
    const BOX_HEIGHT = treeContainerStyle.height ? treeContainerStyle.height : width
    const BOX_WIDTH = treeContainerStyle.width ? treeContainerStyle.width : width
    const BOX_ALIGN = treeContainerStyle.left ? (treeContainerStyle.left > 0 ? 'flex-end' : 'flex-start') : 'center'


    return <View style={[{
        height: BOX_HEIGHT,
        width: BOX_WIDTH,
        display: 'flex',
        justifyContent: 'center',
        alignItems: BOX_ALIGN,
        left: treeContainerStyle.left ? treeContainerStyle.left : 0
    }]}>
        <Svg position="absolute" height={"100%"} width={"100%"} style={{
        }}
            viewBox="0 0 300 300">
            <G id="circle">
                <Circle
                    r={150}
                    x={150}
                    y={150}
                    fill={color}
                    stroke="#000"
                    strokeWidth={0.1}
                    transform={tree == TreeType.LOCALISATION ? "rotate(225)" : "rotate(-45)"}
                />
            </G>
            <SvgText fill={textColorHistory} fontSize="10" >
                <TextPath href="#circle" startOffset={0} >

                    {
                        tree == TreeType.PATIENT ?
                        <TSpan x={"0"} dx={0} dy={10} >
                            {history.map((value, index) => {
                                return value + " | "
                            })}
                                </TSpan>
                            : <TSpan x={"0"} dx={0} dy={10}>
                                {history[history.length - 1]}
                            </TSpan>
                    }
                </TextPath>
            </SvgText>
        </Svg>
        <View style={{
            flex: 1,
            display: 'flex', flexDirection: 'row',
            width: (width / 2) + (treeContainerStyle.left ? Math.abs(treeContainerStyle.left) : 0),
            flexWrap: 'wrap',
            alignContent: 'center',
            justifyContent: treeContainerStyle.left ? (treeContainerStyle.left > 0 ? "flex-start" : "flex-end") : 'center',
        }}>
            {
                currentNode?.children?.map((value, index) => {
                    return <TouchableOpacity key={index} style={{
                        padding: 10,
                        margin: 7,
                        backgroundColor: '#FFAF31',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 15,
                        alignSelf: 'center'
                    }}
                        onPress={() => {
                            onSelect(currentNode, value)
                        }}
                    >
                        <Text style={{
                            fontSize: Device.deviceType == Device.DeviceType.TABLET ? 20 : 12
                        }}>{textDictionary[value.value]}</Text>
                    </TouchableOpacity>
                })
            }
        </View>
        {
            isActive == false &&
            <View style={{
                backgroundColor: '#000',
                position: 'absolute',
                height: "100%", width: "100%",
                opacity: 0.2
            }} />
        }

    </View>
}