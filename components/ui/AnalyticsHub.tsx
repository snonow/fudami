import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

interface AnalyticsHubProps {
  weeklyData: { day: string; count: number }[];
  retentionRate: number;
}

export const AnalyticsHub: React.FC<AnalyticsHubProps> = ({ weeklyData, retentionRate }) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const maxCount = Math.max(...weeklyData.map(d => d.count), 5);
  const chartHeight = 100;
  const chartWidth = isDesktop ? 400 : width - 80;
  const barWidth = (chartWidth / 7) - 10;

  const totalReviews = weeklyData.reduce((s, d) => s + d.count, 0);

  if (totalReviews === 0) {
    return (
      <View style={[styles.banner, { backgroundColor: colors.teal + '15', borderColor: colors.teal + '33' }]}>
        <Text style={[styles.bannerEmoji]}>📊</Text>
        <Text style={[styles.bannerTitle, { color: colors.text }]}>No analytics yet</Text>
        <Text style={[styles.bannerText, { color: colors.textMuted }]}>
          Complete your first review session to see your progress charts here!
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>Weekly Activity</Text>
      
      {/* Simple Bar Chart */}
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
                fill={d.count > 0 ? colors.teal : colors.surfaceLight + '33'}
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

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.skyBlue }]}>{retentionRate}%</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Retention</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.white }]}>{totalReviews}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>7d Reviews</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  daysRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  banner: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  bannerEmoji: {
    fontSize: 40,
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  bannerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
