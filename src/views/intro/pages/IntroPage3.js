import { useState } from "react"
import { Text, View, StyleSheet, TouchableOpacity } from "react-native"
import { FlipCard } from "../../../component/FlipCard"


export default IntroPage3 = () => {

    return <View style={{ flex: 1 }}>
        <FlipCard
            frontComponent={
                <View style={{  flex: 1, borderRadius: 20, backgroundColor: 'red' }}>
                    <Text>hello</Text>
                </View>
            }
            backComponent={
                <View style={{ backgroundColor: 'blue' }}>

                </View>
            }
        />
    </View>
}

const styles = StyleSheet.create({

})