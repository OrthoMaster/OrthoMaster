/**
 * En-tête d'un média — version web, dimensions adaptées à un écran large.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import Colors from '../../../../constants/Colors';
import Spacings from '../../../../constants/Spacings';

type Expert = { id: number; name: string };

type Props = {
  title?: string;
  eventName?: string;
  editionYear?: string | number;
  experts?: Expert[];
};

export const MediaContentHeader = ({ title, eventName, editionYear, experts = [] }: Props) => {
  const hasEvent = !!eventName || !!editionYear;
  const hasExperts = Array.isArray(experts) && experts.length > 0;

  if (!title && !hasEvent && !hasExperts) return null;

  const eventLabel = [eventName, editionYear].filter(Boolean).join(' — ');
  const expertLabel = experts.map(e => e.name).join(' · ');

  return (
    <View style={styles.wrapper}>
      {hasEvent && (
        <Text style={styles.eventText}>{eventLabel}</Text>
      )}

      {hasExperts && (
        <Text style={styles.expertText}>{expertLabel}</Text>
      )}

      {!!title && <Text style={styles.title}>{title}</Text>}

      <View style={styles.separator} />
    </View>
  );
};

export default MediaContentHeader;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacings.xl,
  },
  eventText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: Colors.subtext,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacings.sm,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Poppins-Medium',
    color: Colors.text,
    marginBottom: Spacings.sm,
    lineHeight: 40,
  },
  expertText: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: Colors.primary,
    lineHeight: 24,
    marginBottom: Spacings.sm,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.grayLight,
    marginTop: Spacings.lg,
  },
});