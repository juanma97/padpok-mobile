import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuth } from '@app/lib/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@app/lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SPACING } from '@app/constants/theme';

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
    <View style={{
      backgroundColor: COLORS.white,
      padding: SPACING.lg,
      borderRadius: 20,
      marginBottom: SPACING.md,
      borderWidth: 2,
      borderColor: item.result === 'victoria' ? COLORS.success : COLORS.error,
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.lg,
    }}>
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: item.result === 'victoria' ? COLORS.success + '22' : COLORS.error + '22',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
        borderWidth: 2,
        borderColor: item.result === 'victoria' ? COLORS.success : COLORS.error,
      }}>
        <Ionicons name="tennisball-outline" size={SIZES.lg} color={item.result === 'victoria' ? COLORS.success : COLORS.error} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontSize: SIZES.sm, color: COLORS.gray, fontFamily: FONTS.medium }}>
            {new Date(item.date).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </Text>
          <View style={{
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.xs,
            borderRadius: 16,
            backgroundColor: item.result === 'victoria' ? COLORS.success : COLORS.error,
          }}>
            <Text style={{
              fontSize: SIZES.xs,
              fontFamily: FONTS.bold,
              color: COLORS.white,
              letterSpacing: 1,
            }}>
              {item.result.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: SIZES.md, fontFamily: FONTS.bold, color: COLORS.primary, marginBottom: 2 }}>{item.title}</Text>
        <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 6, borderRadius: 1 }} />
        <Text style={{ fontSize: SIZES.sm, color: COLORS.gray, fontFamily: FONTS.regular }}>{item.score}</Text>
      </View>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.sm,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        zIndex: 10,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6, marginRight: 8 }}>
          <Ionicons name="arrow-back" size={SIZES.lg} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.primary }}>Historial de Partidos</Text>
      </View>
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        {matches.length > 0 ? (
          <FlatList
            data={matches}
            renderItem={renderMatch}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: SPACING.lg }}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Ionicons name="tennisball-outline" size={SIZES.xl} color={COLORS.gray} />
            <Text style={{ fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.gray, marginTop: SPACING.lg, marginBottom: SPACING.sm }}>
              No hay partidos en tu historial
            </Text>
            <Text style={{ fontSize: SIZES.md, color: COLORS.gray, fontFamily: FONTS.regular, textAlign: 'center' }}>
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