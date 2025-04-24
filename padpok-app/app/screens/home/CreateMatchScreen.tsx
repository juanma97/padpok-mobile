import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  StyleSheet,
  ActivityIndicator 
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CreateStackParamList, Match } from '@app/types';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@app/lib/firebase';

type Props = NativeStackScreenProps<CreateStackParamList, 'CreateMatch'>;

const CreateMatchScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState<Partial<Match>>({
    title: '',
    location: '',
    level: 'Intermedio',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  const validateForm = (): string | null => {
    if (!formData.title?.trim()) return 'El título es obligatorio';
    if (!formData.location?.trim()) return 'La ubicación es obligatoria';
    if (!formData.level) return 'El nivel es obligatorio';
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
  }
});

export default CreateMatchScreen; 