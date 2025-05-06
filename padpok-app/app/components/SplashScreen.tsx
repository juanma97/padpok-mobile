import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@app/lib/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@app/lib/firebase';

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
            },
          ]}
        >
          <View style={styles.ballContainer}>
            <Ionicons name="tennisball" size={80} color="#22C55E" />
          </View>
          <Text style={styles.title}>PADPOK</Text>
          <Text style={styles.subtitle}>Tu app de pádel</Text>
        </Animated.View>

        <View style={styles.progressWrapper}>
          <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
          </View>
          <Text style={styles.loadingText}>
            {loadingProgress < 0.3 ? 'Cargando...' :
             loadingProgress < 0.6 ? 'Preparando...' :
             '¡Casi listo!'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  ballContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 20,
    borderRadius: 50,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
  },
  progressWrapper: {
    alignItems: 'center',
    width: '80%',
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 2,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
