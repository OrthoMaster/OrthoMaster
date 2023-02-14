
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getCurrentDate = () => {
  var date = new Date()

  return (date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' +
    date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds());
}

export const restoreLocalConfigAsync = async () => {

  let config = await AsyncStorage.getItem('config', (error, result) => {
    if (error) {
      throw error
    }
    return result
  })

  return JSON.parse(config)
}


export const S3ContentPathGenerator = (content) => {
  var path = ''

  switch (content.type) {
    case 'lesson':
      if (content.title == 'initial' || content.title == 'final')
        path = content.type + '/' + content.title + '/'
      else
        path = content.type + '/' + content.module_num + '/' + content.title + '/'
      break;
    case 'flash':
      path = content.type + '/' + content.theme + '/' + content.category + '/' + content.subcategory + '/' + content.title + '/'
      break;
    case 'qa':
      path = content.type + '/' + content.title + '/'
      break;

    default:
      break;
  }

  return path
}

export const ColorLuminance = (hex, lum) => {

	// validate hex string
	hex = String(hex).replace(/[^0-9a-f]/gi, '');
	if (hex.length < 6) {
		hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
	}
	lum = lum || 0;

	// convert to decimal and change luminosity
	var rgb = "#", c, i;
	for (i = 0; i < 3; i++) {
		c = parseInt(hex.substr(i*2,2), 16);
		c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
		rgb += ("00"+c).substr(c.length);
	}

	return rgb;
}