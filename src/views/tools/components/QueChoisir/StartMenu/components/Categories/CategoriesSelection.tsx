import React from "react";
import { FlatList, Text, TouchableOpacity, View, StyleSheet, Image } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getQCcategories } from "../../../../../../../services/tools/QueChoisirService";
import { getCdnContentAccessUrl } from "../../../../../../../services/ContentService";


type IconProps = {
    logo?: string;
    name: string;
    onPress: (category: string) => void;
}
const Icon: React.FC<IconProps> = ({ logo, name, onPress }) => {
    const logoUrl = useQuery({
        queryKey: ['logo', name],
        queryFn: () => getCdnContentAccessUrl(logo),
        enabled: !!logo
    })

    return (
        <TouchableOpacity
            onPress={() => onPress(name)}
            style={{
                alignItems: 'center',
                justifyContent: 'flex-start',
                width: 120, height: 120,
            }}
        >
            {
                (logoUrl.isLoading == false && logoUrl.isSuccess && logoUrl.data) ?
                    <Image
                        source={{ uri: logoUrl.data }}
                        style={{
                            width: 90, height: 90,
                            borderRadius: 10,
                            resizeMode: 'contain',
                        }}
                    />
                    :
                    <View style={styles.containerButtons}></View>
            }
            <Text style={styles.toolButtonText}>{name}</Text>
        </TouchableOpacity>
    )
}

type CategoriesSelectionProps = {
    onSelect?: (category: string) => void;
}
const CategoriesSelection: React.FC<CategoriesSelectionProps> = ({ onSelect }) => {
    const qcCategories = useQuery({queryKey: ['Tools', 'GET', 'QC categories'], queryFn: () => getQCcategories()})



    return (<View style={{
        width: "100%",
        paddingVertical: 30,
        alignItems: 'center',
    }}>
        <FlatList
            data={qcCategories.data}
            keyExtractor={(item) => item.id}
            renderItem={(item) => (<Icon
                name={item.item.name}
                onPress={(category) => {
                    onSelect(category)
                }}
                logo={item.item.logo}
            />)
            }
            scrollEnabled={true}
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
        backgroundColor: '#999999',
        width: 65, height: 65,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toolButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        width: '90%',
        textAlign: 'center',
        marginTop: 5,
    },
    toolButtonIcon: {
        width: 15,
        height: 15,
        tintColor: '#EC4C70'
    }

})

