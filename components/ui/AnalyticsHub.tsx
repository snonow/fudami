import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Pressable } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { ProgressRadar } from './ProgressRadar';

interface AnalyticsHubProps {
  weeklyData: { day: string; count: number }[];
  retentionRate: number;
}

const MOCK_RADAR_DATA: any = {
  'N5': { kanji: 0.8, grammar: 0.6, vocab: 0.9, reading: 0.4, listening: 0.5 },
  'N4': { kanji: 0.3, grammar: 0.2, vocab: 0.4, reading: 0.1, listening: 0.2 },
  'N3': { kanji: 0.1, grammar: 0.05, vocab: 0.1, reading: 0, listening: 0 },
};

export const AnalyticsHub: React.FC<AnalyticsHubProps> = ({ weeklyData, retentionRate }) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [selectedLevel, setSelectedLevel] = useState('N5');
  const isDesktop = width > 768;

  const maxCount = Math.max(...weeklyData.map(d => d.count), 5);
  const chartHeight = 80;
  const chartWidth = isDesktop ? 350 : width - 80;
  const barWidth = (chartWidth / 7) - 10;

  const totalReviews = weeklyData.reduce((s, d) => s + d.count, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      
      <View style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]}>Skill Mastery</Text>
        <View style={styles.levelPicker}>
          {['N5', 'N4', 'N3', 'N2', 'N1'].map(lvl => (
            <Pressable 
              key={lvl} 
              onPress={() => setSelectedLevel(lvl)}
              style={[
                styles.levelBtn, 
                { backgroundColor: selectedLevel === lvl ? colors.primary : 'transparent' }
              ]}
            >
              <Text style={[
                styles.levelBtnText, 
                { color: selectedLevel === lvl ? colors.white : colors.textMuted }
              ]}>{lvl}</Text>
            </Pressable>
          ))}
        </View>
        <ProgressRadar data={MOCK_RADAR_DATA[selectedLevel] || MOCK_RADAR_DATA['N3']} size={isDesktop ? 300 : width - 60} />
      </View>

      <View style={styles.dividerH} />

      <View style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]}>Weekly Activity</Text>
        <View style={styles.chartContainer}>
          <Svg height={chartHeight} width={chartWidth}>
            {weeklyData.map((d, i) => {
              const h = (d.count / maxCount) * chartHeight;
              return (
                <Rect
                  key={i}
                  x={i * (chartWidth / 7) + 5}
                  y={chartHeight - h}
                  width={barWidth}
                  height={h}
                  fill={d.count > 0 ? colors.palette.softMatchaGreen : colors.surfaceLight + '33'}
                  rx={4}
                />
              );
            })}
          </Svg>
          <View style={styles.daysRow}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <Text key={i} style={[styles.dayLabel, { color: colors.textMuted, width: chartWidth / 7 }]}>
                {day}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.palette.softMatchaGreen }]}>{retentionRate}%</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Retention</Text>
        </View>
        <View style={styles.dividerV} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.white }]}>{totalReviews}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>7d Reviews</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { borderRadius: 24, padding: 24, marginBottom: 24 },
  section: { marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
  levelPicker: { flexDirection: 'row', gap: 8, marginBottom: 20, justifyContent: 'center' },
  levelBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  levelBtnText: { fontSize: 12, fontWeight: '700' },
  chartContainer: { alignItems: 'center', marginBottom: 20 },
  daysRow: { flexDirection: 'row', marginTop: 8 },
  dayLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 20 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  dividerV: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerH: { height: 1, width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 24 },
});
