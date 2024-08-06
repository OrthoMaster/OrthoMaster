import React, { useState } from "react";
import {
    SafeAreaView,
    Text,
    View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CreateOfficePage from "./pages/CreateOfficePage";
import AddMemberEspaceProPage from "./pages/AddMemberEspaceProPage";
import CreateEspaceProPage from "./pages/CreateEspaceProPage";
import { useQueryClient } from "react-query";

export const InitialConfigForm = ({onFinish}) => {
    const [officeCreated, setOfficeCreated] = useState(null)
    const [espaceCreated, setEspaceCreated] = useState(null)
    const [pageIndex, setPageIndex] = useState(0)



    return <SafeAreaView style={{
        backgroundColor: "#fff",
        position: 'absolute',
        height: '100%', width: '100%'
    }}>
        {
            pageIndex == 0 &&
            <CreateOfficePage onFinish={(newOffice) => {
                setOfficeCreated(newOffice)
                setPageIndex(1)
            }} />
        }
        {
            (pageIndex == 1 && officeCreated) &&
            <CreateEspaceProPage onFinish={(newEspace) => {
                //console.log("NEW", newEspace);
                setEspaceCreated(newEspace)
                setPageIndex(2)
            }}
                office={officeCreated}
            />
        }
        {
            (pageIndex == 2 && espaceCreated) &&
            <AddMemberEspaceProPage onFinish={() => {
                setPageIndex(3)
                onFinish()
            }}
                espace={espaceCreated}
            />
        }
    </SafeAreaView>
}