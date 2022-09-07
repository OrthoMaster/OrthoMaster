
import AsyncStorage from '@react-native-async-storage/async-storage';


export const getCurrentDate = () => {
    var date = new Date()

    return (date.getFullYear()+'-'+(date.getMonth()+ 1)+'-'+date.getDate()+' '+
    date.getHours()+':'+date.getMinutes()+':'+date.getSeconds());
}

export const restoreLocalConfigAsync = async () => {

    let config = await AsyncStorage.getItem('config', (error, result) => {
      if (error) {
        console.log(error);
        return null
      }
      return result
    })

    return JSON.parse(config)
  }