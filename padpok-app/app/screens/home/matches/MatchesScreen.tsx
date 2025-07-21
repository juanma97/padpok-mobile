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
import { query, orderBy, getDocs, where, Timestamp, collection, DocumentData, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@app/lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@app/lib/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@app/types';
import { COLORS, FONTS, SIZES, SPACING } from '@app/constants/theme';
import MatchCard from '@app/components/MatchCard';
import { createNotification } from '@app/lib/notifications';

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
      const now = new Date();
      const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      // Cancelar partidos próximos a menos de 24h y no completos ni cancelados
      await Promise.all(querySnapshot.docs.map(async docSnapshot => {
        const data = docSnapshot.data();
        if (
          data.status !== 'cancelled' &&
          data.status !== 'completed' &&
          data.date.toDate() <= minDate &&
          data.playersJoined.length < data.playersNeeded
        ) {
          await updateDoc(doc(db, 'matches', docSnapshot.id), { status: 'cancelled' });
          await createNotification(
            'match_cancelled',
            docSnapshot.id,
            data.title,
            data.createdBy,
            { reason: 'No se completaron los jugadores 24h antes del inicio.' }
          );
        }
      }));
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
    processedMatches = processedMatches.filter(match => 
      match.date >= new Date() &&
      match.status !== 'cancelled' &&
      match.status !== 'completed'
    );

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
    <MatchCard match={item} onPress={() => handleMatchPress(item)} />
  );

  // Icono para estado vacío
  const EmptyIcon = () => (
    <View style={styles.emptyIconWrapper}>
      <Ionicons name="tennisball-outline" size={SIZES.xxl * 2} color={COLORS.lightGray} />
    </View>
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.container}>
        {/* Controles de filtro y orden */}
        <View style={styles.header}>
          <View style={styles.controlsContainer}>
            {user && selectedTab === 'disponibles' && (
              <TouchableOpacity 
                style={[styles.filterButton, showOnlyPreferences && styles.filterButtonActive]}
                onPress={togglePreferencesFilter}
                activeOpacity={0.85}
              >
                <Ionicons 
                  name={showOnlyPreferences ? 'filter' : 'filter-outline'} 
                  size={SIZES.lg} 
                  color={showOnlyPreferences ? COLORS.white : COLORS.primary} 
                />
                <Text
                  style={[styles.filterButtonText, showOnlyPreferences && styles.filterButtonTextActive]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {showOnlyPreferences ? 'Filtros activos' : 'Filtrar por preferencias'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={toggleSortOrder}
              activeOpacity={0.85}
            >
              <Ionicons 
                name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
                size={SIZES.lg} 
                color={COLORS.primary} 
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
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, selectedTab === 'disponibles' && styles.tabTextSelected]}>Disponibles</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'mis' && styles.tabSelected]}
            onPress={() => setSelectedTab('mis')}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, selectedTab === 'mis' && styles.tabTextSelected]}>Mis Partidos</Text>
          </TouchableOpacity>
        </View>}
        {/* Lista según tab */}
        {selectedTab === 'disponibles' ? (
          filteredAndSortedMatches.length === 0 ? (
            <View style={styles.emptyContainer}>
              <EmptyIcon />
              <Text style={styles.emptyText}>No hay partidos disponibles próximamente</Text>
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
                  colors={[COLORS.primary]}
                  tintColor={COLORS.primary}
                />
              }
            />
          )
        ) : (
          myMatches.length === 0 ? (
            <View style={styles.emptyContainer}>
              <EmptyIcon />
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
                  colors={[COLORS.primary]}
                  tintColor={COLORS.primary}
                />
              }
            />
          )
        )}
        {/* FAB para crear partido */}
        {user && <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateMatch')} activeOpacity={0.85}>
          <Ionicons name="add" size={SIZES.xl} color={COLORS.white} />
        </TouchableOpacity>}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  pageTitleWrapper: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pageTitle: {
    fontSize: SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.sm,
    maxWidth: '60%',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  filterButtonText: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
    fontSize: SIZES.md,
  },
  filterButtonTextActive: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  sortButtonText: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
    fontSize: SIZES.md,
  },
  listContent: {
    padding: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.md,
  },
  emptyIconWrapper: {
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: SIZES.md,
    color: COLORS.gray,
    textAlign: 'center',
    fontFamily: FONTS.medium,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    margin: SPACING.lg,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabSelected: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  tabText: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
    fontSize: SIZES.md,
  },
  tabTextSelected: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xxl,
    right: SPACING.xxl,
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
});

export default MatchesScreen; 