import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@app/lib/AuthContext';
import { auth, db } from '@app/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@app/types';
import { getAllMedals, getUserMedals } from '@app/lib/medals';
import { Medal, UserMedal } from '@app/types/medals';

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
  afternoon: ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
};

interface ProfileParams {
  userId?: string;
}

const ProfileScreen = ({ route }: { route: { params?: ProfileParams } }) => {
  const { userId } = route.params || {};
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedHours, setSelectedHours] = useState<string[]>([]);
  const [medals, setMedals] = useState<Medal[]>([]);
  const [userMedals, setUserMedals] = useState<UserMedal[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
      Alert.alert('Éxito', 'Disponibilidad actualizada correctamente');
    } catch (error) {
      console.error('Error saving availability:', error);
      Alert.alert('Error', 'No se pudo guardar la disponibilidad');
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      await signOut(auth);
      navigation.navigate('Auth', {
        screen: 'Welcome'
      });
    }
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
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
              navigation.navigate('Auth', {
                screen: 'Welcome'
              });
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar la sesión');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (!user) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={50} color="#314E99" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.name}>{userProfile?.username || 'Usuario'}</Text>
            <View style={styles.userBadges}>
              {userProfile?.level && (
                <View style={styles.badge}>
                  <Ionicons name="trophy-outline" size={16} color="#314E99" />
                  <Text style={styles.badgeText}>{userProfile.level}</Text>
                </View>
              )}
              {userProfile?.clubZone && (
                <View style={styles.badge}>
                  <Ionicons name="location-outline" size={16} color="#22C55E" />
                  <Text style={styles.badgeText}>{userProfile.clubZone}</Text>
                </View>
              )}
            </View>
            {userProfile?.bio && (
              <Text style={styles.bioText}>{userProfile.bio}</Text>
            )}
            {isOwnProfile && (
              <TouchableOpacity 
                style={styles.signOutButton}
                onPress={handleSignOut}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#dc2626" size="small" />
                ) : (
                  <>
                    <Ionicons name="log-out-outline" size={16} color="#dc2626" style={styles.signOutIcon} />
                    <Text style={styles.signOutText}>Cerrar sesión</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Estadísticas */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="stats-chart" size={20} color="#314E99" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Estadísticas</Text>
          </View>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => navigation.navigate('MatchHistory')}
          >
            <Text style={styles.seeAllText}>Ver historial</Text>
            <Ionicons name="chevron-forward" size={16} color="#314E99" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="tennisball-outline" size={20} color="#314E99" />
            </View>
            <Text style={styles.statNumber}>{userProfile?.stats.matchesPlayed || 0}</Text>
            <Text style={styles.statLabel}>Partidos</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="trophy-outline" size={20} color="#314E99" />
            </View>
            <Text style={styles.statNumber}>{userProfile?.stats.wins || 0}</Text>
            <Text style={styles.statLabel}>Victorias</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Ionicons name="people-outline" size={20} color="#314E99" />
            </View>
            <Text style={styles.statNumber}>
              {userMedals.filter(medal => medal.unlocked).length}
            </Text>
            <Text style={styles.statLabel}>Medallas</Text>
          </View>
        </View>
      </View>

      {/* Sección de Medallas */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="trophy" size={20} color="#314E99" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Medallas</Text>
          </View>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => navigation.navigate('Medals')}
          >
            <Text style={styles.seeAllText}>Ver todas</Text>
            <Ionicons name="chevron-forward" size={16} color="#314E99" />
          </TouchableOpacity>
        </View>
        <View style={styles.medalsContainer}>
          {userMedals.filter(medal => medal.unlocked).length > 0 ? (
            <View style={styles.medalsGrid}>
              {userMedals
                .filter(medal => medal.unlocked)
                .slice(0, 4)
                .map((userMedal) => {
                  const medal = medals.find(m => m.id === userMedal.id);
                  return medal ? (
                    <View key={medal.id} style={styles.medalItem}>
                      <View style={styles.medalCircleUnlocked}>
                        <Ionicons name={medal.icon as any} size={20} color="#314E99" />
                      </View>
                      <Text style={styles.medalName} numberOfLines={1}>
                        {medal.name}
                      </Text>
                    </View>
                  ) : null;
                })}
            </View>
          ) : (
            <View style={styles.noMedalsContainer}>
              <Ionicons name="trophy-outline" size={24} color="#1D1B20" />
              <Text style={styles.noMedalsText}>
                Aún no has desbloqueado medallas
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Sección de Disponibilidad */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="calendar" size={20} color="#314E99" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Disponibilidad Habitual</Text>
          </View>
          {hasUnsavedChanges && (
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveAvailability}
              disabled={savingAvailability}
            >
              {savingAvailability ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar cambios</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
        
        {/* Días de la semana */}
        <View style={styles.daysContainer}>
          <Text style={styles.subsectionTitle}>Días disponibles</Text>
          <View style={styles.daysGrid}>
            {DAYS.map((day) => (
              <TouchableOpacity
                key={day.id}
                style={[
                  styles.dayButton,
                  selectedDays.includes(day.id) && styles.dayButtonActive
                ]}
                onPress={() => handleDayToggle(day.id)}
              >
                <Text style={[
                  styles.dayButtonText,
                  selectedDays.includes(day.id) && styles.dayButtonTextActive
                ]}>
                  {day.id}
                </Text>
                <Text style={[
                  styles.dayFullName,
                  selectedDays.includes(day.id) && styles.dayFullNameActive
                ]}>
                  {day.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Horarios */}
        <View style={styles.hoursContainer}>
          <Text style={styles.subsectionTitle}>Horarios preferidos</Text>
          <View style={styles.availabilityContainer}>
            {Object.entries(AVAILABILITY).map(([timeOfDay, hours]) => (
              <View key={timeOfDay} style={styles.timeOfDayContainer}>
                <View style={styles.timeOfDayHeader}>
                  <Ionicons 
                    name={timeOfDay === 'morning' ? 'sunny-outline' : 'moon-outline'} 
                    size={16} 
                    color="#1D1B20" 
                  />
                  <Text style={styles.timeOfDayTitle}>
                    {timeOfDay === 'morning' ? 'MAÑANA' : 'TARDE'}
                  </Text>
                </View>
                <View style={styles.hoursGrid}>
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.hourButton,
                        selectedHours.includes(hour) && styles.hourButtonActive
                      ]}
                      onPress={() => handleHourToggle(hour)}
                    >
                      <Text style={[
                        styles.hourButtonText,
                        selectedHours.includes(hour) && styles.hourButtonTextActive
                      ]}>
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
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