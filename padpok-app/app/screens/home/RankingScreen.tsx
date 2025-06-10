import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { HomeTabScreenProps } from '@app/types/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@app/lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SPACING } from '@app/constants/theme';
import SegmentedControl from '@app/components/SegmentedControl';

type Props = HomeTabScreenProps<'Ranking'>;

interface User {
  id: string;
  username: string;
  stats: {
    points: number;
    matchesPlayed: number;
    wins: number;
    losses: number;
  };
}

type SortBy = 'points' | 'matchesPlayed' | 'wins';

const sortOptions = [
  { label: 'Puntos', value: 'points' },
  { label: 'Partidos', value: 'matchesPlayed' },
  { label: 'Victorias', value: 'wins' },
];

const RankingScreen: React.FC<Props> = ({ navigation }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('points');

  useEffect(() => {
    fetchUsers();
  }, [sortBy]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const usersData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const stats = data.stats || {
          points: 0,
          matchesPlayed: 0,
          wins: 0,
          losses: 0
        };
        return {
          id: doc.id,
          username: data.username || 'Usuario',
          stats
        };
      }) as User[];
      
      const sortedUsers = usersData.sort((a, b) => {
        if (sortBy === 'points') {
          return b.stats.points - a.stats.points;
        } else if (sortBy === 'matchesPlayed') {
          return b.stats.matchesPlayed - a.stats.matchesPlayed;
        } else {
          return b.stats.wins - a.stats.wins;
        }
      });
      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item, index }: { item: User; index: number }) => {
    const isTopThree = index < 3;
    const medalColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32';
    return (
      <View style={styles.userCard}>
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <Ionicons 
              name="medal" 
              size={SIZES.lg} 
              color={medalColor} 
            />
          ) : (
            <Text style={styles.rankNumber}>{index + 1}</Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={SIZES.md} color={COLORS.primary} />
              <Text style={styles.statText}>{item.stats.points} pts.</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="tennisball" size={SIZES.md} color={COLORS.primary} />
              <Text style={styles.statText}>{item.stats.matchesPlayed} part.</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={SIZES.md} color={COLORS.primary} />
              <Text style={styles.statText}>{item.stats.wins} vict.</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />
      <View style={styles.container}>
        <View style={styles.header}>
          <SegmentedControl
            options={sortOptions.map(o => o.label)}
            value={sortOptions.find(o => o.value === sortBy)?.label || sortOptions[0].label}
            onChange={label => {
              const found = sortOptions.find(o => o.label === label);
              if (found) setSortBy(found.value as SortBy);
            }}
            style={{ marginBottom: SPACING.md }}
          />
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  listContent: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30,58,138,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  rankNumber: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statText: {
    fontSize: SIZES.sm,
    color: COLORS.gray,
    fontFamily: FONTS.medium,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RankingScreen; 