import React, { useState, useEffect } from "react";

import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView
} from "react-native";

import { FormField } from "../../../../component/FormField";
import { useQuery } from "react-query";
import DropdownComponent from "../../../../component/DropdownComponent";
import { getJobsFunction } from "../../../../services/UserService";

export default AskSponsoredFormationForm = ({ onSubmit }) => {
    const { data: jobFunctions } = useQuery('jobs-functions', () => getJobsFunction())
    const [addUserIsOpen, setAddUserIsOpen] = useState(false)
    const [formDatas, setFormDatas] = useState({
        tel: "",
        moment: "",
        organisme: {}
    })

    const ContactForm = ({ onSubmit, onClose }) => {
        const [contactObject, setContactObject] = useState({
            name: "",
            jobFunction: "",
            organisme: ""
        })


        return <View>
            <FormField name={'Nom prénom'} value={'name'} target={"name"} type={'text'} onChange={(val) => {
                setContactObject({ ...contactObject, name: val.text })
            }} required />
            <DropdownComponent
                required
                data={jobFunctions}
                label="Fonction professionnelle"
                searchEnabled={true}
                onChange={(val) => {
                    setContactObject({ ...contactObject, jobFunction: val.label })

                }} />
            <DropdownComponent
                required
                data={[
                    { label: "OPCO-EP", value: "opco-ep" },
                    { label: "FIF-PL", value: "fif-pl" },
                    { label: "FAF-PM", value: "faf-pm" },
                    { label: "OPCO SANTE", value: "opco-sante" },
                    { label: "ANFH", value: "anfh" },
                    { label: "FPH (Suisse)", value: "fph" },
                    { label: "Je ne sais pas", value: "autre" },
                ]}
                label="Organisme financeur"
                searchEnabled={false}
                onChange={(val) => {
                    setContactObject({ ...contactObject, organisme: val.label, organisme_value: val.value })
                }} />
            <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                marginVertical: 20
            }}>
                <TouchableOpacity style={{
                    padding: 10, backgroundColor: '#ffaf31', borderRadius: 5,
                    alignSelf: 'center'
                }}
                    onPress={() => {
                        if (contactObject.name.length > 0 && contactObject.organisme.length > 0 && contactObject.jobFunction.length > 0)
                            onSubmit(contactObject)
                    }}
                >
                    <Text>Confirmer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{
                    padding: 10, backgroundColor: '#F1F1F1', borderRadius: 5,
                    alignSelf: 'center'
                }}
                    onPress={() => {
                        setAddUserIsOpen(!addUserIsOpen)
                    }}
                >
                    <Text>{"Annuler"}</Text>
                </TouchableOpacity>
            </View>

        </View>
    }

    return <View style={{
        flex: 1
    }}>

        <ScrollView>

            <Text>Veuillez me contacter pour établir les dossiers ensemble :</Text>
            <FormField name={'N° de téléphone pour me joindre'} value={'tel'} target={"test"} type={'text'} onChange={(val) => {
                setFormDatas({ ...formDatas, tel: val.text })
            }} required />
            <FormField name={'Moment idéal pour me joindre'} value={'moment'} target={"moment"} type={'text'} onChange={(val) => {
                setFormDatas({ ...formDatas, moment: val.text })
            }} required
                multiline={true}
                numberOfLines={2}
            />

            <Text>Liste des bénéficiaires :</Text>

            {
                Object.entries(formDatas.organisme).map((value, index) => {
                    if (Array.isArray(value[1]))
                        return <View key={index}>
                            {
                                value[1].map((user, index) => {
                                    return <View key={index} style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginVertical: 2,
                                        justifyContent: 'space-around'
                                    }}>
                                        <Text style={{ fontWeight: 'bold', flex: 1 }}>{user.name}</Text>
                                        <Text style={{ flex: 1 }}>{user.jobFunction}</Text>
                                        <Text style={{ flex: 1 }}>{user.organisme}</Text>
                                    </View>
                                })
                            }

                        </View>

                })
            }

            {
                addUserIsOpen &&
                <ContactForm onSubmit={(data) => {

                    const formDataOrganisme = formDatas.organisme[data.organisme_value]

                    if (formDataOrganisme) {
                        setFormDatas({
                            ...formDatas,
                            organisme: {
                                ...formDatas.organisme,
                                [data.organisme_value]: [...formDatas.organisme[data.organisme_value], data]
                            }
                        })
                    } else {
                        setFormDatas({
                            ...formDatas,
                            organisme: {
                                ...formDatas.organisme,
                                [data.organisme_value]: [data]
                            }
                        })
                    }



                    setAddUserIsOpen(false)

                }} />
            }

            {
                !addUserIsOpen &&
                <TouchableOpacity style={{
                    padding: 10, backgroundColor: '#F1F1F1', borderRadius: 5,
                    alignSelf: 'center'
                }}
                    onPress={() => {
                        setAddUserIsOpen(!addUserIsOpen)
                    }}
                >
                    <Text>{"Ajouter un dossier"}</Text>
                </TouchableOpacity>}

        </ScrollView>

        <TouchableOpacity style={{
            padding: 10, backgroundColor: (addUserIsOpen  || (formDatas.moment.length == 0 && formDatas.tel.length == 0)) ? "#F1F1F1" : '#ffaf31',
            borderRadius: 5,
            alignSelf: 'center', width: '90%',
            marginBottom: 10, alignItems: 'center'
        }}
            onPress={() => {
                if (!addUserIsOpen && formDatas.moment.length > 0 && formDatas.tel.length > 0)
                    onSubmit(formDatas)
            }}
        >
            <Text>Envoyer ma demande</Text>
        </TouchableOpacity>
    </View>
}