import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { restoreLocalConfigAsync } from "../utils";
import { osName } from 'expo-device';
import { Buffer } from "buffer";

const baseurl = process.env.EXPO_PUBLIC_API_URL

class AuthService {

  async login(username, password) {
    return axios
      .post(baseurl + "/user/v2/login", { username, password }, {
        params: {
          platform: osName
        }
      })
      .then((response) => {
        return response.data;
      })
  }


  logout() {
    AsyncStorage.clear()
    SecureStore.deleteItemAsync('JWT')
    SecureStore.deleteItemAsync('refreshToken')
  }

  async checkUserConnection(token) {

    const authHeader = 'Bearer ' + token;
    const res = await axios.get(baseurl + '/connect', { headers: { Authorization: authHeader } });
    return res
  }

  async changePassword(credentials) {

    try {
      return await axios.post(baseurl + '/user/edit/password', credentials);
    } catch (e) {
      throw e;
    }
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

  async registerNewCompanyAndUser(data) {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;
    return axios
      .post(baseurl + "/v2/registration", data, { headers: { Authorization: authHeader } })
  }

  async sendSubscriptionLinkByEmail(body) {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;

    return axios
      .post(baseurl + "/v2/registration/mailing", body, { headers: { Authorization: authHeader } })
  }

  async activateUser(body) {
    return axios
      .post(baseurl + '/v2/registration/activate',
        {
          username: body.username,
          password: body.password,
          user_id: body.user_id
        }, {
        headers: {
          "invitation-token": body.token
        }
      })
  }

  async inviteUser(data) {

    return axios
      .post(baseurl + '/v2/registration/register-contact?type=' + data.mode,
        data.body,
        {
          headers: {
          "invitation-token": data.token
          }
        })
  }

  async getFormSubscriptions() {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;

    return axios.get(baseurl + '/v2/subscription/get-products', { headers: { Authorization: authHeader } })
  }


  async getFormProperties({ objectType, property }) {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;

    return axios.get(baseurl + `/v2/registration/get-hs-properties?objectType=${objectType}&property=${property}`,
      { headers: { Authorization: authHeader } })
  }

}
export default new AuthService();
