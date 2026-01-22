import React, { ReactElement } from 'react'
import { Text, TextStyle, DimensionValue } from 'react-native'
import Colors from "../../../../../constants/Colors";
import Spacings from "../../../../../constants/Spacings";

interface TextStyleConfig {
  "text-color"?: string;
  "background-color"?: string;
  "text-size"?: string;
  "text-weight"?: string;
  text: string;
}

interface TextAttributes {
  "background-color"?: string;
  "text-color"?: string;
  "text-size"?: string;
  "text-weight"?: string;
  "text-align"?: "left" | "center" | "right" | "justify";
  "align-self"?: "flex-start" | "flex-end" | "center" | "stretch";
  "width"?: string;
}

interface TextContent {
  attributes?: TextAttributes;
  value: string | React.ReactNode[];
}

interface TextFactoryProps {
  content: TextContent;
}

function handleStyle(textStyle: TextStyleConfig): TextStyle {
  const style: TextStyle = {}

  if (textStyle["text-color"]) {
    style.color = textStyle["text-color"];
  }
  if (textStyle["background-color"]) {
    style.backgroundColor = Colors.white;
  }
  if (textStyle["text-size"]) {
    style.fontSize = parseInt(textStyle["text-size"])
  }
  if (textStyle["text-weight"]) {
    style.fontWeight = textStyle["text-weight"] as TextStyle["fontWeight"]
  }

  return style
}

function customizeText(styleStr: string, index: number): ReactElement {
  const textStyle: TextStyleConfig = JSON.parse(styleStr);
  return <Text style={handleStyle(textStyle)} key={index}>{textStyle.text}</Text>
}

function handleCustomText(text: string): (string | ReactElement)[] {
  const newText: (string | ReactElement)[] = []
  let i = 0
  let j = 0

  for (i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      newText.push(text.substring(j, i))
      for (j = i; text[j] !== '}' && j !== text.length; j++);
      newText.push(customizeText(text.substring(i, j + 1), i))
      i = j
      j++
    }
  }
  newText.push(text.substring(j, i))

  return newText
}

export const handleColor = (color) => {
  if (color) {
    const themes = color.split('|')
    var colors = new Map()
    themes.forEach(elem => {
      const tmp = elem.split('#')
      colors.set(tmp[0], tmp[1])
    });

    if (colors.get('light') && colors.get('dark')) {
      return "#" + colors.get('light')
    }
  }
}

export const TextFactory: React.FC<TextFactoryProps> = ({ content }) => {
  const attributes = content.attributes

  let backgroundColor: string = "transparent"
  let textColor: string = Colors.text
  let textSize: number = 14
  let textWeight: TextStyle["fontWeight"] = "normal"
  let textAlign: TextStyle["textAlign"] = "left"
  let textAlignSelf: TextStyle["alignSelf"] = "flex-start"
  let textWidth: DimensionValue = 'auto'

  if (attributes) {
    if (attributes["background-color"])
      backgroundColor = attributes["background-color"]
    if (attributes["text-color"])
      textColor = handleColor(attributes["text-color"])
    if (attributes["text-size"]) {
      textSize = parseInt(attributes["text-size"])
    }
    if (attributes["text-weight"])
      textWeight = attributes["text-weight"] as TextStyle["fontWeight"]
    if (attributes["text-align"])
      textAlign = attributes["text-align"]
    if (attributes["align-self"])
      textAlignSelf = attributes["align-self"]
    if (attributes["width"]) {
      textWidth = attributes["width"].includes('%')
        ? attributes["width"] as DimensionValue
        : parseInt(attributes["width"])
    }
  }

  let text = content.value

  if (typeof text === 'string' && text.includes('{')) {
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
        paddingHorizontal: Spacings.md,
        alignSelf: textAlignSelf,
        width: textWidth,
        fontFamily: textSize <= 18 ? 'Roboto' : 'Poppins-Medium',
      }}>
      {text}
    </Text>
  )
}