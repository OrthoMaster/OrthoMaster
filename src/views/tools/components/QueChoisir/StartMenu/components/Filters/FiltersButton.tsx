import React from "react";
import { TouchableOpacity, View, Text, ViewStyle } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FiltersButtonProps {
    nbFiltersSelected?: number;
    showFilters?: boolean;
    onPress?: () => void;
    style?: ViewStyle;
}

const FiltersButton: React.FC<FiltersButtonProps> = ({
    nbFiltersSelected,
    showFilters,
    onPress,
    style
}) => {
    return (<TouchableOpacity style={style ? style : {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 15,
        position: 'absolute',
        right: 5,
        top: 5,
        shadowOpacity: 0.25,
        shadowOffset: { width: 5, height: 5 },
        alignItems: 'center'
    }}
        onPress={() => onPress()}
    >
        {
            showFilters == true ?
                <Text style={{ fontWeight: 'bold', color: '#33C0B7', margin: 5 }}>Ok</Text>
                :
                <View style={{ alignItems: 'center' }}>
                    <Text style={{
                        color: "#33C0B7",
                        fontWeight: 'bold',
                        fontSize: 10
                    }}>Mes labos</Text>
                    <MaterialCommunityIcons name="format-list-numbered" size={20} color="#33C0B7" />
                    {
                        nbFiltersSelected > 0 &&
                        <View style={{
                            alignItems: 'center',
                            borderRadius: 100,
                            position: 'absolute',
                            width: 20, height: 20,
                            bottom: -15, right: -10,
                            justifyContent: 'center',
                            shadowOpacity: 0.25, shadowOffset: { width: 0, height: 0 }
                        }}>
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>✅</Text>
                        </View>
                    }
                </View>
        }
    </TouchableOpacity>);
}

export default FiltersButton;