import Colors from "./Colors";
import Spacings from "./Spacings";
import { StyleSheet } from "react-native";

export const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    fontFamily: 'Roboto',
  },
  errorMessageContainer: {
    backgroundColor: Colors.dangerBackground,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.md,
    borderRadius: 8,
    marginBottom: Spacings.md,
    borderLeftWidth: 2,
    borderLeftColor: Colors.danger
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    lineHeight: 20,
    fontFamily: 'Roboto'
  },
  inputContainer: {
    marginBottom: Spacings.md,
  },
  textInput: {
    backgroundColor: Colors.grayLight,
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
    borderWidth: 1,
    borderColor: Colors.primary
  },
  btnPrimaryLight: {
    backgroundColor: Colors.primaryLight,
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
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },

  btnWhite: {
    backgroundColor: Colors.white,
    padding: Spacings.md,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowColor: Colors.grayLight,
    borderWidth: 1,
    borderColor: Colors.primary
  },
  btnWhiteText: {
    color: Colors.primary,
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  btnDisabled: {
    backgroundColor: Colors.disabledBackground,
    borderColor: Colors.disabledBackground,
    borderWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },

  btnBottom: {
    backgroundColor: Colors.primary,
    padding: Spacings.sm,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.primary
  },

  // Portal Dialog
  dialogContentTop: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    marginTop: Spacings.md,
    marginBottom: Spacings.sm
  },
  dialogText: {
    fontFamily: 'Roboto',
    color: Colors.gray,
    fontSize: 14,
    textAlign: 'center',
  },
  dialogSingleButton: {
    paddingHorizontal: Spacings.lg,
    borderRadius: 8,
    marginTop: Spacings.md,
  },
  dialogButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: Colors.white
  }
});
