import React, { useState } from "react";
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthHome } from "./AuthHome";
import { LoginView } from "./LoginView";


export default AuthView = ({ asSignIn }) => {
    const [sliderPassed, setSliderPassed] = useState(false)
    return <SafeAreaView style={{ flex: 1 }}>
        {
            !sliderPassed &&
            <AuthHome onQuit={() => setSliderPassed(true)} />
        }
        {
            sliderPassed &&
            <LoginView asSignIn={() => {
                asSignIn()
            }} />
        }
    </SafeAreaView>
}