import React from 'react'
import { Text } from 'react-native'

import { handleColor } from './stylesXml'

function handleStyle(textStyle) {
    var style = {}
    if (textStyle["text-color"]) {
        style.color = handleColor(textStyle["text-color"])
    }
    if (textStyle["background-color"]) {
        style.backgroundColor = handleColor(textStyle["background-color"])
    }
    if (textStyle["text-size"]) {
        style.fontSize = parseInt(textStyle["text-size"])
    }
    if (textStyle["text-weight"]) {
        style.fontWeight = textStyle["text-weight"]
    }

    return style
}

function customizeText(styleStr, index) {
    const textStyle = JSON.parse(styleStr);

    if (textStyle.text) {
        return <Text style={handleStyle(textStyle)} key={index}>{textStyle.text}</Text>
    } else {
        return <Text style={{ color: '#E01227' }} key={index}>[text customizing error]</Text>
    }


}


function handleCustomText(text) {

    var newText = []

    var i = 0
    var j = 0

    for (i = 0; i < text.length; i++) {
        if (text[i] == '{') {
            newText.push(text.substring(i, j)) //1ere loop substr(val, 0) -> équivalenet à substr(val)
            for (j = i; text[j] != '}' && j != text.length; j++);
            newText.push(customizeText(text.substring(i, j + 1), i))
            i = j
            j++
        }
    }
    newText.push(text.substring(j, i))

    return newText

}

export const TextFactory = ({content}) => {
    let attributes = content.attributes

    var backgroundColor = "transparent"
    var textColor = "#000000" // handle light and dark theme
    var textSize = 15
    var textWeight = "normal"
    var textAlign = "left"
    var textAlignSelf = "flex-start"
    var textWidth = 'auto'

    if (attributes) {
        if (attributes["background-color"])
            backgroundColor = handleColor(attributes["background-color"]) // handle light and dark theme
        if (attributes["text-color"])
            textColor = handleColor(attributes["text-color"]) // handle light and dark theme
        if (attributes["text-size"])
            textSize = attributes["text-size"].includes('%') ? attributes["text-size"] : parseInt(attributes["text-size"])
        if (attributes["text-weight"])
            textWeight = attributes["text-weight"] ? attributes["text-weight"] : "normal"
        if (attributes["text-align"])
            textAlign = attributes["text-align"]
        if (attributes["align-self"])
            textAlignSelf = attributes["align-self"]
        if (attributes["width"])
            textWidth = attributes["width"].includes('%') ? attributes["width"] : parseInt(attributes["width"])

    }

    let text = content.value

    if (text.includes('{')) {
        text = handleCustomText(text)
    }

    return (
        <Text
            style={{
                backgroundColor: backgroundColor,
                color: textColor,
                fontSize: textSize,
                fontWeight: textWeight,
                textAlign: textAlign,
                paddingHorizontal: 10,
                alignSelf: textAlignSelf,
                width: textWidth
            }}>
            {text}
        </Text>
    )
}
