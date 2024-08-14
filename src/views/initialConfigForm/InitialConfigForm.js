import React, { useState } from "react";
import {
    SafeAreaView,
    Text,
    View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CreateOfficePage from "./pages/CreateOfficePage";
import AddMemberOfficePage from "./pages/AddMemberOfficePage";
import { useQueryClient } from "react-query";

export const InitialConfigForm = ({onFinish}) => {
    const [officeCreated, setOfficeCreated] = useState(null)
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
            <AddMemberOfficePage onFinish={() => {
                setPageIndex(3)
                onFinish()
            }}
                office={officeCreated}
            />
        }
    </SafeAreaView>
}