import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuth } from '@app/lib/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@app/lib/firebase';
import { Ionicons } from '@expo/vector-icons';

type MatchHistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MatchHistory'>;

type HistoryMatch = {
  id: string;
  date: Date;
  title: string;
  result: 'victoria' | 'derrota';
  score: string;
};

export default function MatchHistoryScreen() {
  const navigation = useNavigation<MatchHistoryScreenNavigationProp>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<HistoryMatch[]>([]);

  useEffect(() => {
    fetchMatchHistory();
  }, [user]);

  const fetchMatchHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const matchesRef = collection(db, 'matchHistory');
      const q = query(
        matchesRef,
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const historyMatches: HistoryMatch[] = [];

      querySnapshot.forEach((doc) => {
        const match = doc.data() as any;
        if (match) {
          const userTeam = match.team;
          const isWinner = match.score.winner === userTeam;
          
          const scoreString = `${match.score.set1.team1}-${match.score.set1.team2}, ${match.score.set2.team1}-${match.score.set2.team2}${
            match.score.set3 ? `, ${match.score.set3.team1}-${match.score.set3.team2}` : ''
          }`;

          historyMatches.push({
            id: doc.id,
            date: match.date.toDate(),
            title: match.title,
            result: isWinner ? 'victoria' : 'derrota',
            score: scoreString,
          });
        }
      });

      setMatches(historyMatches);
    } catch (error) {
      console.error('Error fetching match history:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMatch = ({ item }: { item: HistoryMatch }) => (
    <View style={styles.matchItem}>
      <View style={styles.matchHeader}>
        <Text style={styles.date}>{new Date(item.date).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</Text>
        <View style={[
          styles.resultBadge,
          item.result === 'victoria' ? styles.victoryBadge : styles.defeatBadge
        ]}>
          <Text style={[
            styles.resultText,
            item.result === 'victoria' ? styles.victoryText : styles.defeatText
          ]}>
            {item.result.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.score}>{item.score}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Partidos</Text>
      </View>
      <View style={styles.container}>
        {matches.length > 0 ? (
          <FlatList
            data={matches}
            renderItem={renderMatch}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="tennisball-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No hay partidos en tu historial</Text>
            <Text style={styles.emptySubtext}>
              Los partidos completados aparecerán aquí
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    zIndex: 10,
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  matchItem: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  victoryBadge: {
    backgroundColor: '#22C55E15',
  },
  defeatBadge: {
    backgroundColor: '#EF444415',
  },
  resultText: {
    fontSize: 12,
    fontWeight: '600',
  },
  victoryText: {
    color: '#22C55E',
  },
  defeatText: {
    color: '#EF4444',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  score: {
    fontSize: 14,
    color: '#4b5563',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
}); 