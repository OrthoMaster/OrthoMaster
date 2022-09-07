import React, {useState, useEffect} from 'react'
import {
    View,
    Image,
    Text,
    TouchableOpacity,
    StyleSheet
} from 'react-native'


export const SearchFilterButton = ({ text, icon, onPress, value }) => {
    const [isActive, setisActive] = useState(false)

    let btn = null
    if (icon) {
        btn = <View style={{ flexDirection: 'row' }}>
            <Image
            source={require('../../../../assets/search/filter.png')}
            style={{marginHorizontal: 5}}
            />
            <Text
                style={[
                    styles.filterButtonText,
                    { color: isActive ? '#F45B11' : '#20123A' }
                ]}>
                Filtre
            </Text>
        </View >
    } else {
        btn = <Text
            style={[
                styles.filterButtonText,
                { color: isActive ? '#F45B11' : '#20123A' }
            ]}>
            {text}
        </Text>
    }

    return <TouchableOpacity
        style={[styles.filterButton, { backgroundColor: isActive ? '#FEF4EB' : '#F1F1F1' }]}
        onPress={()=>{
            setisActive(!isActive)
            onPress({
            filter: value,
            active: !isActive
        })
    }}
    >
        {btn}
    </TouchableOpacity>
}

const styles = StyleSheet.create({

    filterButton: {
        borderRadius: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
        marginHorizontal: 4,
        justifyContent: 'center',
        height: '100%'
    },
    filterButtonText: {
        fontWeight: '500',
        fontSize: 12,
    }
})