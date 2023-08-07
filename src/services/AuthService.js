import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { restoreLocalConfigAsync } from "../utils";

class AuthService {

  async login(username, password) {
    return axios
      .post(Constants.manifest.extra.env.API_URL + "/user/login", { username, password })
      .then((response) => {
        return response.data;
      })
  }


  logout() {
    AsyncStorage.clear()
  }

  async checkUserConnection(token) {

    const authHeader = 'Bearer ' + token;
    const res = await axios.get(Constants.manifest.extra.env.API_URL + '/connect', { headers: { Authorization: authHeader } });
    //console.log('res',res);
    return res
  }

  async changePassword(credentials) {

    try {
      return await axios.post(Constants.manifest.extra.env.API_URL + '/user/edit/password', credentials);
    } catch (e) {
      throw e;
    }
  }

  async getNewToken() {
    console.log("Service new token");
    const config = await restoreLocalConfigAsync()
    const refreshToken = await SecureStore.getItemAsync('refreshToken')
    return axios
      .post(Constants.manifest.extra.env.API_URL + "/user/token", { id_user: config.user.id_user, refresh_token: refreshToken })
      .then(async (response) => {
        if (response.data) {
          console.log(response.data);
          await SecureStore.setItemAsync('JWT', response.data.jwt_token)
          await SecureStore.setItemAsync('refreshToken', response.data.refresh_token)
          return true;
        } else {
          return false
        }
      })
      .catch((e) => {
        console.log("token error", e.response);
      })
  }

  async registerNewCompanyAndUser(data) {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;
    return axios
      .post(Constants.manifest.extra.env.API_URL + "/v2/registration", data, { headers: { Authorization: authHeader } })
  }

  async sendSubscriptionLinkByEmail(body) {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;

    return axios
      .post(Constants.manifest.extra.env.API_URL + "/v2/registration/mailing", body, { headers: { Authorization: authHeader } })
  }

  async activateUser(body) {
    return axios
      .post(Constants.manifest.extra.env.API_URL + '/v2/registration/activate',
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
      .post(Constants.manifest.extra.env.API_URL + '/v2/registration/register-contact?type=' + data.mode,
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

    return axios.get(Constants.manifest.extra.env.API_URL + '/v2/subscription/get-products', { headers: { Authorization: authHeader } })
  }


  async getFormProperties({ objectType, property }) {
    const config = await restoreLocalConfigAsync()
    const authHeader = 'Bearer ' + config.JWT;

    return axios.get(Constants.manifest.extra.env.API_URL + `/v2/registration/get-hs-properties?objectType=${objectType}&property=${property}`,
      { headers: { Authorization: authHeader } })
  }

}
export default new AuthService();
