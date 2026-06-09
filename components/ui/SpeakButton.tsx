/**
 * SpeakButton — Animated speaker button for Japanese TTS.
 *
 * States:
 *   idle     → speaker icon, static
 *   loading  → small spinner (cloud fetch in progress)
 *   speaking → speaker icon + pulsing rings
 *
 * Usage:
 *   const { speak, state } = useTts();
 *   <SpeakButton text="ふだみ" state={state} onPress={() => speak('ふだみ')} />
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type TtsState } from '../../data/audio/TtsService';

interface SpeakButtonProps {
  /** Called when the button is pressed (should trigger TtsService.speak). */
  onPress: () => void;
  /** Current TTS state — drives the animation. */
  state: TtsState;
  /** Icon + ring color. Defaults to '#567C8D'. */
  color?: string;
  /** Button diameter. Defaults to 44. */
  size?: number;
}

export const SpeakButton: React.FC<SpeakButtonProps> = ({
  onPress,
  state,
  color = '#567C8D',
  size = 44,
}) => {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef<Animated.CompositeAnimation | null>(null);

  // ── Pulse animation while speaking ──────────────────────────────────────
  useEffect(() => {
    if (state === 'speaking') {
      pulseAnim.current = Animated.loop(
        Animated.stagger(200, [
          Animated.sequence([
            Animated.timing(ring1, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(ring1, { toValue: 0, duration: 0,   useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ring2, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(ring2, { toValue: 0, duration: 0,   useNativeDriver: true }),
          ]),
        ]),
      );
      pulseAnim.current.start();
    } else {
      pulseAnim.current?.stop();
      ring1.setValue(0);
      ring2.setValue(0);
    }
    return () => { pulseAnim.current?.stop(); };
  }, [state]);

  const iconSize = size * 0.45;
  const ringBaseSize = size * 1.4;

  const ring1Scale = ring1.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.6] });
  const ring2Scale = ring2.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.6] });
  const ring1Opacity = ring1.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.5, 0] });
  const ring2Opacity = ring2.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.4, 0] });

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color + '20',
          borderColor: color + '55',
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      {/* Pulse rings (speaking state) */}
      {state === 'speaking' && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View
            style={[
              styles.ring,
              {
                width: ringBaseSize,
                height: ringBaseSize,
                borderRadius: ringBaseSize / 2,
                borderColor: color,
                top:  -(ringBaseSize - size) / 2,
                left: -(ringBaseSize - size) / 2,
                transform: [{ scale: ring1Scale }],
                opacity: ring1Opacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              {
                width: ringBaseSize,
                height: ringBaseSize,
                borderRadius: ringBaseSize / 2,
                borderColor: color,
                top:  -(ringBaseSize - size) / 2,
                left: -(ringBaseSize - size) / 2,
                transform: [{ scale: ring2Scale }],
                opacity: ring2Opacity,
              },
            ]}
          />
        </View>
      )}

      {/* Icon / spinner */}
      {state === 'loading' ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons
          name={state === 'speaking' ? 'volume-high' : 'volume-medium-outline'}
          size={iconSize}
          color={color}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'visible',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
});
