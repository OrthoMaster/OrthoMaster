import React from "react";
import { View, Text, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { GUIDES } from "./Guides";
import { Ionicons } from "@expo/vector-icons";
import Colors from '../../../../../constants/Colors';
import Spacings from '../../../../../constants/Spacings';


interface PrintViewProps {
  guideIndex?: number;
}

const PrintView: React.FC<PrintViewProps> = ({ guideIndex = 0 }) => {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Le modèle suivant permet d'imprimer vous-même des planches d'étiquettes. Êtes-vous sûrs d'avoir le bon format d'étiquettes vierges ? Si non, le bouton « panier » contient des liens vers des magasins / sites marchands proposant le bon format :</Text>
        <View style={styles.iconWrapper}>
          <Ionicons name="cart" size={30} color={Colors.primaryLight} />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            Linking.openURL(GUIDES[guideIndex].stickers_url)
          }}>
          <Text style={styles.buttonText}>Accéder au fichier</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          L'usage et la diffusion des étiquettes Guide Patient sont réservés aux clients OrthoMaster.
        </Text>
      </View>
    )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    width: '100%'
  },
  text: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.text,
  },
  iconWrapper: {
    backgroundColor: Colors.white,
    borderRadius: 100,
    alignSelf: 'center',
    marginBottom: Spacings.lg
  },
  button: {
    backgroundColor: Colors.primaryLight,
    alignSelf: 'center',
    paddingVertical: Spacings.xs,
    paddingHorizontal: Spacings.md,
    borderColor: Colors.primary,
    borderWidth: 2,
    borderRadius: 8,
    shadowOpacity: 0.4,
    shadowOffset: { width: 3, height: 3 },
    shadowColor: Colors.gray,
    marginVertical: 10,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.5
  },
  disclaimer: {
    fontSize: 11,
    color: Colors.subtext2,
    fontFamily: 'Roboto',
    fontStyle: 'italic',
    textAlign: 'center',
    alignSelf: 'center',
    marginTop: Spacings.xxs,
    letterSpacing: 0.2
  },
});

export default PrintView;