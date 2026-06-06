import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { StatCard } from '../../components/cards/StatCard';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { DUMMY_CARDS } from '../../constants/MockData';
import { PathManager } from '../../engine/PathManager';
import { PathNode } from '../../components/gamification/PathNode';
import { getXPForNextLevel } from '../../engine/gamification';

import { getDueCards } from '../../db/cards';

export default function HomeScreen() {
  const { user, session, loadSession } = useAppStore();
  const router = useRouter();
  const [cards, setCards] = React.useState<any[]>(DUMMY_CARDS);

  React.useEffect(() => {
    async function fetchCards() {
      try {
        const dbCards = await getDueCards(100, 100);
        if (dbCards.length > 0) {
          setCards(dbCards);
        }
      } catch (err) {
        console.error('Failed to fetch cards for path:', err);
      }
    }
    fetchCards();
  }, []);

  // Safely calculate progress
  const xpTotal = user?.xpTotal ?? 0;
  const { current, next } = getXPForNextLevel(xpTotal);
  const levelProgress = next > current ? (xpTotal - current) / (next - current) : 1;
  const currentLevel = user?.level ?? 1;

  // Use real cards if available, fallback to dummy
  const path = PathManager.generatePath('JLPT N5', cards, user?.completedLevels ?? []);

  const handleStartSession = async () => {
    await loadSession();
    router.push('/(tabs)/review');
  };

  const handleStartLevel = async (levelCardIds: string[]) => {
    const levelCards = cards.filter((c) => levelCardIds.includes(c.id));
    useAppStore.getState().startSession(levelCards, 'cards', levelCards.length);
    router.push('/(tabs)/review');
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour !';
    if (h < 18) return 'Bon après-midi !';
    return 'Bonsoir !';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.subtitle}>Prêt pour ta session ?</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lvl {currentLevel}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard label="Série" value={`${user?.streakDays ?? 0} j`} icon="flame" iconColor="#FF9800" />
          <StatCard label="Total XP" value={xpTotal} icon="star" iconColor="#FFD600" />
        </View>

        {/* XP Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progression niveau</Text>
            <Text style={styles.progressValue}>Lvl {currentLevel}</Text>
          </View>

          <ProgressBar progress={levelProgress} height={12} />

          <Text style={styles.progressNote}>
            {xpTotal} / {next} XP
          </Text>

          <Button
            title="Commencer une session"
            onPress={handleStartSession}
            style={{ marginTop: 20 }}
          />
        </View>

        {/* Learning Path */}
        <Text style={styles.sectionTitle}>Mon Parcours</Text>
        <View style={styles.pathContainer}>
          {path.map((level, index) => (
            <PathNode
              key={level.id}
              index={index}
              level={level.title}
              isCompleted={level.isCompleted}
              isLocked={level.isLocked}
              onPress={() => handleStartLevel(level.cardIds)}
            />
          ))}
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{user?.totalReviews ?? 0}</Text>
            <Text style={styles.quickStatLabel}>Révisions</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{user?.streakDays ?? 0}</Text>
            <Text style={styles.quickStatLabel}>Jours de série</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{xpTotal}</Text>
            <Text style={styles.quickStatLabel}>XP total</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  greeting: { color: Colors.text, fontSize: 28, fontWeight: '800' },
  subtitle: { color: Colors.textMuted, fontSize: 16 },
  levelBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  levelText: { color: Colors.primary, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  progressTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  progressValue: { color: Colors.primary, fontSize: 22, fontWeight: '800' },
  progressNote: { color: Colors.textMuted, fontSize: 13, marginTop: 10 },
  sectionTitle: { color: Colors.text, fontSize: 20, fontWeight: '700', marginBottom: 16 },
  pathContainer: { alignItems: 'center', paddingVertical: 20, marginBottom: 30 },
  quickStatsGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
  quickStatItem: { alignItems: 'center', flex: 1 },
  quickStatValue: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
  quickStatLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
});
