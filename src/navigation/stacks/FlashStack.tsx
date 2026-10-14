import React, { useEffect, useState } from 'react'

import { Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';

import { FlashMediaView } from '../../views/flash/FlashMediaView';
import { ContentDisplayer } from "../../views/content/ContentDisplayer";
import { PreviewMediaView } from '../../views/flash/PreviewMediaView';

import { FlashSearchView } from '../../views/flash/FlashSearchView';
import { MediaAiSearchView } from '../../views/ai-search/MediaAiSearchView';

import ChannelMediaView from '../../views/flash/ChannelMediaView';

import { PodcastPlayerView } from '../../views/podcast/PodcastPlayerView';
import { InfographicView } from '../../views/infographic/InfographicView';

import Colors from '../../../constants/Colors';

const FlashStackNav = createStackNavigator();
export const FlashStack = ({ }) => {
  return (
    <FlashStackNav.Navigator
      id={"media-stack" as undefined}
      initialRouteName='flash-media-home'
      screenOptions={{
        animation: 'default',
        title: 'Médias' // for web
      }}
    >
      <FlashStackNav.Screen
        name="flash-media-home"
        component={FlashMediaView}
        options={{ headerShown: false }}
      />

      {Platform.OS === 'web'
        ? <FlashStackNav.Screen
          name="flash-media-channel"
          component={ChannelMediaView}
          options={{
            headerShown: false,
            animation: 'fade_from_bottom',
          }}
        />
        : <FlashStackNav.Screen
          name="flash-media-channel"
          component={ChannelMediaView}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      }

      {Platform.OS === 'web'
        ? <FlashStackNav.Screen
          name="flash-media-preview"
          component={PreviewMediaView}
          options={{
            headerShown: false,
            presentation: 'transparentModal',
            animation: 'slide_from_right',
          }}
        />
        : <FlashStackNav.Screen
          name="flash-media-preview"
          component={PreviewMediaView}
          options={{
            headerShown: false,
          }}
        />
      }

      {Platform.OS === 'web'
        ? <FlashStackNav.Screen
          name="flash-media-viewer"
          component={ContentDisplayer}
          options={{
            headerShown: false,
          }}
        />
        : <FlashStackNav.Screen
          name="flash-media-viewer"
          component={ContentDisplayer}
          options={{
            headerShown: false,
          }}
        />
      }

      <FlashStackNav.Screen
        name="flash-search"
        component={FlashSearchView}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          presentation: Platform.OS === 'web' ? 'transparentModal' : 'card',
        }}
      />

      {/* Nom propre à cette pile : HomeStack aura son propre écran (home-ai-search).
          Sur web, panneau latéral posé sur le panneau de recherche, comme flash-search. */}
      <FlashStackNav.Screen
        name="flash-ai-search"
        component={MediaAiSearchView}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
          presentation: Platform.OS === 'web' ? 'transparentModal' : 'card',
        }}
      />

      <FlashStackNav.Screen
        name="flash-podcast"
        component={PodcastPlayerView}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          cardStyle: { backgroundColor: Colors.blackBackground },
          cardOverlayEnabled: false,
        }}
      />
      <FlashStackNav.Screen
        name="flash-infographic"
        component={InfographicView}
        options={{
          headerShown: false,
          animation: 'fade_from_bottom',
          cardStyle: { backgroundColor: Colors.blackBackground },
        }}
      />

    </FlashStackNav.Navigator>
  );
}