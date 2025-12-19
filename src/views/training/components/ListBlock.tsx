// ListBlock.tsx
import React from 'react';
import { View, Text, TextStyle, ViewStyle } from 'react-native';
import ParagraphBlock from './ParagraphBlock';
import Colors from "../../../../constants/Colors";
import Spacings from "../../../../constants/Spacings";

interface ListBlockProps {
  items: string[];
  style?: 'ordered' | 'unordered';
  containerStyle?: ViewStyle;
  itemStyle?: TextStyle;
  markerStyle?: TextStyle;
}

const ListBlock: React.FC<ListBlockProps> = ({
  items,
  style = 'unordered',
  containerStyle,
  itemStyle,
  markerStyle
}) => {
  const getMarker = (index: number): string => {
    return style === 'ordered' ? `${index + 1}.` : '•';
  };

  return (
    <View style={containerStyle}>
      {items.map((item, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            marginBottom: Spacings.sm,
            alignItems: 'flex-start'
          }}
        >
          <Text
            style={[
              {
                marginRight: Spacings.sm,
                width: Spacings.md,
              },
              markerStyle
            ]}
          >
            {getMarker(index)}
          </Text>
          <View style={{ flex: 1 }}>
            <ParagraphBlock
              htmlContent={item}
              style={itemStyle}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

export default ListBlock;