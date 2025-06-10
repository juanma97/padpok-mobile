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
  RefreshControl,
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@app/types/navigation';
import { Match } from '@app/types/models';
import { query, orderBy, getDocs, where, Timestamp, collection, DocumentData, doc, getDoc } from 'firebase/firestore';
import { db } from '@app/lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@app/lib/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@app/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Matches'>;
type RootNavigationProp = StackNavigationProp<RootStackParamList>;

// Helper para obtener el día de la semana
const getDayOfWeek = (date: Date): string => {
  const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  return days[date.getDay()];
};

// Helper para obtener la franja horaria
const getTimeSlot = (date: Date): string => {
  const hour = date.getHours();
  if (hour >= 7 && hour <= 12) return 'Mañana';
  if (hour >= 16 && hour < 21) return 'Tarde';
  if (hour >= 22 && hour < 24) return 'Noche';
  return 'Otro'; // O manejar de otra forma si no cae en ninguna franja
};

const MatchesScreen: React.FC<Props> = ({ navigation, route }) => {
  const rootNavigation = useNavigation<RootNavigationProp>();
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
  const [selectedTab, setSelectedTab] = useState<'disponibles' | 'mis'>('disponibles');

  const { user } = useAuth();

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const matchesRef = collection(db, 'matches');
      const q = query(
        matchesRef,
        orderBy('date', 'asc') 
      );
      
      const querySnapshot = await getDocs(q);
      const matchesData = querySnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          ...data,
          id: docSnapshot.id,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as Match;
      });
      setMatches(matchesData);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!user) {
        // Resetear preferencias si el usuario cierra sesión
        setUserPreferences({ days: [], hours: [], level: null });
        setShowOnlyPreferences(false); // Opcional: desactivar filtro si no hay usuario
        return;
      }
      
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserPreferences({
            days: userData?.availability?.days || [],
            hours: userData?.availability?.hours || [],
            level: userData?.level || null
          });
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      }
    };

    fetchUserPreferences();
  }, [user]);

  useEffect(() => {
    if (route.params?.refresh) {
      fetchMatches();
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params?.refresh, navigation, fetchMatches]);

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
    if (!user) {
       Alert.alert(
        'Iniciar sesión requerido',
        'Debes iniciar sesión para usar los filtros de preferencias.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar sesión', onPress: () => rootNavigation.navigate('Login')}
        ]
      );
      return;
    }
    setShowOnlyPreferences(prev => !prev);
  };

  // Partidos disponibles (solo futuros)
  const filteredAndSortedMatches = React.useMemo(() => {
    let processedMatches = [...matches];

    // Filtrar por fecha futura
    processedMatches = processedMatches.filter(match => match.date >= new Date());

    if (showOnlyPreferences && user && userPreferences) {
      processedMatches = processedMatches.filter(match => {
        // Filtrar por nivel
        if (userPreferences.level && match.level !== userPreferences.level) {
          return false;
        }
        // Filtrar por días
        if (userPreferences.days && userPreferences.days.length > 0) {
          const matchDay = getDayOfWeek(match.date);
          if (!userPreferences.days.includes(matchDay)) {
            return false;
          }
        }
        // Filtrar por horas
        if (userPreferences.hours && userPreferences.hours.length > 0) {
          const matchHour = match.date.getHours();
          const userHours = userPreferences.hours.map(h => parseInt(h.split(':')[0], 10));
          if (!userHours.includes(matchHour)) {
            return false;
          }
        }
        return true;
      });
    }

    return [...processedMatches].sort((a, b) => {
      const dateA = a.date?.getTime() || 0;
      const dateB = b.date?.getTime() || 0;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [matches, sortOrder, showOnlyPreferences, user, userPreferences]);


  // Mis partidos (todos los que me he unido)
  const myMatches = React.useMemo(() => {
    if (!user) return [];
    return [...matches].filter(match => match.playersJoined.includes(user.uid)).sort((a, b) => {
      const dateA = a.date?.getTime() || 0;
      const dateB = b.date?.getTime() || 0;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [matches, user, sortOrder]);

  const handleMatchPress = (match: Match) => {
    if (!user) {
      Alert.alert(
        'Iniciar sesión requerido',
        'Debes iniciar sesión para ver los detalles del partido',
        [
          {
            text: 'Cancelar',
            style: 'cancel'
          },
          {
            text: 'Iniciar sesión',
            onPress: () => rootNavigation.navigate('Login')
          }
        ]
      );
      return;
    }
    navigation.navigate('MatchDetails', { matchId: match.id });
  };

  const renderMatchItem = ({ item }: { item: Match }) => (
    <TouchableOpacity
      style={styles.matchItem}
      onPress={() => handleMatchPress(item)}
    >
      <View style={styles.matchHeader}>
        <Text style={styles.matchTitle}>{item.title}</Text>
        <Text style={styles.matchDate}>
          {item.date.toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
      <View style={styles.matchInfo}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.location}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.playersJoined.length}/{item.playersNeeded} jugadores
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="trophy-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.level}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
        {/* Controles de filtro y orden */}
        <View style={styles.header}>
          <View style={styles.controlsContainer}>
            {user && selectedTab === 'disponibles' && (
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
        {/* Tabs */}
        {user && <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'disponibles' && styles.tabSelected]}
            onPress={() => setSelectedTab('disponibles')}
          >
            <Text style={[styles.tabText, selectedTab === 'disponibles' && styles.tabTextSelected]}>Disponibles</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'mis' && styles.tabSelected]}
            onPress={() => setSelectedTab('mis')}
          >
            <Text style={[styles.tabText, selectedTab === 'mis' && styles.tabTextSelected]}>Mis Partidos</Text>
          </TouchableOpacity>
        </View>}
        {/* Lista según tab */}
        {selectedTab === 'disponibles' ? (
          filteredAndSortedMatches.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay partidos disponibles proximamente</Text>
            </View>
          ) : (
            <FlatList
              data={filteredAndSortedMatches}
              renderItem={renderMatchItem}
              keyExtractor={item => item.id}
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
          )
        ) : (
          myMatches.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No te has unido a ningún partido</Text>
            </View>
          ) : (
            <FlatList
              data={myMatches}
              renderItem={renderMatchItem}
              keyExtractor={item => item.id}
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
          )
        )}
        {/* FAB para crear partido */}
        {user && <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateMatch')}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>}
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
    backgroundColor: '#f5f5f5',
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
  matchItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e3a8a',
    flex: 1,
  },
  matchDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  matchInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    margin: 16,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabSelected: {
    backgroundColor: '#1e3a8a',
  },
  tabText: {
    color: '#1e3a8a',
    fontWeight: '600',
    fontSize: 16,
  },
  tabTextSelected: {
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#1e3a8a',
    borderRadius: 50,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MatchesScreen; 