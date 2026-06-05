import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface PathNodeProps {
  level: string;
  isCompleted: boolean;
  isLocked: boolean;
  onPress: () => void;
  index: number;
}

export const PathNode: React.FC<PathNodeProps> = ({ isCompleted, isLocked, onPress, index }) => {
  // Logic to alternate the node horizontal position for a wavy path
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
        isCompleted && styles.completedCircle,
        isLocked && styles.lockedCircle
      ]}>
        {isLocked ? (
          <Ionicons name="lock-closed" size={24} color={Colors.textMuted} />
        ) : isCompleted ? (
          <Ionicons name="checkmark" size={28} color="#FFFFFF" />
        ) : (
          <Ionicons name="star" size={28} color="#FFFFFF" />
        )}
      </View>
      <Text style={[styles.label, isLocked && styles.lockedText]}>
        Étape {index + 1}
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
    elevation: 4,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  completedCircle: {
    backgroundColor: Colors.success,
  },
  lockedCircle: {
    backgroundColor: Colors.surfaceLight,
    borderColor: 'transparent',
  },
  locked: {
    opacity: 0.7,
  },
  label: {
    marginTop: 8,
    color: Colors.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  lockedText: {
    color: Colors.textMuted,
  },
});
