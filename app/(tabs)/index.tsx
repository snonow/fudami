import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Colors } from '../../constants/Colors';
import { StatCard } from '../../components/cards/StatCard';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useAppStore } from '../../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_USER_STATS } from '../../constants/MockData';

export default function HomeScreen() {
  const { user, session } = useAppStore();

  // Use mock data for display purposes
  const { dailyProgress, cardsRemaining, cardsLearned, accuracy } = MOCK_USER_STATS;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour !';
    if (hour < 18) return 'Bon après-midi !';
    return 'Bonsoir !';
  };

  const getMotivationMessage = () => {
    if (dailyProgress === 0) return "C'est le moment de commencer !";
    if (dailyProgress < 1) return "Tu y es presque, continue comme ça !";
    return "Objectif atteint ! Félicitations !";
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
            <Text style={styles.levelText}>Lvl {user.level}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard 
            label="Série" 
            value={`${user.streakDays} j`} 
            icon="flame" 
            iconColor="#FF9800" 
          />
          <StatCard 
            label="Total XP" 
            value={user.xpTotal} 
            icon="star" 
            iconColor="#FFD600" 
          />
        </View>

        {/* Daily Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Objectif du jour</Text>
            <Text style={styles.progressValue}>{Math.round(dailyProgress * 100)}%</Text>
          </View>
          
          <ProgressBar progress={dailyProgress} height={16} />
          
          <Text style={styles.progressNote}>
            {cardsRemaining} cartes restantes pour aujourd'hui
          </Text>

          <View style={styles.motivationBox}>
            <Ionicons name="sparkles" size={20} color={Colors.warning} />
            <Text style={styles.motivationText}>{getMotivationMessage()}</Text>
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <Text style={styles.sectionTitle}>Maîtrise le japonais</Text>
          <Button 
            title="Reprendre l'étude" 
            onPress={() => console.log('Start session')} 
            style={styles.mainButton}
          />
          <Button 
            title="Explorer de nouvelles cartes" 
            onPress={() => console.log('Explore')} 
            variant="outline"
          />
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{user.totalReviews}</Text>
            <Text style={styles.quickStatLabel}>Révisions</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{accuracy}</Text>
            <Text style={styles.quickStatLabel}>Précision</Text>
          </View>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{cardsLearned}</Text>
            <Text style={styles.quickStatLabel}>Appris</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  greeting: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  levelBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  levelText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
    elevation: 5,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  progressTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  progressValue: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  progressNote: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
  motivationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 214, 0, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  motivationText: {
    color: Colors.warning,
    marginLeft: 10,
    fontWeight: '600',
    fontSize: 14,
  },
  ctaSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  mainButton: {
    marginBottom: 12,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatValue: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  quickStatLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
