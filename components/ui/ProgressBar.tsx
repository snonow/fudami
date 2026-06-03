import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, height = 12 }) => {
  const width = progress * 100;

  return (
    <View style={[styles.container, { height }]}>
      <View style={[styles.background, { height }]} />
      <View 
        style={[
          styles.fill, 
          { width: `${width}%`, height, backgroundColor: Colors.primary }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  background: {
    width: '100%',
    backgroundColor: Colors.surfaceLight,
    position: 'absolute',
  },
  fill: {
    borderRadius: 6,
  },
});
