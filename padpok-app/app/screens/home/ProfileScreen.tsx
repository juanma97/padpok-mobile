import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@app/constants/theme';

// Datos de ejemplo (luego vendrán de Firebase)
const LEVELS = {
  '1.0': 'Principiante',
  '2.0': 'Iniciado',
  '3.0': 'Intermedio',
  '4.0': 'Intermedio Alto',
  '5.0': 'Avanzado'
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

const ProfileScreen = () => {
  const [level, setLevel] = useState('3.0');
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedHours, setSelectedHours] = useState([]);

  const handleDayToggle = (dayId) => {
    setSelectedDays(prev =>
      prev.includes(dayId)
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  const handleHourToggle = (hour) => {
    setSelectedHours(prev =>
      prev.includes(hour)
        ? prev.filter(h => h !== hour)
        : [...prev, hour]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color="#22C55E" />
        </View>
        <Text style={styles.username}>Usuario de Ejemplo</Text>
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* Sección de Nivel simplificada */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nivel de Juego</Text>
        <View style={styles.levelDisplay}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{LEVELS[level]}</Text>
            <Text style={styles.levelNumber}>{level}</Text>
          </View>
        </View>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  avatarContainer: {
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 50,
    marginBottom: 16,
  },
  username: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#22C55E',
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
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
  levelDisplay: {
    alignItems: 'flex-start',
  },
  levelBadge: {
    backgroundColor: '#22C55E15',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
  },
  levelNumber: {
    fontSize: 14,
    color: '#22C55E',
    opacity: 0.8,
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