import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, height = 12, color }) => {
  const { colors } = useTheme();
  const width = Math.max(0, Math.min(1, progress)) * 100;

  return (
    <View style={[styles.container, { height, backgroundColor: colors.surfaceLight + '33' }]}>
      <View 
        style={[
          styles.fill, 
          { width: `${width}%`, height, backgroundColor: color || colors.teal }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 8,
  },
});
