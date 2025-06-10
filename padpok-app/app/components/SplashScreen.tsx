import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@app/lib/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@app/lib/firebase';
import { COLORS, FONTS, SIZES, SPACING } from '@app/constants/theme';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { user } = useAuth();

  // Animaciones con useRef para evitar recreación
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();

    // Rebote continuo
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const animateProgressTo = (to: number) => {
      Animated.timing(progressAnim, {
        toValue: to,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    };

    const loadInitialData = async () => {
      try {
        const medalsSnapshot = await getDocs(collection(db, 'medals'));
        setLoadingProgress(0.3);
        animateProgressTo(0.3);

        if (user) {
          const userPrefsDoc = await getDocs(collection(db, 'userPreferences'));
          setLoadingProgress(0.6);
          animateProgressTo(0.6);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoadingProgress(1);
        animateProgressTo(1);

        setTimeout(() => {
          onFinish();
        }, 600);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setLoadingProgress(1);
        animateProgressTo(1);
        setTimeout(() => {
          onFinish();
        }, 600);
      }
    };

    loadInitialData();
  }, [onFinish, user]);

  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: scaleAnim }, { translateY }],
              shadowColor: COLORS.shadow,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 16,
              elevation: 8,
            },
          ]}
        >
          <View style={styles.ballContainer}>
            <Ionicons name="tennisball" size={SIZES.huge * 2} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>PADPOK</Text>
          <Text style={styles.subtitle}>Tu app de pádel</Text>
        </Animated.View>

        <View style={styles.progressWrapper}>
          <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>
          <Text style={styles.loadingText}>
            {loadingProgress < 0.3 ? 'Cargando' :
             loadingProgress < 0.6 ? 'Preparando' :
             '¡Casi listo!'}
            <Text style={{ color: COLORS.accent }}>...</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  ballContainer: {
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: 80,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: SIZES.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.sm,
    letterSpacing: 4,
    textShadowColor: COLORS.shadow,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: SIZES.lg,
    fontFamily: FONTS.medium,
    color: COLORS.accent,
    letterSpacing: 1,
    marginBottom: SPACING.xl,
    textShadowColor: COLORS.shadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  progressWrapper: {
    alignItems: 'center',
    width: '80%',
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  loadingText: {
    color: COLORS.white,
    fontSize: SIZES.md,
    fontFamily: FONTS.regular,
    letterSpacing: 0.5,
    marginTop: 2,
  },
});

export default SplashScreen;
