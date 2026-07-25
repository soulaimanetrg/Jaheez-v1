import { useEventListener } from 'expo';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

import { BRAND } from '../constants/brand';
import { routeForCustomer } from '../features/auth/services/authApi';
import { useAuthStore } from '../store/authStore';

const SPLASH_IMAGE = require('../assets/images/splash_first.png');
const SPLASH_VIDEO = require('../assets/videos/splash_animation.mp4');

export default function RootIndex() {
  const isLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const [animationFinished, setAnimationFinished] = useState(Platform.OS === 'web');
  const [firstFrameRendered, setFirstFrameRendered] = useState(false);

  const player = useVideoPlayer(SPLASH_VIDEO, videoPlayer => {
    videoPlayer.loop = false;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  useEventListener(player, 'playToEnd', () => setAnimationFinished(true));
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'error') setAnimationFinished(true);
  });

  // Fallback safety timeout: guarantee transition even if video event doesn't fire
  useEffect(() => {
    if (animationFinished) return;
    const timer = setTimeout(() => {
      setAnimationFinished(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, [animationFinished]);

  // Ensure player playback initiates
  useEffect(() => {
    if (player && !player.playing) {
      try {
        player.play();
      } catch {
        setAnimationFinished(true);
      }
    }
  }, [player]);

  if (!animationFinished || isLoading) {
    if (Platform.OS === 'web') return <View style={styles.webLoading} />;

    return (
      <View style={styles.splash} accessibilityLabel="Jaheez animated splash screen">
        <StatusBar hidden />
        <VideoView
          player={player}
          style={styles.media}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
          allowsVideoFrameAnalysis={false}
          onFirstFrameRender={() => setFirstFrameRendered(true)}
          accessibilityLabel="Jaheez logo animation"
        />
        {!firstFrameRendered && (
          <Image
            source={SPLASH_IMAGE}
            style={styles.media}
            resizeMode="cover"
            accessibilityLabel="Jaheez logo"
          />
        )}
      </View>
    );
  }

  if (isAuthenticated && user) {
    return <Redirect href={routeForCustomer(user) as never} />;
  }
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: BRAND.RED,
  },
  media: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  webLoading: {
    flex: 1,
    backgroundColor: BRAND.BG,
  },
});
