import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CreateStackParamList } from '@app/types';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@app/lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '@app/constants/theme';

type Props = NativeStackScreenProps<CreateStackParamList, 'CreateMatch'>;

const CreateMatchScreen: React.FC<Props> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [playersNeeded, setPlayersNeeded] = useState('4');
  const [level, setLevel] = useState<'Principiante' | 'Intermedio' | 'Avanzado'>('Intermedio');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateMatch = async () => {
    if (!title || !location || !playersNeeded) {
      Alert.alert('Error', 'Por favor completa los campos requeridos');
      return;
    }

    const numPlayers = parseInt(playersNeeded, 10);
    if (isNaN(numPlayers) || numPlayers < 2 || numPlayers > 8) {
      Alert.alert('Error', 'El número de jugadores debe ser entre 2 y 8');
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Error', 'Debes iniciar sesión para crear un partido');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'matches'), {
        title,
        location,
        date,
        playersNeeded: numPlayers,
        playersJoined: [auth.currentUser.uid], // El creador se une automáticamente
        createdBy: auth.currentUser.uid,
        level,
        description,
        createdAt: serverTimestamp(),
      });

      Alert.alert('¡Éxito!', 'Partido creado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al crear el partido');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const levelOptions = [
    { value: 'Principiante', label: 'Principiante' },
    { value: 'Intermedio', label: 'Intermedio' },
    { value: 'Avanzado', label: 'Avanzado' },
  ];

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Crear Partido</Text>

        <View style={styles.formItem}>
          <Text style={styles.label}>Título del partido*</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Partido amistoso en Club XYZ"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>Ubicación*</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Club Deportivo XYZ"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>Fecha y hora*</Text>
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>
              {date.toLocaleString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#666" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="datetime"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>Número de jugadores*</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 4"
            keyboardType="numeric"
            value={playersNeeded}
            onChangeText={setPlayersNeeded}
          />
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>Nivel*</Text>
          <View style={styles.levelContainer}>
            {levelOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.levelOption,
                  level === option.value ? styles.levelOptionSelected : null
                ]}
                onPress={() => setLevel(option.value as any)}
              >
                <Text
                  style={[
                    styles.levelText,
                    level === option.value ? styles.levelTextSelected : null
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Añade detalles adicionales sobre el partido..."
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreateMatch}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creando...' : 'Crear Partido'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#fff'
  },
  container: {
    padding: 24
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24
  },
  formItem: {
    marginBottom: 24
  },
  label: {
    color: '#4b5563',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8
  },
  dateSelector: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  levelContainer: {
    flexDirection: 'row'
  },
  levelOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f3f4f6'
  },
  levelOptionSelected: {
    backgroundColor: COLORS.primary
  },
  levelText: {
    textAlign: 'center',
    color: '#4b5563'
  },
  levelTextSelected: {
    color: '#fff'
  },
  textArea: {
    height: 100, 
    textAlignVertical: 'top'
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.primary
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18
  }
});

export default CreateMatchScreen; 