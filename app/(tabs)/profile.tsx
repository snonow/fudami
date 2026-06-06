import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';
import { StatCard } from '../../components/cards/StatCard';
import { Button } from '../../components/ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { ankiImporter } from '../../engine/AnkiImporter';

export default function ProfileScreen() {
  const { user, session } = useAppStore();
  const [loading, setLoading] = useState(false);

  const onImport = async () => {
    setLoading(true);
    try {
      const res = await ankiImporter.importDeck();
      if (res) Alert.alert('Succès', `Deck "${res.deckName}" importé (${res.cardCount} cartes).`);
    } catch (e) { Alert.alert('Erreur', 'Import échoué.'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={styles.header}>
          <View style={styles.avatar}><Text style={styles.avatarT}>U</Text></View>
          <Text style={styles.name}>Utilisateur</Text>
          <Text style={styles.lvl}>Niveau {user.level}</Text>
        </View>

        <Text style={styles.title}>Statistiques</Text>
        <View style={{ gap: 12, marginBottom: 30 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatCard label="XP Total" value={user.xpTotal} icon="star" iconColor={Colors.warning} />
            <StatCard label="Série" value={`${user.streakDays} j`} icon="flame" iconColor="#FF5252" />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatCard label="Révisions" value={user.totalReviews} icon="albums" iconColor={Colors.primary} />
            <StatCard label="Niveau" value={user.level} icon="trending-up" iconColor={Colors.success} />
          </View>
        </View>

        <Text style={styles.title}>Actions</Text>
        <View style={styles.card}>
          {loading ? <ActivityIndicator color={Colors.primary} /> : <Button title="Importer un deck Anki (.apkg)" variant="outline" onPress={onImport} />}
        </View>

        <Text style={styles.title}>Paramètres</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View><Text style={styles.label}>Objectif</Text><Text style={styles.sub}>{session.goalValue} cartes</Text></View>
            <Switch value={true} trackColor={{ false: Colors.surfaceLight, true: Colors.primary }} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { alignItems: 'center', marginVertical: 30 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary, marginBottom: 10 },
  avatarT: { fontSize: 32, color: Colors.primary, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', color: Colors.text },
  lvl: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 12, marginTop: 10 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 15, color: Colors.text, fontWeight: '600' },
  sub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
});
