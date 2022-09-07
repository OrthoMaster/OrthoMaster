import React, { useState, useEffect } from 'react'
import {Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions
} from 'react-native'

export default function QuizSuccessModal({
  value,
  onExit
}) {
  const [modalVisible, setModalVisible] = useState(true);

  return <Modal
    animationType="fade"
    transparent={true}
    visible={modalVisible}
    onRequestClose={() => {
      setModalVisible(false);
    }}
    style={{flex: 1}}
  >
    <View style={styles.container}>
      <View style={styles.modalView}>
        <Text style={[styles.modalPrimaryText, {marginTop: 50}]}>Bravo !</Text>
        <Text style={[styles.modalSecondaryText, {marginTop: 40}]}>{value}</Text>
        <TouchableOpacity
          style={[styles.button, {marginTop: 40}]}
          onPress={() => {
            setModalVisible(false)
            if (modalVisible) {
              onExit()
            }
          }}
        >
          <Text style={styles.buttonText}>Continuer</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#F7700B",
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 5,
    width: Dimensions.get('screen').width / 1.1,
    height: Dimensions.get('screen').width / 1.1,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    width: '70%',
    height: '15%',
    borderColor: '#fffefd',
    borderWidth: 2,
    backgroundColor: "#F7700B",
    justifyContent:'center',
    marginVertical: 5,
    
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 15
  },
  modalPrimaryText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSecondaryText: {
    textAlign: "left",
    fontSize: 15,
    width:'85%'
  }
});