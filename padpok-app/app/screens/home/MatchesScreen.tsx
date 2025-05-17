import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, Match } from '@app/types';
import { collection, query, orderBy, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '@app/lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@app/lib/AuthContext';
import { doc, getDoc } from 'firebase/firestore';

type Props = NativeStackScreenProps<HomeStackParamList, 'Matches'>;

const MatchesScreen: React.FC<Props> = ({ navigation }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showOnlyPreferences, setShowOnlyPreferences] = useState(false);
  const [userPreferences, setUserPreferences] = useState<{
    days: string[];
    hours: string[];
    level: string | null;
  }>({
    days: [],
    hours: [],
    level: null
  });

  const { user } = useAuth();

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!user) return;
      
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserPreferences({
            days: userData.availability?.days || [],
            hours: userData.availability?.hours || [],
            level: userData.level || null
          });
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      }
    };

    fetchUserPreferences();
  }, [user]);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const matchesRef = collection(db, 'matches');
      let q = query(matchesRef, where('date', '>=', Timestamp.now()), orderBy('date', 'asc'));
      
      // Si el usuario quiere ver solo partidos que coincidan con sus preferencias
      if (showOnlyPreferences && user) {
        const conditions = [];
        
        // Filtrar por nivel si el usuario tiene uno definido
        if (userPreferences.level) {
          conditions.push(where('level', '==', userPreferences.level));
        }
        
        // Filtrar por días disponibles
        if (userPreferences.days.length > 0) {
          // Convertir la fecha del partido a día de la semana
          conditions.push(where('date', '>=', Timestamp.now()));
        }
        
        q = query(matchesRef, ...conditions, orderBy('date', 'asc'));
      }
      
      const querySnapshot = await getDocs(q);
      
      const matchesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date()
        };
      }) as Match[];

      // Filtrar por horas disponibles si es necesario
      let filteredMatches = matchesData;
      if (showOnlyPreferences && userPreferences.hours.length > 0) {
        filteredMatches = matchesData.filter(match => {
          const matchDate = match.date;
          const matchHour = matchDate.getHours();
          const matchDay = matchDate.getDay();
          
          // Convertir el día de la semana a formato de la app (L, M, X, etc.)
          const dayMap = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
          const matchDayStr = dayMap[matchDay];
          
          // Convertir la hora del partido a formato de la app (HH:00)
          const matchHourStr = `${matchHour.toString().padStart(2, '0')}:00`;
          
          return userPreferences.days.includes(matchDayStr) && 
                 userPreferences.hours.includes(matchHourStr);
        });
      }
      
      setMatches(filteredMatches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showOnlyPreferences, userPreferences]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMatches();
  }, [fetchMatches]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const togglePreferencesFilter = () => {
    setShowOnlyPreferences(prev => !prev);
  };

  const sortedMatches = React.useMemo(() => {
    return [...matches].sort((a, b) => {
      const dateA = a.date?.getTime() || 0;
      const dateB = b.date?.getTime() || 0;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [matches, sortOrder]);

  const renderMatchCard = ({ item }: { item: Match }) => {
    const formattedDate = item.date ? item.date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Fecha no disponible';

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('MatchDetails', { match: item })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={styles.playersCount}>
            <Text style={styles.playersCountText}>
              {item.playersJoined.length}/{item.playersNeeded}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#1e3a8a" />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#1e3a8a" />
            <Text style={styles.infoText}>{formattedDate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={20} color="#1e3a8a" />
            <Text style={styles.infoText}>{item.ageRange}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Partidos Disponibles</Text>
          <View style={styles.controlsContainer}>
            {user && (
              <TouchableOpacity 
                style={[styles.filterButton, showOnlyPreferences && styles.filterButtonActive]}
                onPress={togglePreferencesFilter}
              >
                <Ionicons 
                  name={showOnlyPreferences ? 'filter' : 'filter-outline'} 
                  size={20} 
                  color={showOnlyPreferences ? '#fff' : '#1e3a8a'} 
                />
                <Text style={[styles.filterButtonText, showOnlyPreferences && styles.filterButtonTextActive]}>
                  {showOnlyPreferences ? 'Filtros activos' : 'Filtrar por preferencias'}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={toggleSortOrder}
            >
              <Ionicons 
                name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
                size={20} 
                color="#1e3a8a" 
              />
              <Text style={styles.sortButtonText}>
                {sortOrder === 'asc' ? 'Más antiguos' : 'Más recientes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="tennisball-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>
              {showOnlyPreferences 
                ? 'No hay partidos que coincidan con tus preferencias'
                : 'No hay partidos disponibles'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={sortedMatches}
            renderItem={renderMatchCard}
            keyExtractor={(item, index) => item.id || `match-${index}`}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#1e3a8a']}
                tintColor="#1e3a8a"
              />
            }
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  filterButtonActive: {
    backgroundColor: '#1e3a8a',
  },
  filterButtonText: {
    color: '#1e3a8a',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  sortButtonText: {
    color: '#1e3a8a',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  playersCount: {
    backgroundColor: 'rgba(30,58,138,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  playersCountText: {
    color: '#1e3a8a',
    fontWeight: '600',
  },
  cardContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4b5563',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default MatchesScreen; 