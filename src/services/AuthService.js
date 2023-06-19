import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { restoreLocalConfigAsync } from "../utils";

class AuthService {

  async save(key, value) {
    await SecureStore.setItemAsync(key, value);
  }
  async login(username, password) {
    return axios
      .post(Constants.manifest.extra.env.API_URL + "/user/login", { username, password })
      .then((response) => {
        console.log(response.data.user);
        AsyncStorage.setItem('user', JSON.stringify(response.data.user), (error) => {
          if (error)
            throw error
        })
        this.save('JWT', response.data.token.jwt_token)
        this.save('refreshToken', response.data.token.refresh_token)
        return {code: 200, user: response.data.user};
      })
  }
  logout() {
    AsyncStorage.clear()
  }
  
  async checkUserConnection(token) {
    const authHeader = 'Bearer ' + token ;
    try {
      return await axios.get(Constants.manifest.extra.env.API_URL + '/connect', { headers: { Authorization: authHeader } });
    } catch (e) {
      throw e;
    }
  }

  async changePassword(credentials) {

    try {
      return await axios.post(Constants.manifest.extra.env.API_URL + '/user/edit/password', credentials);
    } catch (e) {
      throw e;
    }
  }

  async getNewToken() {
    const config = await restoreLocalConfigAsync()
    const refreshToken = await SecureStore.getItemAsync('refreshToken')
    return axios
      .post(Constants.manifest.extra.env.API_URL + "/user/token", { id_user: config.user.id_user, refresh_token: refreshToken })
      .then(async (response) => {
        if (response.data) {
          await SecureStore.setItemAsync('JWT', response.data.jwt_token)
          await SecureStore.setItemAsync('refreshToken', response.data.refresh_token)
          return true;
        } else {
          return false
        }
      })
  }
  
}
export default new AuthService();
