import React, { useState } from "react";
import {
    SafeAreaView,
    Text,
    View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CreateOfficePage from "./pages/CreateOfficePage";
import AddMemberOfficePage from "./pages/AddMemberOfficePage";
import { useQueryClient } from "@tanstack/react-query";
import AskOfficeCreationPage from "./pages/AskOfficeCreationPage";

export const InitialConfigForm = ({ onFinish }) => {
    const [officeCreated, setOfficeCreated] = useState(null)
    const [pageIndex, setPageIndex] = useState(0)



    return <SafeAreaView style={{
        backgroundColor: "#fff",
        position: 'absolute',
        height: '100%', width: '100%'
    }}>

        {
            pageIndex == 0 &&
            <AskOfficeCreationPage
                onCreateOffice={() => {
                setPageIndex(1)
                }}
                onSkip={() => {
                    onFinish()
                }}
            />
        }

        {
            pageIndex == 1 &&
            <CreateOfficePage onFinish={(newOffice) => {
                setOfficeCreated(newOffice)
                setPageIndex(2)
            }} />
        }
        {
            (pageIndex == 2 && officeCreated) &&
            <AddMemberOfficePage onFinish={() => {
                onFinish()
            }}
                office={officeCreated}
            />
        }
    </SafeAreaView>
}