import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

interface PathNodeProps {
  level: string;
  isCompleted: boolean;
  isLocked: boolean;
  onPress: () => void;
  index: number;
}

export const PathNode: React.FC<PathNodeProps> = ({ isCompleted, isLocked, onPress, index }) => {
  const { colors } = useTheme();
  const marginHorizontal = index % 2 === 0 ? 0 : 60;

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={isLocked}
      style={[
        styles.container, 
        { marginLeft: marginHorizontal },
        isLocked && styles.locked
      ]}
    >
      <View style={[
        styles.circle,
        { backgroundColor: colors.teal },
        isCompleted && { backgroundColor: colors.success },
        isLocked && { backgroundColor: colors.surfaceLight, borderColor: 'transparent' }
      ]}>
        {isLocked ? (
          <Ionicons name="lock-closed" size={24} color={colors.textMuted} />
        ) : isCompleted ? (
          <Ionicons name="checkmark" size={28} color={colors.white} />
        ) : (
          <Ionicons name="star" size={28} color={colors.white} />
        )}
      </View>
      <Text style={[styles.label, { color: colors.text }, isLocked && { color: colors.textMuted }]}>
        Step {index + 1}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
    width: 100,
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
    elevation: 4,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  locked: {
    opacity: 0.7,
  },
  label: {
    marginTop: 8,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
