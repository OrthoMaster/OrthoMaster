import Colors from "./Colors";
import Spacings from "./Spacings";
import { StyleSheet } from "react-native";

export const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    fontFamily: 'Roboto'
  },
  errorMessageContainer: {
    backgroundColor: Colors.dangerBackground,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.md,
    borderRadius: 8,
    marginBottom: Spacings.md,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Roboto'
  },
  inputContainer: {
    marginBottom: Spacings.md,
  },
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 8,
  },
  textInputContent: {
    fontSize: 16,
    fontFamily: 'Roboto',
    overflow: "hidden"
  },
  textInputOutline: {
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
  },
  fieldErrorText: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: Spacings.xs,
    marginLeft: Spacings.xs,
    fontFamily: 'Roboto'
  },

  // Button
  btnPrimary: {
    backgroundColor: Colors.primary,
    padding: Spacings.md,
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
