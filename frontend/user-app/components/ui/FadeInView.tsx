/**
 * Fade + slide-up entrance animation using Moti.
 * Wraps any content and animates it into view.
 *
 * Usage:
 *   <FadeInView delay={100}><YourContent /></FadeInView>
 */
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { MotiView } from 'moti';

type Props = {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  fromY?: number;
  style?: StyleProp<ViewStyle>;
};

export default function FadeInView({
  children,
  delay = 0,
  duration = 350,
  fromY = 14,
  style,
}: Props) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: fromY }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing' as any, duration, delay }}
      style={style}
    >
      {children}
    </MotiView>
  );
}
