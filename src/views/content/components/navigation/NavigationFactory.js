import React from 'react'
import {Linking, Alert} from 'react-native'

export default function navigateToContent(href) {
    if (href) {
        const elems = href.split(':')


        if (elems[0] == 'http'|| elems[0] == 'https') {
            try {
                Linking.openURL(href)
              } catch (error) {
                  console.error('error');
                Alert.alert(error.message)
              }
        } else {
            // TODO navigate to content
        }
    }
}