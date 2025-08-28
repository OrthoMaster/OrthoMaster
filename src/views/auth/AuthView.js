import React, { useState } from "react";
import { SafeAreaView } from "react-native";
import { AuthHome } from "./AuthHome";
import { LoginView } from "./LoginView";

export default AuthView = ({ asSignIn }) => {
  const [sliderPassed, setSliderPassed] = useState(false)
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {
        sliderPassed
          ? <LoginView asSignIn={asSignIn} />
          : <AuthHome onQuit={() => setSliderPassed(true)} />
      }
    </SafeAreaView>
  );
}