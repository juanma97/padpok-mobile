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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '@app/lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import type { AuthStackParamList } from '@app/types/navigation';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import CustomDialog from '@app/components/CustomDialog';
import { COLORS, FONTS, SIZES, SPACING } from '@app/constants/theme';

const LoginScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Login'>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const showDialog = (title: string, message: string, options?: { text: string; onPress?: () => void; style?: object }[]) => {
    setDialog({ visible: true, title, message, options });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showDialog('Error', 'Por favor, completa todos los campos');
      return;
    }
    if (!validateEmail(email)) {
      showDialog('Error de Formato', 'Por favor, introduce un email válido.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Matches'
        })
      );
    } catch (error: any) {
      let errorMessage = 'Error al iniciar sesión';
      if (error.code === 'auth/invalid-email' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Por favor, espera un momento';
      }
      showDialog('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showDialog('Error', 'Por favor, ingresa tu email para recuperar la contraseña');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showDialog(
        'Email enviado',
        'Se ha enviado un email con instrucciones para recuperar tu contraseña',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      let errorMessage = 'Error al enviar el email de recuperación';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El email ingresado no es válido';
      }
      showDialog('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="tennisball-outline" size={40} color="#314E99" />
              </View>
              <Text style={styles.logoText}>padpok</Text>
            </View>
            <Text style={styles.title}>Bienvenido de nuevo</Text>
            <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
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
              <Ionicons name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
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
                  color="#6b7280" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>¿No tienes una cuenta?</Text>
              <TouchableOpacity onPress={handleRegister}>
                <Text style={styles.registerLink}>Regístrate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        options={dialog.options}
        onClose={() => setDialog(d => ({ ...d, visible: false }))}
      />
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
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  logoText: {
    fontSize: SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.dark,
    opacity: 0.7,
    textAlign: 'center',
  },
  formContainer: {
    gap: SPACING.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.sm,
    color: COLORS.dark,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: SIZES.md,
    color: COLORS.dark,
    fontFamily: FONTS.regular,
  },
  eyeIcon: {
    padding: SPACING.xs,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: SIZES.sm,
    fontFamily: FONTS.medium,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  buttonDisabled: {
    backgroundColor: COLORS.dark,
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.lg,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    gap: SPACING.xs,
  },
  registerText: {
    color: COLORS.dark,
    opacity: 0.7,
    fontFamily: FONTS.regular,
  },
  registerLink: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
});

export default LoginScreen; 