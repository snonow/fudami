import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, G, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

interface ProgressRadarProps {
  data: {
    kanji: number; // 0 to 1
    grammar: number;
    vocab: number;
    reading: number;
    listening: number;
    speaking?: number; // Premium
    writing?: number;  // Premium
  };
  size?: number;
  isPremium?: boolean;
}

export const ProgressRadar: React.FC<ProgressRadarProps> = ({ data, size = 250, isPremium = false }) => {
  const { colors } = useTheme();
  const categories = ['Kanji', 'Grammar', 'Vocab', 'Reading', 'Listening'];
  if (isPremium) {
    categories.push('Speaking', 'Writing');
  }

  const center = size / 2;
  const radius = (size / 2) * 0.7;
  const angleStep = (Math.PI * 2) / categories.length;

  const getPoint = (value: number, index: number, total: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const x = center + radius * value * Math.cos(angle);
    const y = center + radius * value * Math.sin(angle);
    return { x, y };
  };

  const points = categories.map((cat, i) => {
    const val = (data as any)[cat.toLowerCase()] || 0.1;
    const p = getPoint(val, i, categories.length);
    return `${p.x},${p.y}`;
  }).join(' ');

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];

  return (
    <View style={styles.container}>
      <Svg height={size} width={size}>
        <G>
          {/* Grid lines */}
          {gridLevels.map((level, i) => {
            const gridPoints = categories.map((_, idx) => {
              const p = getPoint(level, idx, categories.length);
              return `${p.x},${p.y}`;
            }).join(' ');
            return (
              <Polygon
                key={i}
                points={gridPoints}
                fill="none"
                stroke={colors.palette.aizomeIndigo}
                strokeWidth="1"
                strokeOpacity={0.2}
              />
            );
          })}

          {/* Axes */}
          {categories.map((_, i) => {
            const p = getPoint(1, i, categories.length);
            return (
              <Line
                key={i}
                x1={center}
                y1={center}
                x2={p.x}
                y2={p.y}
                stroke={colors.palette.aizomeIndigo}
                strokeWidth="1"
                strokeOpacity={0.2}
              />
            );
          })}

          {/* Data Polygon */}
          <Polygon
            points={points}
            fill={colors.palette.softHankoRed}
            fillOpacity={0.4}
            stroke={colors.palette.softHankoRed}
            strokeWidth="3"
          />

          {/* Data Points */}
          {categories.map((cat, i) => {
            const val = (data as any)[cat.toLowerCase()] || 0.1;
            const p = getPoint(val, i, categories.length);
            return <Circle key={i} cx={p.x} cy={p.y} r="4" fill={colors.palette.softHankoRed} />;
          })}

          {/* Labels */}
          {categories.map((cat, i) => {
            const p = getPoint(1.2, i, categories.length);
            return (
              <SvgText
                key={i}
                x={p.x}
                y={p.y}
                fill={colors.text}
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {cat}
              </SvgText>
            );
          })}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
