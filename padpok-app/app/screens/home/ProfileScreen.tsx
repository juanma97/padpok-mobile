import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@app/lib/AuthContext';
import { auth, db } from '@app/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { getAllMedals, getUserMedals } from '@app/lib/medals';
import { Medal, UserMedal } from '@app/types/medals';
import CustomDialog from '@app/components/CustomDialog';
import { COLORS, SPACING, SIZES, FONTS } from '@app/constants/theme';

type UserLevel = 'Principiante' | 'Intermedio' | 'Avanzado';

interface UserStats {
  matchesPlayed: number;
  wins: number;
  medals: string[];
}

interface UserAvailability {
  days: string[];
  hours: string[];
}

interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  level: UserLevel | null;
  stats: UserStats;
  availability: UserAvailability;
  clubZone?: string;
  bio?: string;
}

const DAYS = [
  { id: 'L', name: 'Lunes' },
  { id: 'M', name: 'Martes' },
  { id: 'X', name: 'Miércoles' },
  { id: 'J', name: 'Jueves' },
  { id: 'V', name: 'Viernes' },
  { id: 'S', name: 'Sábado' },
  { id: 'D', name: 'Domingo' }
];

const AVAILABILITY = {
  morning: ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00'],
  afternoon: ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
  night: ['19:00', '20:00', '21:00', '22:00'],
};

interface ProfileParams {
  userId?: string;
}

const ProfileScreen = ({ route }: { route: { params?: ProfileParams } }) => {
  const { userId } = route.params || {};
  const { user, setUser } = useAuth();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedHours, setSelectedHours] = useState<string[]>([]);
  const [medals, setMedals] = useState<Medal[]>([]);
  const [userMedals, setUserMedals] = useState<UserMedal[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [dialog, setDialog] = useState({
    visible: false,
    title: '',
    message: '',
    options: undefined as { text: string; onPress?: () => void; style?: object }[] | undefined,
  });

  // Determinar si estamos viendo nuestro propio perfil
  const isOwnProfile = !userId || userId === user?.uid;

  useEffect(() => {
    const fetchUserData = async () => {
      const targetUserId = userId || user?.uid;
      if (!targetUserId) return;
      
      try {
        const userRef = doc(db, 'users', targetUserId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile({
            uid: targetUserId,
            username: userData.username || '',
            displayName: userData.displayName || '',
            avatarUrl: userData.avatarUrl || '',
            level: userData.level || null,
            stats: userData.stats || {
              matchesPlayed: 0,
              wins: 0,
              medals: []
            },
            availability: userData.availability || {
              days: [],
              hours: []
            },
            clubZone: userData.clubZone || '',
            bio: userData.bio || '',
          });
          setSelectedDays(userData.availability?.days || []);
          setSelectedHours(userData.availability?.hours || []);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [userId, user]);

  useEffect(() => {
    const fetchMedals = async () => {
      if (!user) return;
      
      try {
        const [allMedals, userMedalsList] = await Promise.all([
          getAllMedals(),
          getUserMedals(user.uid)
        ]);
        
        setMedals(allMedals);
        setUserMedals(userMedalsList);
      } catch (error) {
        console.error('Error fetching medals:', error);
      }
    };

    fetchMedals();
  }, [user]);

  const handleDayToggle = (dayId: string) => {
    setSelectedDays(prev => {
      const newDays = prev.includes(dayId)
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId];
      setHasUnsavedChanges(true);
      return newDays;
    });
  };

  const handleHourToggle = (hour: string) => {
    setSelectedHours(prev => {
      const newHours = prev.includes(hour)
        ? prev.filter(h => h !== hour)
        : [...prev, hour];
      setHasUnsavedChanges(true);
      return newHours;
    });
  };

  const handleSaveAvailability = async () => {
    if (!user) return;

    setSavingAvailability(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'availability.days': selectedDays,
        'availability.hours': selectedHours
      });
      setHasUnsavedChanges(false);
      showDialog('Éxito', 'Disponibilidad actualizada correctamente');
    } catch (error) {
      console.error('Error saving availability:', error);
      showDialog('Error', 'No se pudo guardar la disponibilidad');
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleSignOut = async () => {
    showDialog('Cerrar sesión', '¿Estás seguro de que quieres cerrar sesión?', [
      {
        text: 'Cancelar',
        style: 'cancel'
      },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await signOut(auth);
            setUser(null);
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Welcome', params: undefined }],
              })
            );
          } catch (error) {
            showDialog('Error', 'No se pudo cerrar la sesión', undefined);
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  const showDialog = (title: string, message: string, options?: { text: string; onPress?: () => void; style?: object }[]) => {
    setDialog({ visible: true, title: String(title), message: String(message), options: options as any });
  };

  if (!user) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: hasUnsavedChanges ? SPACING.xxl * 2 : 0 }}>
        {/* Header premium con avatar grande y fondo visual */}
        <View style={{
          padding: SPACING.lg,
          backgroundColor: COLORS.white,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderBottomLeftRadius: SPACING.xl,
          borderBottomRightRadius: SPACING.xl,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.10,
          shadowRadius: 8,
          elevation: 4,
          marginBottom: SPACING.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.lg,
        }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: COLORS.light,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: SPACING.lg,
            shadowColor: COLORS.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.10,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <Ionicons name="person-circle-outline" size={70} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: SIZES.xl, fontFamily: FONTS.bold, color: COLORS.primary, marginBottom: SPACING.xs }}>
              {userProfile?.username || 'Usuario'}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xs }}>
              {userProfile?.level && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(49,78,153,0.1)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6 }}>
                  <Ionicons name="trophy-outline" size={SIZES.md} color={COLORS.primary} />
                  <Text style={{ color: COLORS.primary, fontSize: SIZES.sm, fontFamily: FONTS.medium }}>{userProfile.level}</Text>
                </View>
              )}
              {userProfile?.clubZone && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6 }}>
                  <Ionicons name="location-outline" size={SIZES.md} color={COLORS.success} />
                  <Text style={{ color: COLORS.success, fontSize: SIZES.sm, fontFamily: FONTS.medium }}>{userProfile.clubZone}</Text>
                </View>
              )}
            </View>
            {userProfile?.bio && (
              <Text style={{ fontSize: SIZES.sm, color: COLORS.dark, fontFamily: FONTS.regular, fontStyle: 'italic', marginBottom: SPACING.xs }}>
                {userProfile.bio}
              </Text>
            )}
            {isOwnProfile && (
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', padding: 4 }}
                onPress={handleSignOut}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.error} size="small" />
                ) : (
                  <>
                    <Ionicons name="log-out-outline" size={SIZES.md} color={COLORS.error} style={{ marginRight: 4 }} />
                    <Text style={{ color: COLORS.error, fontWeight: '500', fontSize: SIZES.sm }}>Cerrar sesión</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Estadísticas */}
        <View style={[styles.section, { backgroundColor: COLORS.white, borderRadius: SPACING.lg, margin: SPACING.md, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 4 }]}> 
          <View style={[styles.sectionHeader, { marginBottom: SPACING.md }]}> 
            <View style={styles.sectionTitleContainer}> 
              <Ionicons name="stats-chart" size={SIZES.lg} color={COLORS.primary} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { fontFamily: FONTS.bold, fontSize: SIZES.xl }]}>Estadísticas</Text>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('MatchHistory')}
            >
              <Text style={styles.seeAllText}>Ver historial</Text>
              <Ionicons name="chevron-forward" size={SIZES.md} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', gap: SPACING.lg }}>
            {/* Partidos jugados */}
            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={{
                width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.light, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 4, elevation: 2
              }}>
                <Ionicons name="tennisball-outline" size={SIZES.xl} color={COLORS.primary} />
              </View>
              <Text style={{ fontSize: SIZES.xl, fontFamily: FONTS.bold, color: COLORS.primary }}>{userProfile?.stats.matchesPlayed || 0}</Text>
              <Text style={{ color: COLORS.gray, fontFamily: FONTS.medium, fontSize: SIZES.sm }}>Partidos</Text>
            </View>
            {/* Victorias */}
            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={{
                width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.light, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 4, elevation: 2
              }}>
                <Ionicons name="trophy-outline" size={SIZES.xl} color={COLORS.accent} />
              </View>
              <Text style={{ fontSize: SIZES.xl, fontFamily: FONTS.bold, color: COLORS.accent }}>{userProfile?.stats.wins || 0}</Text>
              <Text style={{ color: COLORS.gray, fontFamily: FONTS.medium, fontSize: SIZES.sm }}>Victorias</Text>
            </View>
            {/* Medallas desbloqueadas */}
            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={{
                width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.light, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 4, elevation: 2
              }}>
                <Ionicons name="ribbon-outline" size={SIZES.xl} color={COLORS.secondary} />
              </View>
              <Text style={{ fontSize: SIZES.xl, fontFamily: FONTS.bold, color: COLORS.secondary }}>{userMedals.filter(medal => medal.unlocked).length}</Text>
              <Text style={{ color: COLORS.gray, fontFamily: FONTS.medium, fontSize: SIZES.sm }}>Medallas</Text>
            </View>
          </View>
        </View>

        {/* Sección de Medallas */}
        <View style={[styles.section, { backgroundColor: COLORS.white, borderRadius: SPACING.lg, marginHorizontal: SPACING.md, marginBottom: SPACING.md, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 4 }]}> 
          <View style={[styles.sectionHeader, { marginBottom: SPACING.md }]}> 
            <View style={styles.sectionTitleContainer}> 
              <Ionicons name="trophy" size={SIZES.lg} color={COLORS.accent} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { fontFamily: FONTS.bold, fontSize: SIZES.xl }]}>Medallas</Text>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('Medals')}
            >
              <Text style={styles.seeAllText}>Ver todas</Text>
              <Ionicons name="chevron-forward" size={SIZES.md} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, justifyContent: 'center', alignItems: 'center', minHeight: 80 }}>
            {userMedals.length > 0 ? (
              medals.map((medal, idx) => {
                const unlocked = userMedals.find(m => m.id === medal.id)?.unlocked;
                return (
                  <View key={medal.id} style={{ alignItems: 'center', width: 70, marginBottom: 8, opacity: unlocked ? 1 : 0.35 }}>
                    <View style={{
                      width: 48, height: 48, borderRadius: 24, backgroundColor: unlocked ? COLORS.light : COLORS.lightGray, alignItems: 'center', justifyContent: 'center', marginBottom: 4, borderWidth: unlocked ? 2 : 1, borderColor: unlocked ? COLORS.accent : COLORS.gray, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 4, elevation: 2
                    }}>
                      <Ionicons name={medal.icon as any} size={28} color={unlocked ? COLORS.accent : COLORS.gray} />
                    </View>
                    <Text style={{ fontSize: SIZES.sm, fontFamily: FONTS.medium, color: unlocked ? COLORS.primary : COLORS.gray, textAlign: 'center' }} numberOfLines={2}>
                      {medal.name}
                    </Text>
                    {unlocked && (
                      <Text style={{ fontSize: SIZES.xs, color: COLORS.success, fontFamily: FONTS.bold, marginTop: 2 }}>¡Obtenida!</Text>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={{ alignItems: 'center', padding: 16 }}>
                <Ionicons name="trophy-outline" size={32} color={COLORS.gray} />
                <Text style={{ color: COLORS.gray, textAlign: 'center', marginTop: 8, fontSize: SIZES.md, fontFamily: FONTS.medium }}>
                  Aún no has desbloqueado medallas
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Sección de Disponibilidad premium compacta */}
        <View style={[
          styles.section,
          {
            backgroundColor: COLORS.white,
            borderRadius: SPACING.lg,
            margin: SPACING.md,
            shadowColor: COLORS.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.10,
            shadowRadius: 8,
            elevation: 4,
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.md,
          },
        ]}>
          <View style={[styles.sectionHeader, { marginBottom: SPACING.sm }]}> 
            <View style={styles.sectionTitleContainer}> 
              <Ionicons name="calendar" size={SIZES.lg} color={COLORS.primary} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { fontFamily: FONTS.bold, fontSize: SIZES.xl }]}>Disponibilidad habitual</Text>
            </View>
          </View>
          {/* Días de la semana: grid compacto de chips circulares */}
          <View style={{ alignItems: 'left', marginBottom: SPACING.md }}>
            <Text style={{ fontSize: SIZES.md, fontFamily: FONTS.medium, color: COLORS.primary, marginBottom: SPACING.sm }}>Días disponibles</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: SPACING.sm }}>
              {DAYS.map((day) => (
                <View key={day.id} style={{ alignItems: 'center', width: 40, marginHorizontal: 2 }}>
                  <TouchableOpacity
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      borderWidth: 1.5,
                      borderColor: selectedDays.includes(day.id) ? COLORS.primary : COLORS.gray,
                      backgroundColor: selectedDays.includes(day.id) ? COLORS.primary : COLORS.white,
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: selectedDays.includes(day.id) ? COLORS.primary : 'transparent',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: selectedDays.includes(day.id) ? 0.10 : 0,
                      shadowRadius: 4,
                      elevation: selectedDays.includes(day.id) ? 2 : 0,
                    }}
                    onPress={() => handleDayToggle(day.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={{
                      fontSize: SIZES.md,
                      fontFamily: FONTS.bold,
                      color: selectedDays.includes(day.id) ? COLORS.white : COLORS.primary,
                    }}>{day.id}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
          {/* Horarios preferidos: bloques horizontales con scroll */}
          <View style={{ gap: SPACING.sm }}>
            <Text style={{ fontSize: SIZES.md, fontFamily: FONTS.medium, color: COLORS.primary, marginBottom: SPACING.xs }}>Horarios preferidos</Text>
            {Object.entries(AVAILABILITY).map(([timeOfDay, hours]) => (
              <View key={timeOfDay} style={{ marginBottom: SPACING.xs }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs }}>
                  <Ionicons 
                    name={
                      timeOfDay === 'morning'
                        ? 'sunny-outline'
                        : timeOfDay === 'afternoon'
                        ? 'partly-sunny-outline'
                        : 'moon-outline'
                    }
                    size={SIZES.md} 
                    color={COLORS.primary} 
                  />
                  <Text style={{ fontSize: SIZES.sm, fontFamily: FONTS.bold, color: COLORS.primary, marginLeft: 8 }}>
                    {timeOfDay === 'morning'
                      ? 'MAÑANA'
                      : timeOfDay === 'afternoon'
                      ? 'TARDE'
                      : 'NOCHE'}
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={{
                        minWidth: 56,
                        borderRadius: 8,
                        borderWidth: 1.5,
                        borderColor: selectedHours.includes(hour) ? COLORS.primary : COLORS.gray,
                        backgroundColor: selectedHours.includes(hour) ? COLORS.primary : COLORS.white,
                        paddingVertical: 8,
                        alignItems: 'center',
                        marginBottom: 4,
                        shadowColor: selectedHours.includes(hour) ? COLORS.primary : 'transparent',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: selectedHours.includes(hour) ? 0.10 : 0,
                        shadowRadius: 4,
                        elevation: selectedHours.includes(hour) ? 2 : 0,
                        marginRight: 8,
                      }}
                      onPress={() => handleHourToggle(hour)}
                      activeOpacity={0.85}
                    >
                      <Text style={{
                        color: selectedHours.includes(hour) ? COLORS.white : COLORS.primary,
                        fontSize: SIZES.sm,
                        fontFamily: FONTS.medium,
                      }}>{hour}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <CustomDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        options={dialog.options}
        onClose={() => setDialog((d) => ({ ...d, visible: false }))}
      />
      {/* Botón fijo premium para guardar cambios, fuera del ScrollView */}
      {hasUnsavedChanges && (
        <View style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: COLORS.white,
          padding: SPACING.lg,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.10,
          shadowRadius: 8,
          elevation: 8,
          zIndex: 100,
        }}>
          <TouchableOpacity
            style={{ backgroundColor: COLORS.primary, borderRadius: 16, alignItems: 'center', paddingVertical: SPACING.md, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 12, elevation: 4 }}
            onPress={handleSaveAvailability}
            disabled={savingAvailability}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Guardar cambios"
          >
            {savingAvailability ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={{ color: COLORS.white, fontSize: SIZES.lg, fontFamily: FONTS.bold }}>Guardar cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#314E99',
    marginBottom: 8,
  },
  userBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(49,78,153,0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  badgeText: {
    color: '#314E99',
    fontSize: 14,
    fontWeight: '500',
  },
  bioText: {
    fontSize: 14,
    color: '#1D1B20',
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 4,
  },
  signOutIcon: {
    marginRight: 4,
  },
  signOutText: {
    color: '#dc2626',
    fontWeight: '500',
    fontSize: 14,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
    color: '#314E99',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#314E99',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#314E99',
    marginBottom: 4,
  },
  statLabel: {
    color: '#1D1B20',
    fontSize: 12,
    fontWeight: '500',
  },
  daysContainer: {
    marginBottom: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 16,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-around',
  },
  dayButton: {
    width: '13%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#314E99',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  dayButtonActive: {
    backgroundColor: '#314E99',
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#314E99',
  },
  dayButtonTextActive: {
    color: '#FFFFFF',
  },
  dayFullName: {
    fontSize: 8,
    color: '#314E99',
    marginTop: 2,
  },
  dayFullNameActive: {
    color: '#FFFFFF',
  },
  hoursContainer: {
    marginTop: 8,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1B20',
    marginBottom: 12,
  },
  availabilityContainer: {
    gap: 16,
  },
  timeOfDayContainer: {
    marginBottom: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 16,
  },
  timeOfDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeOfDayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1B20',
    marginLeft: 8,
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hourButton: {
    width: '30%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#314E99',
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  hourButtonActive: {
    backgroundColor: '#314E99',
  },
  hourButtonText: {
    color: '#314E99',
    fontSize: 14,
    fontWeight: '500',
  },
  hourButtonTextActive: {
    color: '#FFFFFF',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  seeAllText: {
    color: '#314E99',
    fontWeight: '500',
    marginRight: 4,
  },
  medalsContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 16,
  },
  medalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  medalItem: {
    width: '22%',
    alignItems: 'center',
  },
  medalCircleUnlocked: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#314E99',
    marginBottom: 6,
  },
  medalName: {
    fontSize: 11,
    color: '#1D1B20',
    textAlign: 'center',
    fontWeight: '500',
  },
  noMedalsContainer: {
    alignItems: 'center',
    padding: 16,
  },
  noMedalsText: {
    color: '#1D1B20',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#314E99',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ProfileScreen; 