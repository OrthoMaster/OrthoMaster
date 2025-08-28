import { StyleSheet } from "react-native";
const Colors = require('./Colors');
const Spacings = require('./Spacings');

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    fontFamily: 'Roboto'
  },
  
  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.gray
  },  
  seeAllButton: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: Colors.primary,
  },

  // Error
  errorMessageContainer: {
    backgroundColor: Colors.dangerBackground,
    borderWidth: 1,
    borderColor: Colors.danger,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Roboto'
  },

  // Button
  btnPrimary: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowColor: Colors.primary,
  },
  btnPrimaryText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  btnDisabled: {
    backgroundColor: Colors.disabledBackground,
    elevation: 0,
    shadowOpacity: 0,
  },
});

module.exports = Styles;
