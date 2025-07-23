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
import { getPendingResultsCount, createTestMatches } from '@app/lib/matches';

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

  const { user } = useAuth();

  // Función para cargar las preferencias del usuario desde su documento
  const fetchUserPreferences = useCallback(async () => {
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
      } else {
        setUserPreferences({
          days: [],
          hours: [],
          level: null
        });
      }
    } catch (error) {
      // Error fetching user preferences
    }
  }, [user]);
  const [selectedTab, setSelectedTab] = useState<'disponibles' | 'mis'>('disponibles');
  const [pendingResultsCount, setPendingResultsCount] = useState(0);

  // Función para obtener el conteo de partidos pendientes de resultado
  const fetchPendingResultsCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await getPendingResultsCount(user.uid);
      setPendingResultsCount(count);
    } catch (error) {
      // Error fetching pending results count
    }
  }, [user]);

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
      // Error fetching matches
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    fetchPendingResultsCount();
    fetchUserPreferences();
  }, [fetchMatches, fetchPendingResultsCount, fetchUserPreferences]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchMatches(),
      fetchPendingResultsCount(),
      fetchUserPreferences()
    ]);
    setRefreshing(false);
  }, [fetchMatches, fetchPendingResultsCount, fetchUserPreferences]);

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
    
    const userMatches = [...matches].filter(match => match.playersJoined.includes(user.uid));
    
    // Separar partidos pendientes de resultado y ordenar
    const pendingMatches = userMatches.filter(match => {
      if (match.score) return false; // Ya tiene resultado
      const matchDate = match.date instanceof Date ? match.date : (match.date as any).toDate();
      const now = new Date();
      return matchDate < now && match.playersJoined.length >= match.playersNeeded;
    });
    
    const otherMatches = userMatches.filter(match => {
      if (match.score) return true; // Tiene resultado
      const matchDate = match.date instanceof Date ? match.date : (match.date as any).toDate();
      const now = new Date();
      return matchDate >= now || match.playersJoined.length < match.playersNeeded;
    });
    
    // Ordenar por fecha
    const sortByDate = (a: Match, b: Match) => {
      const dateA = a.date instanceof Date ? a.date : (a.date as any).toDate();
      const dateB = b.date instanceof Date ? b.date : (b.date as any).toDate();
      return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
    };
    
    return [...pendingMatches.sort(sortByDate), ...otherMatches.sort(sortByDate)];
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

  // Separar partidos pendientes de los demás
  const pendingMatches = myMatches.filter(match => {
    if (match.score) return false;
    const matchDate = match.date instanceof Date ? match.date : (match.date as any).toDate();
    const now = new Date();
    return matchDate < now && match.playersJoined.length >= match.playersNeeded;
  });

  const otherMatches = myMatches.filter(match => {
    if (match.score) return true;
    const matchDate = match.date instanceof Date ? match.date : (match.date as any).toDate();
    const now = new Date();
    return !(matchDate < now && match.playersJoined.length >= match.playersNeeded);
  });

  // Componente para renderizar partido pendiente en el carrusel
  const renderPendingMatch = ({ item }: { item: Match }) => (
    <TouchableOpacity
      style={styles.pendingMatchCard}
      onPress={() => handleMatchPress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.pendingMatchHeader}>
        <Text style={styles.pendingMatchTitle}>{item.title}</Text>
        <View style={styles.pendingResultBadge}>
          <Ionicons name="add-circle-outline" size={SIZES.sm} color={COLORS.white} />
          <Text style={styles.pendingResultText}>Añadir Resultado</Text>
        </View>
      </View>
      <View style={styles.pendingMatchInfo}>
        <Text style={styles.pendingMatchLocation}>{item.location}</Text>
        <Text style={styles.pendingMatchDate}>
          {item.date instanceof Date 
            ? item.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
            : (item.date as any).toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
          }
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Componente del carrusel de partidos pendientes
  const PendingMatchesCarousel = () => {
    if (pendingMatches.length === 0) return null;

    return (
      <View style={styles.carouselContainer}>
        <FlatList
          data={pendingMatches}
          renderItem={renderPendingMatch}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
        />
      </View>
    );
  };

  const renderMatchItem = ({ item, index }: { item: Match; index: number }) => {
    return <MatchCard match={item} onPress={() => handleMatchPress(item)} />;
  };

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
                  Mi disponibilidad
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
            <View style={styles.tabWithBadge}>
                                      <Text style={[styles.tabText, selectedTab === 'mis' && styles.tabTextSelected]}>Mis Partidos</Text>
                        {pendingResultsCount > 0 && (
                          <View style={[styles.tabBadge, styles.tabBadgeTopRight]}>
                            <Text style={styles.tabBadgeText}>
                              {pendingResultsCount > 99 ? '99+' : pendingResultsCount}
                            </Text>
                          </View>
                        )}
            </View>
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
            <View style={styles.matchesContainer}>
              {/* Carrusel de partidos pendientes */}
              <PendingMatchesCarousel />
              
              {/* Lista de otros partidos */}
              {otherMatches.length > 0 && (
                <>
                  {pendingMatches.length > 0 && (
                    <View style={styles.separator}>
                      <View style={styles.separatorLine} />
                      <Text style={styles.separatorText}>Otros partidos</Text>
                      <View style={styles.separatorLine} />
                    </View>
                  )}
                  <FlatList
                    data={otherMatches}
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
                </>
              )}
            </View>
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
    gap: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
    flex: 0,
    maxWidth: '45%',
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
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
    flex: 1,
    maxWidth: '40%',
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
    position: 'relative',
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
  tabWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingRight: 16, // Añadir padding para dar espacio al badge
  },
  tabBadge: {
    position: 'absolute',
    top: -8,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 4,
  },
  tabBadgeTopRight: {
    top: -8,
    right: -4,
  },
  tabBadgeText: {
    color: COLORS.white,
    fontSize: SIZES.xs,
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
  pendingMatchCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.xs,
    width: 300, // Ancho fijo para el carrusel
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  pendingMatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  pendingMatchTitle: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    flex: 1,
    marginRight: SPACING.sm,
  },
  pendingResultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 10,
  },
  pendingResultText: {
    color: COLORS.white,
    fontSize: SIZES.sm,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.xs,
  },
  pendingMatchInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingMatchLocation: {
    fontSize: SIZES.md,
    color: COLORS.gray,
    fontFamily: FONTS.medium,
  },
  pendingMatchDate: {
    fontSize: SIZES.md,
    color: COLORS.gray,
    fontFamily: FONTS.medium,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  separatorText: {
    marginHorizontal: SPACING.sm,
    color: COLORS.gray,
    fontSize: SIZES.sm,
    fontFamily: FONTS.medium,
  },
  // Estilos para el carrusel
  matchesContainer: {
    flex: 1,
  },
  carouselContainer: {
    marginBottom: SPACING.md,
  },
  carouselContent: {
    paddingHorizontal: SPACING.md,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: COLORS.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default MatchesScreen; 