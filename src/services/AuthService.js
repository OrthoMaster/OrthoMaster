import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

class AuthService {
  login(username, password) {
    return axios
      .post(Constants.manifest.extra.env.API_URL + "/user/login", { username, password })
      .then((response) => {
        let config = { user: response.data, accessToken: null}
        if (response.headers.authorization) {
          config.accessToken = response.headers.authorization.slice(7)
        }
        AsyncStorage.setItem('config', JSON.stringify(config), (error) => {
          if (error)
            throw error
        })
        return {code: 200,user: config.user, accessToken: config.accessToken};
      }).catch((e)=> {
        throw e
      })
  }
  logout() {
    AsyncStorage.clear()
  }
  
  checkUserConnection(config) {

    const authHeader = 'Bearer ' + config.accessToken ;

    return axios.get(Constants.manifest.extra.env.API_URL + '/connect', { headers: { Authorization : authHeader} })
    .catch((e)=> {
      throw e
    })
  }

  changePassword(credentials) {

    return axios.post(Constants.manifest.extra.env.API_URL + '/user/edit/password', credentials)
    .catch((e)=> {
      throw e
    })
  }

}
export default new AuthService();
