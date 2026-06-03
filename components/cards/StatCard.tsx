import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, iconColor }) => {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={24} color={iconColor} style={styles.icon} />
      <View>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  icon: {
    marginRight: 12,
  },
  value: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
