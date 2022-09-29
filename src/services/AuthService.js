import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = "https://api.orthomaster.fr/";

class AuthService {
  login(username, password) {
    return axios
      .post(API_URL + "user/login", { username, password })
      .then((response) => {

        let config = { user: response.data, accessToken: null}
        if (response.headers.authorization) {
          config.accessToken = response.headers.authorization.slice(7)
        }
        AsyncStorage.setItem('config', JSON.stringify(config), (error) => {
          if (error)
            console.log('error: ', error);
        })

        return {code: 200,user: config.user, accessToken: config.accessToken};
      }).catch((e)=> {
        console.log('eeerrrrrr', e.response);
      })
  }
  logout() {
    AsyncStorage.clear()
  }
  
  checkUserConnection(config) {

    const authHeader = 'Bearer ' + config.accessToken ;

    return axios.get(API_URL + 'connect', { headers: { Authorization : authHeader} })
  }

  changePassword(credentials) {

    return axios.post(API_URL + 'user/edit/password', credentials)
  }

}
export default new AuthService();
