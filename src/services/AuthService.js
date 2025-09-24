import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { restoreLocalConfigAsync } from "../futils";
import { osName } from 'expo-device';
import { Buffer } from "buffer";

const baseurl = process.env.EXPO_PUBLIC_API_URL

class AuthService {

  async login({email, password}) {
    return axios
      .post(baseurl + "/user/v3/login", { email, password }, {
        params: {
          platform: osName
        }
      })
      .then((response) => {
        return response.data;
      })
  }


  async logout() {
    AsyncStorage.clear()
    SecureStore.deleteItemAsync('JWT')
    SecureStore.deleteItemAsync('refreshToken')
  }

  async getNewToken() {
    const config = await restoreLocalConfigAsync()
    const refreshToken = await SecureStore.getItemAsync('refreshToken')
    const parts = config.JWT.split('.').map((part) => Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'),'base64').toString());
    const userId = JSON.parse(parts[1]).id_user;


    return axios
      .post(baseurl + "/user/token", { id_user: userId, refresh_token: refreshToken })
      .then(async (response) => {
        if (response.data) {
          await SecureStore.setItemAsync('JWT', response.data.jwt_token)
          await SecureStore.setItemAsync('refreshToken', response.data.refresh_token)
          return true;
        } else {
          return false
        }
      })
      .catch((e) => {
        if (e.response.status === 403) {
          return false
        }
      })
  }



}
export default new AuthService();
