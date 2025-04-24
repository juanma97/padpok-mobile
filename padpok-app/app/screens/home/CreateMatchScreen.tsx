import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  StyleSheet,
  ActivityIndicator,
  Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CreateStackParamList, Match } from '@app/types';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@app/lib/firebase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<CreateStackParamList, 'CreateMatch'>;

const CreateMatchScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState<Partial<Match>>({
    title: '',
    location: '',
    level: 'Intermedio',
    description: '',
    date: new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = (): string | null => {
    if (!formData.title?.trim()) return 'El título es obligatorio';
    if (!formData.location?.trim()) return 'La ubicación es obligatoria';
    if (!formData.level) return 'El nivel es obligatorio';
    
    // Validación de fecha y hora
    const now = new Date();
    if (formData.date && formData.date < now) {
      return 'La fecha y hora del partido no pueden ser anteriores al momento actual';
    }
    
    return null;
  };

  const handleCreateMatch = async () => {
    const error = validateForm();
    if (error != null) {
      Alert.alert('Error', error);
      return;
    }

    // if (!auth.currentUser) {
    //   Alert.alert('Error', 'Debes iniciar sesión para crear un partido');
    //   return;
    // }

    setLoading(true);
    try {
      const matchData: Partial<Match> = {
        ...formData,
        playersNeeded: 4,
        playersJoined: ['test'],
        createdBy: 'test',
        createdAt: serverTimestamp(),
      };

      const matchesRef = collection(db, 'matches');

      const docRef = await addDoc(matchesRef, matchData);

      Alert.alert(
        '¡Partido creado!', 
        'Tu partido se ha creado correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', 
        `Error al crear el partido: ${error.message}\n\nCódigo: ${error.code}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const currentTime = formData.date || new Date();
      selectedDate.setHours(currentTime.getHours());
      selectedDate.setMinutes(currentTime.getMinutes());
      
      // Validación inmediata al cambiar la fecha
      const now = new Date();
      if (selectedDate < now) {
        Alert.alert('Error', 'No puedes seleccionar una fecha anterior al momento actual');
        return;
      }
      
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      const newDate = new Date(formData.date || new Date());
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      
      // Validación inmediata al cambiar la hora
      const now = new Date();
      if (newDate < now) {
        Alert.alert('Error', 'No puedes seleccionar una hora anterior al momento actual');
        return;
      }
      
      setFormData(prev => ({ ...prev, date: newDate }));
    }
  };

  const renderFormField = (
    label: string, 
    field: keyof Match, 
    placeholder: string,
    options?: {
      multiline?: boolean,
      required?: boolean
    }
  ) => (
    <View style={styles.formItem}>
      <Text style={styles.label}>
        {label}{options?.required ? '*' : ''}
      </Text>
      <TextInput
        style={[
          styles.input,
          options?.multiline && styles.textArea
        ]}
        placeholder={placeholder}
        value={formData[field]?.toString()}
        onChangeText={(text) => setFormData(prev => ({ 
          ...prev, 
          [field]: text 
        }))}
        multiline={options?.multiline}
        numberOfLines={options?.multiline ? 4 : 1}
      />
    </View>
  );

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Crear Partido</Text>

        {renderFormField('Título del partido', 'title', 'Ej: Partido amistoso nivel medio', { required: true })}
        {renderFormField('Ubicación', 'location', 'Ej: Club Deportivo Norte - Pista 3', { required: true })}

        <View style={styles.formItem}>
          <Text style={styles.label}>Fecha del partido*</Text>
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>
              {formData.date?.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#666" />
          </TouchableOpacity>
          {showDatePicker && (
            <View>
              <DateTimePicker
                value={formData.date || new Date()}
                mode="date"
                onChange={handleDateChange}
                minimumDate={new Date()}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              />
              {Platform.OS === 'ios' && (
                <View style={styles.iosButtons}>
                  <TouchableOpacity 
                    style={styles.iosButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.iosButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.iosButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.iosButtonText}>Aceptar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>Hora del partido*</Text>
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={() => setShowTimePicker(true)}
          >
            <Text>
              {formData.date?.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            <Ionicons name="time-outline" size={20} color="#666" />
          </TouchableOpacity>
          {showTimePicker && (
            <View>
              <DateTimePicker
                value={formData.date || new Date()}
                mode="time"
                onChange={handleTimeChange}
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              />
              {Platform.OS === 'ios' && (
                <View style={styles.iosButtons}>
                  <TouchableOpacity 
                    style={styles.iosButton}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={styles.iosButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.iosButton}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={styles.iosButtonText}>Aceptar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.formItem}>
          <Text style={styles.label}>Nivel*</Text>
          <View style={styles.levelContainer}>
            {['Principiante', 'Intermedio', 'Avanzado'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.levelOption,
                  formData.level === option && styles.levelOptionSelected
                ]}
                onPress={() => setFormData(prev => ({ ...prev, level: option as Match['level'] }))}
              >
                <Text style={[
                  styles.levelText,
                  formData.level === option && styles.levelTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {renderFormField('Descripción', 'description', 'Añade detalles adicionales...', { multiline: true })}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreateMatch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Crear Partido</Text>
          )}
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
    backgroundColor: '#007bff'
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
    backgroundColor: '#007bff'
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18
  },
  iosButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8
  },
  iosButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginLeft: 10
  },
  iosButtonText: {
    color: '#007bff',
    fontWeight: '600'
  }
});

export default CreateMatchScreen; 