import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar,
  SafeAreaView,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@app/types/navigation';
import { useRef, useEffect } from 'react';
import { COLORS, FONTS, SIZES, SPACING } from '@app/constants/theme';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const WelcomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  // Animación para el logo
  const logoAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(logoAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 80,
    }).start();
  }, []);

  const handleExploreWithoutRegistration = () => {
    navigation.navigate('Matches');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primary }}>
      <StatusBar barStyle="light-content" />
      <View style={styles.gradientBg}>
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Animated.View
              style={{
                ...styles.logoContainer,
                transform: [
                  { scale: logoAnim },
                  { translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
                ],
                opacity: logoAnim,
              }}
            >
              <View style={styles.logoCircle}>
                <Ionicons name="tennisball-outline" size={40} color={COLORS.primary} />
              </View>
            </Animated.View>
            <Text style={styles.title}>Encuentra tu próximo partido</Text>
            <Text style={styles.subtitle}>
              Descubre, juega y conecta con la comunidad padelera cerca de ti
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Register', undefined)}
            >
              <Text style={styles.primaryButtonText}>Crear cuenta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Login', undefined)}
            >
              <Text style={styles.secondaryButtonText}>Iniciar sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exploreButton}
              activeOpacity={0.7}
              onPress={handleExploreWithoutRegistration}
            >
              <Ionicons name="compass-outline" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
              <Text style={styles.exploreButtonText}>Explorar sin registrarse</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  overlay: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.regular,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.92,
    marginBottom: SPACING.xl,
  },
  buttonContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  primaryButton: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    fontSize: SIZES.lg,
    letterSpacing: 0.2,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.lg,
    letterSpacing: 0.2,
  },
  exploreButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    alignSelf: 'center',
  },
  exploreButtonText: {
    color: COLORS.white,
    fontSize: SIZES.md,
    fontFamily: FONTS.medium,
    textDecorationLine: 'underline',
    marginLeft: 2,
  },
});

export default WelcomeScreen; 