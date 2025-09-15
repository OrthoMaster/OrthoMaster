import React from "react";
import { Image } from "react-native";


const ReturnButtonIcon = () => {
  return <Image
    source={require('../../../assets/navigation/right-arrow.png')}
    style={{
      backgroundColor: '#fff',
      padding: 5,
      borderRadius: 5,
      left: 10, top: 5, 
      shadowOffset: {width: 0, height: 0},
      shadowRadius: 3,
      shadowOpacity: 0.5,
      width: 30, height: 30,
      transform: [
        {rotateZ: "180deg"}
      ]
    }}
  />
  }

  export default ReturnButtonIcon