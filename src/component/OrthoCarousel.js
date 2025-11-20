import React, { useEffect, useState } from 'react';
import {
  Text,
  Dimensions,
  StyleSheet,
  Image,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQuery } from "@tanstack/react-query";
import { getS3Image } from '../services/S3Service';

import AntDesign from '@expo/vector-icons/AntDesign';
import Colors from '../../constants/Colors';
import Spacings from '../../constants/Spacings';

const CarousselCard = ({ item, onPress }) => {
  const imageUrl = useQuery({
    queryKey: ['Home', 'GET', 'contentThumbnail', item.id_content, item.title],
    queryFn: () => getS3Image(`${item.s3_path}/${item.title}/logo.png`)
  })

  return (
    <TouchableOpacity style={styles.card}
      onPress={() => onPress()}
    >
      <View style={styles.image}>
        {
          imageUrl.data ?
            <Image
              style={styles.thumbnail}
              source={{ uri: imageUrl?.data }}
            />
            : <View style={[styles.thumbnail, { backgroundColor: Colors.grayLight }]} />
        }
      </View>
      <View style={styles.detail}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.author}>{item.author}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AntDesign name="clock-circle" size={10} color={Colors.text} style={{ paddingRight: Spacings.xxs }} />
          <Text style={styles.metaText}>{item.duration}</Text>
        </View>
        {item.tags &&
          <Text style={styles.description}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {
              item.tags?.split(";").map((value, index) => {
                return <Text key={index}>{String(value).charAt(0).toUpperCase() + String(value).slice(1)}, </Text>
              })
            }
          </Text>
        }
      </View>
    </TouchableOpacity>
  );
}


export const OrthoCarousel = ({ entries, onSelect }) => {
  return (
    <View style={styles.container}>
      {entries?.map((item) => (
        <CarousselCard
          key={item.id_content}
          item={item}
          onPress={() => onSelect(item)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: Spacings.lg,
    marginVertical: Spacings.xs
  },
  image: {
    flex: 0.8,
  },
  detail: {
    flex: 1.2,
    paddingLeft: Spacings.md,
  },
  title: {
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 14,
    marginBottom: Spacings.xxxs,
    marginTop: Spacings.xs,
  },
  author: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: Spacings.xxs,
  },
  description: {
    marginTop: Spacings.xxs,
    fontSize: 10,
    color: Colors.subtext,
  },
  thumbnail: {
    width: 'auto',
    height: 120,
    resizeMode: 'cover',
    borderRadius: 8
  },
  metaText: {
    fontSize: 10,
    fontFamily: 'Poppins-Light'
  }
})