import React, { useState } from 'react'
import { Text } from 'react-native';
import Hyperlink from 'react-native-hyperlink'
import navigateToContent from '../navigation/NavigationFactory'

export const LinkFactory = ({ config }) => {

    var textColor = '#2980b9'
    var textSize = 15
    var textAlign = "left"
    var textAlignSelf = "flex-start"


    if (config.attributes['text-color']) {
        textColor = config.attributes['text-color']
    }
    if (config.attributes['text-size']) {
        textSize = parseInt(config.attributes['text-size'])
    }
    if (config.attributes["text-align"])
        textAlign = config.attributes["text-align"]
    if (config.attributes["align-self"])
        textAlignSelf = config.attributes["align-self"]

    return <Hyperlink
        linkStyle={{
            color: textColor,
            fontSize: textSize,
        }}
        
        onPress={(url, text) => navigateToContent(url)}
    >
        <Text style={{ fontSize: 15, alignSelf: textAlignSelf, textAlign: textAlign }}>
            {config.attributes['href']}
        </Text>
    </Hyperlink>
}