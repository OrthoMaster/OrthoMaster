/**
 * @author Francis
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  ScrollView,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

import { useQuery } from "@tanstack/react-query";
import { ContentFactory } from "../content/components/ContentFactory";

import { UseCaptureGuard } from "../../component/captureGuard/useCaptureGuard";

import { getLessonContent } from "../../services/v2/TrainingService";

import Colors from "../../../constants/Colors";
import XMLParser from 'react-xml-parser';

export function ContentDisplayer({ route, navigation }) {
  var { lessonId } = route.params;

  const { data: content, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['lessonContent', lessonId],
    queryFn: () => getLessonContent(lessonId),
    retry: 1,
    retryDelay: 1000,
  });

  const contentScrollRef = useRef<ScrollView>(null);
  const [showContent, setShowContent] = useState(null);

  useEffect(() => {
    if (content?.xml_content) {
      const parsed = new XMLParser().parseFromString(content.xml_content);
      setShowContent(parsed);
    }
  }, [content]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {!isLoading && content &&
        <UseCaptureGuard>
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              textAlign: "center",
              paddingVertical: 16,
              marginHorizontal: 48,
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {content.title}
          </Text>
          <View
            style={{
              flex: 1,
              width: "100%",
              position: "relative",
            }}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              ref={contentScrollRef}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isFetching}
                  onRefresh={refetch}
                  colors={[Colors.blue]}
                  tintColor={Colors.blue}
                  style={{ zIndex: 9999 }}
                />
              }>
              {showContent && (
                <ContentFactory
                  component={showContent}
                  contentInfos={content}
                />
              )}
            </ScrollView>
          </View>
        </UseCaptureGuard>
      }
    </SafeAreaView>
  );
}

var styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    flex: 1,
  },
  scrollContainer: {},
});
