import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  ActivityIndicator,
  Platform,
  Linking
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Match, CreateStackParamList } from '@app/types/index';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@app/types/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@app/lib/firebase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import CustomDialog from '@app/components/CustomDialog';
import { COLORS, FONTS, SIZES, SPACING } from '@app/constants/theme';
import SegmentedControl from '@app/components/SegmentedControl';

type Props = NativeStackScreenProps<CreateStackParamList, 'CreateMatch'>;

const CreateMatchScreen: React.FC<Props> = ({ navigation }) => {
  const rootNavigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  // Valores por defecto del formulario
  const defaultFormData: Partial<Match> = {
    title: '',
    location: '',
    level: 'Intermedio',
    description: '',
    date: new Date(),
    ageRange: 'todas las edades'
  };

  const [formData, setFormData] = useState<Partial<Match>>(defaultFormData);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightLoading, setHighlightLoading] = useState(false);
  const [dialog, setDialog] = useState<{
    visible: boolean;
    title?: string;
    message: string;
    options?: { text: string; onPress?: () => void; style?: object }[];
  }>({
    visible: false,
    title: '',
    message: '',
    options: undefined,
  });
  const [titleCount, setTitleCount] = useState(0);
  const [locationCount, setLocationCount] = useState(0);
  const [descriptionCount, setDescriptionCount] = useState(0);

  // Función para resetear el formulario
  const resetForm = () => {
    setFormData(defaultFormData);
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const validateForm = (): string | null => {
    if (!formData.title?.trim()) return 'El título es obligatorio';
    if (!formData.location?.trim()) return 'La ubicación es obligatoria';
    if (!formData.level) return 'El nivel es obligatorio';
    if (!formData.ageRange) return 'El rango de edad es obligatorio';
    
    // Validación de fecha y hora (mínimo 24h en el futuro)
    const now = new Date();
    const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (formData.date && formData.date < minDate) {
      return 'La fecha y hora del partido deben ser al menos 24 horas en el futuro.';
    }
    
    return null;
  };

  const showDialog = (title: string, message: string, options?: { text: string; onPress?: () => void; style?: object }[]) => {
    setDialog({ visible: true, title, message, options });
  };

  const handleCreateMatch = async () => {
    const error = validateForm();
    if (error != null) {
      showDialog('Error', error);
      return;
    }

    if (!auth.currentUser) {
      showDialog('Error', 'Debes iniciar sesión para crear un partido');
      return;
    }

    setLoading(true);
    try {
      const matchData: Partial<Match> = {
        ...formData,
        playersNeeded: 4,
        playersJoined: [auth.currentUser.uid],
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp() as any,
        teams: {
          team1: [auth.currentUser.uid],
          team2: []
        }
      };

      const matchesRef = collection(db, 'matches');

      const docRef = await addDoc(matchesRef, matchData);

      showDialog(
        '¡Partido creado!',
        'Tu partido se ha creado correctamente',
        [
          {
            text: 'Dejar feedback',
            onPress: () => Linking.openURL('https://forms.gle/gAe37ZzMC6udozNM7'),
            style: { color: '#1e3a8a', fontWeight: 'bold' }
          },
          {
            text: 'Aceptar',
            onPress: () => {
              // Resetear el formulario
              resetForm();
              // Navegar a MatchesScreen y refrescar la lista
              rootNavigation.navigate('Home', { screen: 'Matches', params: { refresh: true } });
            },
          },
        ]
      );
    } catch (error: any) {
      showDialog('Error', `Error al crear el partido: ${error.message}\n\nCódigo: ${error.code}`);
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
        showDialog('Error', 'No puedes seleccionar una fecha anterior al momento actual');
        return;
      }
      setFormData((prev: Partial<Match>) => ({ ...prev, date: selectedDate }));
      setShowDatePicker(false);
      setTimeout(() => setShowTimePicker(true), 300); // Abre el picker de hora tras seleccionar fecha
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
        showDialog('Error', 'No puedes seleccionar una hora anterior al momento actual');
        return;
      }
      
      setFormData((prev: Partial<Match>) => ({ ...prev, date: newDate }));
    }
  };

  const handleHighlightClick = async () => {
    setHighlightLoading(true);
    try {
      // Incrementar el contador en Firebase
      const metricsRef = collection(db, 'metrics');
      await addDoc(metricsRef, {
        type: 'highlight_click',
        timestamp: serverTimestamp(),
        userId: auth.currentUser?.uid || 'anonymous'
      });

      showDialog(
        '¡Próximamente!',
        'La funcionalidad de destacar partidos estará disponible próximamente. ¡Mantente atento!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error al registrar el clic:', error);
    } finally {
      setHighlightLoading(false);
    }
  };

  const renderFormField = (
    label: string, 
    field: keyof Match, 
    placeholder: string,
    options?: {
      multiline?: boolean,
      required?: boolean,
      maxLength?: number,
      count?: number,
      setCount?: (n: number) => void
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
        onChangeText={(text) => {
          setFormData((prev: Partial<Match>) => ({ 
            ...prev, 
            [field]: text 
          }));
          options?.setCount && options.setCount(text.length);
        }}
        multiline={options?.multiline}
        numberOfLines={options?.multiline ? 4 : 1}
        maxLength={options?.maxLength}
      />
      {options?.maxLength && (
        <Text style={{
          alignSelf: 'flex-end',
          fontSize: 12,
          color: (options.count === options.maxLength) ? '#e11d48' : COLORS.gray,
          marginTop: 2
        }}>{options.count}/{options.maxLength}</Text>
      )}
    </View>
  );

  const datePickerMinDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.lightGray }}>
      <View style={{ padding: SPACING.lg }}>
        {/* Tarjeta: Info principal */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 16,
          padding: SPACING.lg,
          marginBottom: SPACING.lg,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.10,
          shadowRadius: 8,
          elevation: 2,
        }}>
          {renderFormField('Título del partido', 'title', 'Ej: Partido amistoso nivel medio', { required: true, maxLength: 40, count: titleCount, setCount: setTitleCount })}
          {renderFormField('Ubicación', 'location', 'Ej: Club Deportivo Norte - Pista 3', { required: true, maxLength: 60, count: locationCount, setCount: setLocationCount })}
        </View>
        {/* Tarjeta: Fecha y hora */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 16,
          padding: SPACING.lg,
          marginBottom: SPACING.lg,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.10,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <Text style={{ fontSize: SIZES.md, fontFamily: FONTS.medium, color: COLORS.primary, marginBottom: 8 }}>Fecha y hora</Text>
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <TouchableOpacity 
              style={{
                flex: 1,
                backgroundColor: COLORS.lightGray,
                padding: 16,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 0,
                shadowColor: COLORS.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 1,
              }}
              onPress={() => {
                setShowTimePicker(false);
                setShowDatePicker(true);
              }}
            >
              <Text style={{ color: COLORS.gray, fontFamily: FONTS.medium }}>
                {formData.date?.toLocaleDateString('es-ES', {
                  weekday: 'short',
                  year: '2-digit',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={{
                flex: 1,
                backgroundColor: COLORS.lightGray,
                padding: 16,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 0,
                shadowColor: COLORS.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 1,
              }}
              onPress={() => {
                setShowDatePicker(false);
                setShowTimePicker(true);
              }}
            >
              <Text style={{ color: COLORS.gray, fontFamily: FONTS.medium }}>
                {formData.date?.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
              <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <View>
              <DateTimePicker
                value={formData.date || new Date()}
                mode="date"
                onChange={handleDateChange}
                minimumDate={datePickerMinDate}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              />
              {Platform.OS === 'ios' && (
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 10, backgroundColor: COLORS.lightGray, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                  <TouchableOpacity 
                    style={{ paddingHorizontal: 20, paddingVertical: 10, marginLeft: 10 }}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ paddingHorizontal: 20, paddingVertical: 10, marginLeft: 10 }}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Aceptar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
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
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 10, backgroundColor: COLORS.lightGray, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                  <TouchableOpacity 
                    style={{ paddingHorizontal: 20, paddingVertical: 10, marginLeft: 10 }}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ paddingHorizontal: 20, paddingVertical: 10, marginLeft: 10 }}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Aceptar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
        {/* Tarjeta: Nivel y edad */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 16,
          padding: SPACING.lg,
          marginBottom: SPACING.lg,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.10,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <Text style={{ fontSize: SIZES.md, fontFamily: FONTS.medium, color: COLORS.primary, marginBottom: 8 }}>Nivel</Text>
          <SegmentedControl
            options={['Principiante', 'Intermedio', 'Avanzado']}
            value={formData.level as string}
            onChange={(option) => setFormData((prev) => ({ ...prev, level: option as Match['level'] }))}
            style={{ marginBottom: SPACING.md }}
          />
          <Text style={{ fontSize: SIZES.md, fontFamily: FONTS.medium, color: COLORS.primary, marginBottom: 8 }}>Rango de edad</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {['18-25', '26-35', '36-45', '46+', 'todas las edades'].map((option) => (
              <TouchableOpacity
                key={option}
                style={{
                  flex: 1,
                  minWidth: '48%',
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: formData.ageRange === option ? COLORS.primary : COLORS.lightGray,
                  alignItems: 'center',
                  marginBottom: 8,
                  shadowColor: COLORS.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: formData.ageRange === option ? 2 : 0,
                }}
                onPress={() => setFormData((prev: Partial<Match>) => ({ ...prev, ageRange: option as Match['ageRange'] }))}
              >
                <Text style={{
                  color: formData.ageRange === option ? COLORS.white : COLORS.primary,
                  fontFamily: formData.ageRange === option ? FONTS.bold : FONTS.medium,
                  fontSize: SIZES.md,
                }}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Tarjeta: Descripción */}
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 16,
          padding: SPACING.lg,
          marginBottom: SPACING.lg,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.10,
          shadowRadius: 8,
          elevation: 2,
        }}>
          {renderFormField('Descripción', 'description', 'Añade detalles adicionales...', { multiline: true, maxLength: 200, count: descriptionCount, setCount: setDescriptionCount })}
        </View>
        {/* Botón de destacar partido */}
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.primary,
            padding: 16,
            borderRadius: 12,
            marginBottom: SPACING.lg,
            borderWidth: 1,
            borderColor: '#FFD700',
            shadowColor: COLORS.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.10,
            shadowRadius: 8,
            elevation: 2,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          onPress={handleHighlightClick}
          disabled={highlightLoading}
        >
          <Ionicons name="star" size={20} color="#FFD700" />
          <Text style={{ color: '#FFD700', fontSize: SIZES.md, fontFamily: FONTS.bold, flex: 1, marginLeft: 8 }}>Destacar este partido</Text>
          {highlightLoading ? (
            <ActivityIndicator size="small" color="#FFD700" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#FFD700" />
          )}
        </TouchableOpacity>
        {/* Botón de crear partido premium */}
        <TouchableOpacity
          style={{
            width: '100%',
            padding: 18,
            borderRadius: 16,
            alignItems: 'center',
            backgroundColor: COLORS.primary,
            marginBottom: SPACING.xl,
            shadowColor: COLORS.shadow,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.14,
            shadowRadius: 12,
            elevation: 4,
            transform: [{ scale: loading ? 0.98 : 1 }],
            opacity: loading ? 0.7 : 1,
          }}
          onPress={handleCreateMatch}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: COLORS.white, fontSize: SIZES.lg, fontFamily: FONTS.bold }}>Crear Partido</Text>
          )}
        </TouchableOpacity>
        <View style={{ backgroundColor: '#FFF8E1', borderRadius: 10, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#FFD700' }}>
          <Text style={{ color: '#B8860B', fontFamily: FONTS.medium, fontSize: SIZES.md }}>
            Recuerda: solo puedes crear partidos con al menos 24 horas de antelación. Si no se completan los jugadores necesarios 24h antes del inicio, el partido se cancelará automáticamente y se notificará al creador.
          </Text>
        </View>
      </View>
      <CustomDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        options={dialog.options}
        onClose={() => setDialog((d) => ({ ...d, visible: false }))}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  container: {
    padding: 24
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#314E99'
  },
  formItem: {
    marginBottom: 24
  },
  label: {
    color: '#1D1B20',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#F0F0F0',
    padding: 16,
    borderRadius: 8,
    color: '#1D1B20'
  },
  dateSelector: {
    backgroundColor: '#F0F0F0',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#1D1B20'
  },
  levelContainer: {
    flexDirection: 'row'
  },
  levelOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#F0F0F0'
  },
  levelOptionSelected: {
    backgroundColor: '#314E99'
  },
  levelText: {
    textAlign: 'center',
    color: '#1D1B20'
  },
  levelTextSelected: {
    color: '#FFFFFF'
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
    backgroundColor: '#314E99'
  },
  buttonDisabled: {
    backgroundColor: '#F0F0F0'
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18
  },
  iosButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8
  },
  iosButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginLeft: 10
  },
  iosButtonText: {
    color: '#314E99',
    fontWeight: '600'
  },
  ageRangeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  ageRangeOption: {
    flex: 1,
    minWidth: '48%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center'
  },
  ageRangeOptionSelected: {
    backgroundColor: '#314E99'
  },
  ageRangeText: {
    textAlign: 'center',
    color: '#1D1B20'
  },
  ageRangeTextSelected: {
    color: '#FFFFFF'
  },
  highlightButton: {
    backgroundColor: '#314E99',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  highlightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  highlightText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
});

export default CreateMatchScreen; 