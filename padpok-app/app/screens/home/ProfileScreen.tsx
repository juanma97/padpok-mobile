import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@app/lib/AuthContext';
import { auth } from '@app/lib/firebase';
import { signOut } from 'firebase/auth';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeTabsParamList, RootStackParamList } from '@app/types';

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
  displayName: string;
  avatarUrl: string;
  level: UserLevel | null;
  stats: UserStats;
  availability: UserAvailability;
  clubZone?: string;
  bio?: string;
}

// Mock data (later will come from Firebase)
const mockProfile: UserProfile = {
  uid: '1',
  displayName: 'Usuario de Ejemplo',
  avatarUrl: '',
  level: 'Intermedio',
  stats: {
    matchesPlayed: 0,
    wins: 0,
    medals: [],
  },
  availability: {
    days: [],
    hours: [],
  },
  clubZone: 'Club de Pádel Madrid Norte',
  bio: 'Busco partidos por las tardes, preferiblemente mixtos 🎾',
};

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

type Props = CompositeScreenProps<
  BottomTabScreenProps<HomeTabsParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

const ProfileScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<Props['navigation']>();
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState('3.0');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedHours, setSelectedHours] = useState<string[]>([]);

  const handleDayToggle = (dayId: string) => {
    setSelectedDays(prev =>
      prev.includes(dayId)
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  const handleHourToggle = (hour: string) => {
    setSelectedHours(prev =>
      prev.includes(hour)
        ? prev.filter(h => h !== hour)
        : [...prev, hour]
    );
  };

  const handleSignOut = async () => {
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
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'Welcome'
                })
              );
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
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#1e3a8a" />
        </View>
        <Text style={styles.name}>{user.email}</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.signOutIcon} />
              <Text style={styles.signOutText}>Cerrar sesión</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Level and Club Section */}
      <View style={styles.section}>
        <View style={styles.levelClubContainer}>
          <View style={styles.badge}>
            <Ionicons name="trophy-outline" size={16} color="#22C55E" />
            <Text style={styles.badgeText}>{mockProfile.level}</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="location-outline" size={16} color="#22C55E" />
            <Text style={styles.badgeText}>{mockProfile.clubZone}</Text>
          </View>
        </View>
        {mockProfile.bio && (
          <Text style={styles.bioText}>{mockProfile.bio}</Text>
        )}
      </View>

      {/* Estadísticas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Partidos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Victorias</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Compañeros</Text>
          </View>
        </View>
      </View>

      {/* Sección de Disponibilidad */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Disponibilidad Habitual</Text>
        
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
                <Text style={styles.timeOfDayTitle}>
                  {timeOfDay === 'morning' ? 'MAÑANA' : 'TARDE'}
                </Text>
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
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    marginTop: 'auto',
  },
  signOutIcon: {
    marginRight: 8,
  },
  signOutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  levelClubContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E15',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  badgeText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '500',
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  statLabel: {
    color: '#666',
  },
  daysContainer: {
    marginBottom: 20,
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
    borderColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  dayButtonActive: {
    backgroundColor: '#22C55E',
  },
  dayButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  dayFullName: {
    fontSize: 8,
    color: '#22C55E',
    marginTop: 2,
  },
  dayFullNameActive: {
    color: '#fff',
  },
  hoursContainer: {
    marginTop: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    marginTop: 16,
  },
  availabilityContainer: {
    gap: 20,
  },
  timeOfDayContainer: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  timeOfDayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hourButton: {
    width: '30%',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#22C55E',
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  hourButtonActive: {
    backgroundColor: '#22C55E',
  },
  hourButtonText: {
    color: '#22C55E',
    fontSize: 14,
  },
  hourButtonTextActive: {
    color: '#fff',
  },
});

export default ProfileScreen; 