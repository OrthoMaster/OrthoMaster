
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import { saveEvent } from './services/SessionEventService';

export const getCurrentDate = () => {
	return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

export const restoreLocalConfigAsync = async () => {

	let config = await AsyncStorage.getItem('user', (error, result) => {
		if (error) {
			throw error
		}
		return result
	})

	let token = await SecureStore.getItemAsync('JWT');

	return { user: JSON.parse(config), JWT: token }
}


export const ColorLuminance = (hex, lum) => {

	// validate hex string
	hex = String(hex).replace(/[^0-9a-f]/gi, '');
	if (hex.length < 6) {
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
	}
	lum = lum || 0;

	// convert to decimal and change luminosity
	var rgb = "#", c, i;
	for (i = 0; i < 3; i++) {
		c = parseInt(hex.substr(i * 2, 2), 16);
		c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
		rgb += ("00" + c).substr(c.length);
	}

	return rgb;
}

export const orthomasterShare = (
	{ title = undefined, message = undefined, url = undefined },
	share_type = 'default', // can be: app sharing or inviteShare or content share
	content_id = null // if content share
) => {

	console.log(share_type, content_id)
	Share.share({
		title: title,
		message: message,
		url: url
	}).then(() => {
		saveEvent("share_use", {
			share_type: share_type, // can be: app sharing or inviteShare or content share
			content_id: content_id, // if content share 
			occured_at: getCurrentDate()
		})
	})
}

export const orthomasterShareFile = async (fileUri, options, fileName) => {
	const isAvailable = await Sharing.isAvailableAsync()

	if (isAvailable == false)
		return

	Sharing.shareAsync(fileUri, options)
		.then(() => {
			saveEvent("share_use", {
				share_type: 'file-'+fileName,
				content_id: null,
				occured_at: getCurrentDate()
			})
		})

}