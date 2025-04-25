import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@app/types';
import { collection, query, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@app/lib/firebase';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<HomeStackParamList, 'Ranking'>;

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
        // Aseguramos que todos los usuarios tengan la estructura de stats
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
      
      // Ordenamos los usuarios según el criterio seleccionado
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
              size={24} 
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
              <Ionicons name="trophy" size={16} color="#1e3a8a" />
              <Text style={styles.statText}>{item.stats.points} pts</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="tennisball" size={16} color="#1e3a8a" />
              <Text style={styles.statText}>{item.stats.matchesPlayed} partidos</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={16} color="#1e3a8a" />
              <Text style={styles.statText}>{item.stats.wins} victorias</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ranking de Jugadores</Text>
          <View style={styles.sortContainer}>
            <TouchableOpacity
              style={[
                styles.sortButton,
                sortBy === 'points' && styles.sortButtonActive
              ]}
              onPress={() => setSortBy('points')}
            >
              <Text style={[
                styles.sortButtonText,
                sortBy === 'points' && styles.sortButtonTextActive
              ]}>
                Puntos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortButton,
                sortBy === 'matchesPlayed' && styles.sortButtonActive
              ]}
              onPress={() => setSortBy('matchesPlayed')}
            >
              <Text style={[
                styles.sortButtonText,
                sortBy === 'matchesPlayed' && styles.sortButtonTextActive
              ]}>
                Partidos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortButton,
                sortBy === 'wins' && styles.sortButtonActive
              ]}
              onPress={() => setSortBy('wins')}
            >
              <Text style={[
                styles.sortButtonText,
                sortBy === 'wins' && styles.sortButtonTextActive
              ]}>
                Victorias
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1e3a8a" />
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
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  sortButtonActive: {
    backgroundColor: '#1e3a8a',
  },
  sortButtonText: {
    color: '#4b5563',
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30,58,138,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#4b5563',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RankingScreen; 