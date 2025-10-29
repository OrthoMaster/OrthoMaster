import React from 'react';
import { Text, TextStyle } from 'react-native';

interface TextPart {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

interface ParagraphBlockProps {
  htmlContent: string;
  type?: '' | 'citation' | 'details';
  style?: TextStyle;
}

const parseHtmlText = (htmlString: string): TextPart[] => {
  const parts: TextPart[] = [];
  
  // Clean up HTML entities
  let cleanText = htmlString
    .replace(/&nbsp;/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n');
  
  // Split by HTML tags while keeping the tags
  const regex = /(<\/?[bi]>)/gi;
  const segments = cleanText.split(regex);
  
  let isBold = false;
  let isItalic = false;
  
  segments.forEach(segment => {
    if (segment === '<b>') {
      isBold = true;
    } else if (segment === '</b>') {
      isBold = false;
    } else if (segment === '<i>') {
      isItalic = true;
    } else if (segment === '</i>') {
      isItalic = false;
    } else if (segment && !segment.match(/^<\/?[bi]>$/)) {
      parts.push({
        text: segment,
        bold: isBold,
        italic: isItalic
      });
    }
  });
  
  return parts;
};

const ParagraphBlock: React.FC<ParagraphBlockProps> = ({ htmlContent, type, style }) => {
  const textParts = parseHtmlText(htmlContent);
  const defaultStyle = (type === 'citation' ? 'italic' : 'normal');

  return (
    <Text style={style}>
      {textParts.map((part, index) => (
        <Text
          key={index}
          style={{
            fontWeight: part.bold ? 'bold' : 'normal',
            fontStyle: part.italic ? 'italic' : defaultStyle,
          }}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
};

export default ParagraphBlock;