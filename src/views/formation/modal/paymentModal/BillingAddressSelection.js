import React, { useState } from "react";
import { TouchableOpacity, View, Text, ActivityIndicator, FlatList, ScrollView } from "react-native";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { getBillingAddress, setPersonnalBillingAddress } from "../../../../services/UserService";
import AntDesign from '@expo/vector-icons/AntDesign';
import { FormField } from "../../../../component/FormField";
import { getCountries } from "../../../../services/OfficeService";
import DropdownComponent from "../../../../component/DropdownComponent";

const AddBillingAddressForm = ({ onClose }) => {
    const countries = useQuery(["countries"], () => getCountries())
    const queryCli = useQueryClient()
    const saveAddress = useMutation(setPersonnalBillingAddress, {
        onSuccess: data => {
            onClose()
            queryCli.invalidateQueries("billing-address")
        }
    })
    const [formDatas, setFormDatas] = useState({
        street: "",
        zip: "",
        city: "",
        country: {
            id: 0,
            label: ""
        },
    })
    return <View>
        <Text style={{
            fontStyle: 'italic',
            fontSize: 15,
            marginVertical: 10,
            marginLeft: 10
        }}>Nouvelle adresse de facturation personnelle</Text>
        <FormField type={"text"} name={"Rue"} value={"street"}
            required={true}
            onChange={(val) => setFormDatas({ ...formDatas, street: val.text })}
        />
        <View style={{
            flexDirection: 'row',
            width: '100%'
        }}>
            <FormField type={"text"} name={"Code postal"} value={"zip"}
                required={true}
                onChange={(val) => setFormDatas({ ...formDatas, zip: val.text })}
                style={{ width: "30%" }}
            />
            <FormField type={"text"} name={"Ville"} value={"city"}
                required={true}
                onChange={(val) => setFormDatas({ ...formDatas, city: val.text })}
                style={{ flex: 1 }}
            />
        </View>
        <DropdownComponent
            required
            data={countries.data}
            label="Pays"
            searchEnabled={true}
            onChange={(val) => {
                setFormDatas({
                    ...formDatas,
                    country: {
                        id: val.value,
                        label: val.label
                    }
                })
            }} />

        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around'
        }}>
            <TouchableOpacity style={{
                width: '45%',
                backgroundColor: '#DEDEDE',
                alignSelf: 'center',
                borderRadius: 5,
                marginTop: 20,
                alignItems: 'center',
                paddingVertical: 10
            }}
                onPress={() => { onClose() }}
            >
                <Text style={{ color: '#000' }}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{
                width: '45%',
                backgroundColor: '#ffaf31',
                alignSelf: 'center',
                borderRadius: 5,
                marginTop: 20,
                alignItems: 'center',
                paddingVertical: 10
            }}
                onPress={() => {
                    saveAddress.mutate({
                        street: formDatas.street,
                        zip: formDatas.zip,
                        city: formDatas.city,
                        country: formDatas.country
                    })
                }}
            >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirmer</Text>
            </TouchableOpacity>
        </View>
    </View>
}

const BillingAddressCard = ({
    addressObject, isPerso, isPro, isSelected, onSelect
}) => {
    return <TouchableOpacity style={{
        backgroundColor: '#F1F1F1',
        alignSelf: "center",
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15, paddingVertical: 10,
        width: "90%",
        marginVertical: 10,
        borderRadius: 5,
        borderColor: '#ffaf31',
    }}
        onPress={() => {
            onSelect(addressObject)
        }}
    >
        <View style={{
            width: "60%"
        }}>
            <Text style={{ fontWeight: 'bold' }}>{addressObject.name}</Text>
            <Text>{addressObject.street}</Text>
            <Text>{addressObject.zip} {addressObject.city}</Text>
            <Text>{addressObject.country}</Text>
        </View>
        <View style={{ width: "20%" }}>
            {
                isPerso &&
                <Text style={{ color: 'gray' }}>{"perso"}</Text>
            }
            {
                isPro &&
                <Text style={{ color: 'gray' }}>{"pro"}</Text>
            }
        </View>
        <View style={{
            width: 15, height: 15,
            backgroundColor: '#fff',
            borderRadius: 50,
            borderColor: "#ffaf31",
            borderWidth: 1,
            alignItems: "center",
            justifyContent: 'center'
        }}>
            {
                isSelected &&
                <View style={{
                    width: 10, height: 10,
                    backgroundColor: '#ffaf31',
                    borderRadius: 50
                }} />
            }
        </View>
    </TouchableOpacity>
}

export default BillingAddressSelection = ({ onValidation }) => {
    const {
        data: billingAddress,
        isLoading, isFetching
    } = useQuery("billing-address", () => getBillingAddress())
    const [selectedAddress, setSelectedAddress] = useState(null)
    const [showAddBillingAddrForm, setShowAddBillingAddrForm] = useState(false)

    return <View style={{
        width: "100%", height: '100%',
        alignSelf: 'center',
    }}>
        <Text style={{
            fontStyle: 'italic',
            fontSize: 15,
            marginVertical: 10,
            marginLeft: 10
        }}>
            Séléctionnez une adresse de facturation
        </Text>

        {
            (isFetching || isLoading) &&
            <ActivityIndicator />
        }
        <ScrollView style={{}}>
            {
                billingAddress?.personnal &&
                <BillingAddressCard
                    addressObject={billingAddress.personnal}
                    isPerso={true}
                    onSelect={(addr) => {
                        setSelectedAddress(addr)
                    }}
                    isSelected={selectedAddress === billingAddress.personnal}
                />
            }

            {
                billingAddress?.offices?.length > 0 &&
                billingAddress.offices.map((value, index) => {
                    return <BillingAddressCard
                        addressObject={value} isPro={true}
                        onSelect={(addr) => {
                            setSelectedAddress(addr)
                        }}
                        isSelected={selectedAddress === value}
                        key={index}
                    />

                })
            }
        </ScrollView>


        {
            (billingAddress?.personnal == null && !isLoading) &&
            <View style={{
                alignItems: 'center',
                width: "60%",
                alignSelf: 'center'
            }}>
                <Text style={{ textAlign: 'center', marginBottom: 10 }}>Ajouter une adresse de facturation personnelle</Text>
                <TouchableOpacity
                    onPress={() => {
                        setShowAddBillingAddrForm(true)
                    }}
                >
                    <AntDesign name="pluscircle" size={24} color="#ffaf31" />
                </TouchableOpacity>
            </View>
        }

        {
            !isLoading &&
            < TouchableOpacity style={{
                padding: 10,
                backgroundColor: '#ffaf31',
                alignSelf: 'center',
                borderRadius: 5,
                marginTop: 20
            }}
                onPress={() => {
                    onValidation(selectedAddress)
                }}
            >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Continuer</Text>
            </TouchableOpacity>
        }

        {
            showAddBillingAddrForm &&
            <View style={{
                position: 'absolute',
                backgroundColor: "#fff",
                width: '100%', height: '100%'
            }}>
                <AddBillingAddressForm
                    onClose={() => {
                        setShowAddBillingAddrForm(false)
                    }}
                />
            </View>
        }

    </View >
}