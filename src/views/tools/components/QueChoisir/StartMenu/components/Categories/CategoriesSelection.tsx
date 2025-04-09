import React from "react";
import { FlatList, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { useQuery } from "react-query";
import { getQCcategories } from "../../../../../../../services/tools/QueChoisirService";

type CategoriesSelectionProps = {
    onSelect?: (category: string) => void;
}

const CategoriesSelection: React.FC<CategoriesSelectionProps> = ({ onSelect }) => {
    const qcCategories = useQuery(['Tools', 'GET', 'QC categories'], () => getQCcategories())

    return (<View style={{
        width: "100%",
        paddingVertical: 30,
        alignItems: 'center',
    }}>
        <FlatList
            data={qcCategories.data}
            keyExtractor={(item) => item.id}
            renderItem={(item) => (<TouchableOpacity
                onPress={() => onSelect(item.item.name)}
            >
                <View style={styles.containerButtons}></View>
                <Text style={styles.toolButtonText}>{item.item.name}</Text>
            </TouchableOpacity>)
            }
            scrollEnabled={false}
            numColumns={2}
            columnWrapperStyle={{
                flex: 1,
                justifyContent: 'space-evenly',
                paddingVertical: 10
            }}
            style={{ width: '70%' }}
        />
    </View>);
}
export default CategoriesSelection;

const styles = StyleSheet.create({

    toolTitle: {
        color: '#ffffff',
        fontSize: 25,
        fontWeight: 'bold',
        marginVertical: 20
    },
    containerButtons: {
        backgroundColor: '#F97302',
        width: 50, height: 50,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toolButtonText: {
        fontSize: 12,
        color: '#fff',
        width: '90%',
        textAlign: 'center'
    },
    toolButtonIcon: {
        width: 15,
        height: 15,
        tintColor: '#EC4C70'
    }

})

