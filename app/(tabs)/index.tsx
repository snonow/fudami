import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { generatePath } from '../../engine';
import { PathNode } from '../../components/gamification/PathNode';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StudyRepository } from '../../data';
import { getWeeklyActivity, getRetentionRate } from '../../db';
import { AnalyticsHub } from '../../components/ui/AnalyticsHub';
import { StudyCard } from '../../data/study/types';

export default function HomeHub() {
  const { user, loadSession, loadUser } = useAppStore();
  const { colors, mode, toggleTheme } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [analytics, setAnalytics] = useState({ weekly: [] as any[], rate: 0 });

  const isDesktop = width > 768;

  useEffect(() => {
    loadUser();
    StudyRepository.getDueStudyCards(100).then(res => res.ok && res.data.length && setCards(res.data));
    Promise.all([getWeeklyActivity(), getRetentionRate()]).then(([weekly, rate]) => {
      setAnalytics({ weekly: weekly as any, rate });
    });
  }, []);

  const handleStart = async (c?: any[]) => {
    if (c) useAppStore.getState().startSession(c, 'cards', c.length);
    else await loadSession();
    router.push('/(tabs)/review');
  };

  const dueCount = cards.length;
  const dailyGoal = 50; // Mock goal
  const dailyProgress = Math.min((analytics.weekly[analytics.weekly.length - 1] as any)?.count / dailyGoal, 1) || 0;

  const path = generatePath('JLPT N5', cards, user?.completedLevels ?? []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopContent]}>
        
        {/* Top Hub Bar */}
        <View style={styles.hubBar}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>Good morning!</Text>
            <Text style={[styles.streakText, { color: colors.palette.softHankoRed }]}>
              <Ionicons name="flame" size={16} /> {user.streakDays} day streak
            </Text>
          </View>
          <Pressable onPress={toggleTheme} style={styles.themeToggle}>
            <Ionicons name={mode === 'light' ? 'moon' : 'sunny'} size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Hero Section */}
        <View style={[styles.hero, { backgroundColor: colors.surface }]}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Daily Goal</Text>
          <ProgressBar progress={dailyProgress} height={12} color={colors.palette.softMatchaGreen} />
          <View style={styles.goalInfo}>
            <Text style={[styles.goalText, { color: colors.textMuted }]}>
              {(analytics.weekly[analytics.weekly.length - 1] as any)?.count || 0} / {dailyGoal} cards
            </Text>
            <Text style={[styles.cardsLeft, { color: colors.text }]}>{dueCount} due now</Text>
          </View>
          
          <Pressable 
            style={({ pressed }) => [styles.mainBtn, { backgroundColor: colors.palette.softHankoRed }, pressed && styles.btnPressed]}
            onPress={() => handleStart()}
          >
            <Ionicons name="play" size={24} color={colors.white} />
            <Text style={styles.mainBtnText}>Start Learning</Text>
          </Pressable>
        </View>

        {/* Analytics Hub */}
        <AnalyticsHub weeklyData={analytics.weekly} retentionRate={analytics.rate} />

        {/* Navigation Grid */}
        <View style={[styles.grid, isDesktop && styles.desktopGrid]}>
          <HubCard
            title="Import Deck"
            icon="cloud-upload-outline"
            onPress={() => {}}
            colors={colors}
          />
          <HubCard
            title="Settings"
            icon="settings-outline"
            onPress={() => router.push('/(tabs)/profile')}
            colors={colors}
          />
        </View>

        {/* Learning Path */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Learning Path</Text>
        <View style={styles.pathContainer}>
          {path.map((l, i) => (
            <PathNode 
              key={l.id} 
              index={i} 
              level={l.title} 
              isCompleted={l.isCompleted} 
              isLocked={l.isLocked} 
              onPress={() => handleStart(cards.filter(c => l.cardIds.includes(c.id)))} 
            />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const HubCard = ({ title, icon, onPress, colors }: any) => (
  <Pressable 
    style={({ pressed }) => [styles.card, { backgroundColor: colors.surface }, pressed && styles.btnPressed]} 
    onPress={onPress}
  >
    <View style={[styles.iconCircle, { backgroundColor: colors.palette.softAizomeIndigo + '20' }]}>
      <Ionicons name={icon} size={24} color={colors.palette.softAizomeIndigo} />
    </View>
    <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  desktopContent: { maxWidth: 800, alignSelf: 'center', width: '100%' },
  hubBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  greeting: { fontSize: 28, fontFamily: 'NotoSansJP_700Bold', letterSpacing: -0.5 },
  streakText: { fontSize: 14, fontFamily: 'NotoSansJP_700Bold', marginTop: 4, flexDirection: 'row', alignItems: 'center' },
  themeToggle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(128,128,128,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  hero: { borderRadius: 32, padding: 32, marginBottom: 32, boxShadow: '0px 15px 30px rgba(0,0,0,0.2)', elevation: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  heroTitle: { fontSize: 22, fontFamily: 'NotoSansJP_700Bold', marginBottom: 24, letterSpacing: -0.5 },
  goalInfo: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 32 },
  goalText: { fontSize: 13, fontFamily: 'NotoSansJP_400Regular' },
  cardsLeft: { fontSize: 13, fontFamily: 'NotoSansJP_700Bold' },
  mainBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 24, gap: 12 },
  mainBtnText: { color: '#FFF', fontSize: 16, fontFamily: 'NotoSansJP_700Bold', letterSpacing: 1 },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  grid: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  desktopGrid: { flexDirection: 'row' },
  card: { flex: 1, padding: 20, borderRadius: 28, alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 13, fontFamily: 'NotoSansJP_700Bold' },
  pathSection: { marginTop: 10 },
  sectionTitle: { fontSize: 20, fontFamily: 'NotoSansJP_700Bold', marginBottom: 24, letterSpacing: -0.5 },
  pathContainer: { alignItems: 'center' },
});
