import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '@app/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AuthStackParamList } from '@app/types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MEDALS } from '@app/types/medals';
import CustomDialog from '@app/components/CustomDialog';

const RegisterScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Register'>>();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Paso 1: Credenciales
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Paso 2: Información adicional
  const [username, setUsername] = useState('');
  const [level, setLevel] = useState<'Principiante' | 'Intermedio' | 'Avanzado' | null>(null);
  const [age, setAge] = useState('');
  const [clubZone, setClubZone] = useState('');

  const [dialog, setDialog] = useState({
    visible: false,
    title: '',
    message: '',
    options: undefined as { text: string; onPress?: () => void; style?: object }[] | undefined,
  });

  const showDialog = (title: string, message: string, options?: { text: string; onPress?: () => void; style?: object }[]) => {
    setDialog({ visible: true, title, message, options });
  };

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const validateStep1 = () => {
    if (!email || !password) {
      showDialog('Error', 'Por favor, completa email y contraseña');
      return false;
    }
    if (!validateEmail(email)) {
      showDialog('Error de Formato', 'Por favor, introduce un email válido.');
      return false;
    }
    if (password.length < 6) {
      showDialog('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!username || !level || !age || !clubZone) {
      showDialog('Error', 'Por favor, completa todos los campos');
      return false;
    }
    if (isNaN(Number(age)) || Number(age) < 18) {
      showDialog('Error', 'La edad debe ser un número válido mayor o igual a 18');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleRegister = async () => {
    if (!validateStep2()) {
      showDialog('Error', 'Por favor, completa todos los campos correctamente');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Crear el documento del usuario en Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        availability: {
          days: [],
          hours: []
        },
        avatarUrl: '',
        username,
        age,
        level,
        clubZone,
        stats: {
          points: 0,
          matchesPlayed: 0,
          wins: 0,
          losses: 0
        },
        medals: MEDALS.map(medal => ({
          id: medal.id,
          unlocked: false,
          progress: 0,
          lastUpdated: new Date()
        })),
        createdAt: serverTimestamp()
      });

      showDialog(
        '¡Registro exitoso!',
        'Tu cuenta ha sido creada correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              })
            ),
          },
        ]
      );
    } catch (error: any) {
      showDialog('Error', `Error al registrarse: ${error.message}\n\nCódigo: ${error.code}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="tennisball-outline" size={40} color="#314E99" />
          </View>
          <Text style={styles.logoText}>padpok</Text>
        </View>
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Paso 1 de 2: Tus credenciales</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#1D1B20" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#1D1B20" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color="#1D1B20" 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleNextStep}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Siguiente</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setStep(1)}
        >
          <Ionicons name="arrow-back" size={24} color="#1D1B20" />
        </TouchableOpacity>
        <Text style={styles.title}>Información adicional</Text>
        <Text style={styles.subtitle}>Paso 2 de 2: Cuéntanos sobre ti</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#1D1B20" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nombre de usuario"
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="trophy-outline" size={20} color="#1D1B20" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Edad"
            value={age}
            onChangeText={text => {
              // Solo números positivos, sin ceros iniciales ni negativos
              const filtered = text.replace(/[^0-9]/g, '');
              setAge(filtered.replace(/^0+/, ''));
            }}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="location-outline" size={20} color="#1D1B20" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Club o zona de juego"
            value={clubZone}
            onChangeText={setClubZone}
          />
        </View>

        <View style={styles.levelContainer}>
          <Text style={styles.levelLabel}>Nivel de juego</Text>
          <View style={styles.levelOptions}>
            {['Principiante', 'Intermedio', 'Avanzado'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.levelOption,
                  level === option && styles.levelOptionSelected
                ]}
                onPress={() => setLevel(option as typeof level)}
              >
                <Text style={[
                  styles.levelText,
                  level === option && styles.levelTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Crear cuenta</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {step === 1 ? renderStep1() : renderStep2()}
        </ScrollView>
        <CustomDialog
          visible={dialog.visible}
          title={dialog.title}
          message={dialog.message}
          options={dialog.options}
          onClose={() => setDialog((d) => ({ ...d, visible: false }))}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#314E99',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#314E99',
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D1B20',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#1D1B20',
    opacity: 0.7,
    textAlign: 'center',
  },
  formContainer: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
    color: '#1D1B20',
    opacity: 0.7,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1D1B20',
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    backgroundColor: '#314E99',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#1D1B20',
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  levelContainer: {
    marginBottom: 16,
  },
  levelLabel: {
    color: '#1D1B20',
    opacity: 0.7,
    marginBottom: 8,
  },
  levelOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  levelOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  levelOptionSelected: {
    backgroundColor: '#314E99',
  },
  levelText: {
    color: '#1D1B20',
  },
  levelTextSelected: {
    color: '#FFFFFF',
  },
});

export default RegisterScreen; 