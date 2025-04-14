import React from "react";
import AntDesign from '@expo/vector-icons/AntDesign';


const ReturnButtonIcon = () => {
    return <AntDesign name="left" size={20} color="black" style={{
      backgroundColor: '#fff',
      padding: 5,
      borderRadius: 5,
      left: 10, top: 5, 
      shadowOffset: {width: 0, height: 0},
      shadowRadius: 3,
      shadowOpacity: 0.5,
      width: 30, height: 30
    }}/>
  }

  export default ReturnButtonIcon