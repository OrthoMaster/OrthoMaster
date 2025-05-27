import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, FlatList, Platform, ScrollView } from "react-native";

import { AntDesign } from '@expo/vector-icons';

const  FiltersQC = ({ onChange, filterConfig }) => {

    const [selection, setSelection] = useState([])
    const [filtredBrands, setFiltredBrands] = useState(filterConfig.selected)
    const [isDefault, setIsDefault] = useState(true)


    useEffect(() => {
        if (filterConfig.default) {
            let purgedList = filterConfig.default
            purgedList = purgedList.filter(x => !filtredBrands.includes(x));
            setSelection(purgedList)
        }
    }, [])


    useEffect(() => {
        if (filtredBrands.length < 1) {
            setIsDefault(true)
        } else {
            setIsDefault(false)
        }
    }, [selection])

    useEffect(() => {
        onChange(filtredBrands)
    }, [filtredBrands])



    const renderItem = ({ item, index }) => {

        return <View
            style={{
                backgroundColor: "#F1F1F1",
                margin: 5,
                alignItems: 'center',
                width: '90%',
                alignSelf: 'center',
                paddingHorizontal: 10,
                borderRadius: 5,
                shadowOpacity: 0.25,
                shadowOffset: { width: 2, height: 2 },
                flexDirection: 'row',
                justifyContent: 'space-between',
            }}
        >
            <Text style={{ color: '#D0D0D0', fontSize: 25, fontWeight: 'bold' }}>{index + 1}</Text>
            <Text style={{}}>{item}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                <TouchableOpacity
                    style={{ padding: 5 }}
                    onPress={() => {
                        if (index === filtredBrands.length - 1) return;
                        let flt = [...filtredBrands]
                        var element = flt[index];
                        flt.splice(index, 1);
                        flt.splice(index + 1, 0, element);
                        setFiltredBrands(flt)
                    }}
                >
                    <AntDesign name="caretdown" size={15} color="gray" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={{ padding: 5 }}
                    onPress={() => {
                        if (index === 0) return;
                        let flt = [...filtredBrands]
                        var element = flt[index];
                        flt.splice(index, 1);
                        flt.splice(index - 1, 0, element);
                        setFiltredBrands(flt)
                    }}
                >
                    <AntDesign name="caretup" size={15} color="gray" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={{ padding: 10 }}
                    onPress={() => {
                        setFiltredBrands(filtredBrands.filter(elem => elem !== item))
                        setSelection([...selection, item])
                    }}
                >
                    <AntDesign name="minuscircle" size={15} color="#33C0B7" />
                </TouchableOpacity>
            </View>
        </View>

    }


    return <View style={{
        backgroundColor: '#fff',
        width: "95%", height: '90%',
        marginVertical: 50,
        paddingHorizontal: 10,
        paddingVertical: 20,
        borderRadius: 5
    }}>
        <ScrollView>

            <Text style={{
                alignSelf: 'center',
                textAlign: 'center',
                fontSize: 15,
                fontWeight: '500',
                marginBottom: 20
            }}>
                Filtrez les marques selon vos préférences
            </Text>

            <View style={{
                backgroundColor: '#33C0B7',
                width: '40%',
                alignSelf: 'center',
                paddingTop: 10,
                paddingBottom: 5,
                paddingHorizontal: 10,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 10,
                borderColor: "#fff",
                alignItems: 'center'
            }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Sélection</Text>
            </View>

            <View style={{
                width: '90%',
                alignSelf: 'center',
                paddingVertical: 10,
                borderColor: '#33C0B7',
                borderWidth: 5,
                borderRadius: 15,
                marginBottom: 10,
            }}>
                <Text style={{
                    alignSelf: 'center',
                    textAlign: 'center',
                    fontSize: 15,
                    fontStyle: 'italic',
                    color: 'grey'
                }}>
                    {isDefault ? "Par défaut, les marques s'afficheront par ordre alphabétique"
                        : ""}
                </Text>


                <FlatList
                    data={filtredBrands}
                    // onDragEnd={({ data }) => setFiltredBrands(data)}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderItem}
                    scrollEnabled={false}
                />

            </View>

            {
                !isDefault &&
                <Text style={{
                    alignSelf: 'center',
                    textAlign: 'center',
                    fontStyle: 'italic',
                    color: 'grey',
                    width: '80%',
                    fontSize: 12
                }}>
                    Les marques non-sélectionnées s'affichent par ordre alphabétique
                </Text>
            }
            <View style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginTop: 30,
            }}>
                {
                    selection.map((value, index) => {
                        return <TouchableOpacity key={index} style={{
                            backgroundColor: "#F1F1F1",
                            margin: 5,
                            alignItems: 'center',
                            alignSelf: 'center',
                            paddingVertical: 5,
                            paddingHorizontal: 5,
                            borderRadius: 5,
                            shadowOpacity: 0.25,
                            shadowOffset: { width: 2, height: 2 },
                            flexDirection: 'row',
                        }}
                            onPress={() => {
                                setSelection(selection.filter(item => item !== value))
                                setFiltredBrands([...filtredBrands, value])
                            }}
                        >
                            <Text style={{ marginHorizontal: 5 }}>{value}</Text>

                            <AntDesign name="pluscircle" size={15} color="#33C0B7" />
                        </TouchableOpacity>
                    })
                }
            </View>
        </ScrollView>
    </View>
}

export default FiltersQC;