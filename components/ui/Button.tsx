import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
  /** Displays a spinner and disables the button during loading. */
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  loading = false,
}) => {
  const { colors } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: colors.secondary };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.primary };
      default:
        return { backgroundColor: colors.primary };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return { color: colors.primary };
      default:
        return { color: colors.white };
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, getVariantStyle(), style, loading && styles.disabled]}
      onPress={loading ? undefined : onPress}
      activeOpacity={0.8}
      disabled={loading}
    >
      {loading
        ? <ActivityIndicator size="small" color={variant === 'outline' ? colors.primary : colors.white} />
        : <Text style={[styles.baseText, getTextStyle(), textStyle]}>{title}</Text>
      }
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  baseText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
