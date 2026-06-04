import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';
import { StatCard } from '../../components/cards/StatCard';
import { Button } from '../../components/ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { MOCK_USER_STATS } from '../../constants/MockData';
import { ankiImporter } from '../../engine/AnkiImporter';

export default function ProfileScreen() {
  const { user, session } = useAppStore();
  const [isImporting, setIsImporting] = useState(false);

  const handleAnkiImport = async () => {
    setIsImporting(true);
    try {
      const result = await ankiImporter.importDeck();
      if (result) {
        Alert.alert(
          'Import Réussi !',
          `Le deck "${result.deckName}" a été importé avec ${result.cardCount} cartes et ${result.mediaCount} fichiers média.`
        );
      }
    } catch (error) {
      Alert.alert('Erreur d\'import', 'Impossible d\'importer le deck Anki. Vérifiez que le fichier est un .apkg valide.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Profile Info */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>U</Text>
          </View>
          <Text style={styles.userName}>Utilisateur</Text>
          <Text style={styles.userLevel}>Niveau {user.level}</Text>
        </View>

        {/* Detailed Stats */}
        <Text style={styles.sectionTitle}>Statistiques Détaillées</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard 
              label="XP Total" 
              value={user.xpTotal} 
              icon="star" 
              iconColor={Colors.warning} 
            />
            <StatCard 
              label="Série Actuelle" 
              value={`${user.streakDays} j`} 
              icon="flame" 
              iconColor="#FF5252" 
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard 
              label="Cartes Révisées" 
              value={user.totalReviews} 
              icon="albums" 
              iconColor={Colors.primary} 
            />
            <StatCard 
              label="Cartes Apprises" 
              value={MOCK_USER_STATS.cardsLearned}
              icon="checkmark-circle" 
              iconColor={Colors.success} 
            />
          </View>
        </View>

        {/* Actions */}
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.settingsCard}>
          {isImporting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Importation du deck Anki...</Text>
            </View>
          ) : (
            <Button 
              title="Importer un deck Anki (.apkg)" 
              variant="outline"
              onPress={handleAnkiImport}
              style={styles.importBtn}
            />
          )}
        </View>

        {/* Settings */}
        <Text style={styles.sectionTitle}>Paramètres</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Objectif Quotidien</Text>
              <Text style={styles.settingDescription}>{session.goalValue} cartes</Text>
            </View>
            <View style={styles.goalControls}>
              <Text style={styles.goalBtn}>-</Text>
              <Text style={styles.goalBtn}>+</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>Rappel de révision</Text>
            </View>
            <Switch 
              trackColor={{ false: Colors.surfaceLight, true: Colors.primary }}
              thumbColor="#f4f3f4"
              ios_backgroundColor={Colors.surfaceLight}
              value={true}
            />
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: 40,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  userLevel: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    marginTop: 10,
  },
  statsGrid: {
    gap: 12,
    marginBottom: 30,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceLight,
    marginVertical: 12,
  },
  goalControls: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 8,
    overflow: 'hidden',
  },
  goalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: Colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  importBtn: {
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  loadingText: {
    color: Colors.textMuted,
    marginTop: 10,
    fontSize: 14,
  },
});
