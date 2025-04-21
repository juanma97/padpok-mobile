import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Definimos el tipo de las rutas
type RootStackParamList = {
  Welcome: undefined;
  MainTabs: undefined;
};

// Definimos el tipo de navegación
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

const WelcomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleStart = () => {
    navigation.navigate('MainTabs');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="tennisball-outline" size={40} color="#22C55E" />
          </View>
          <Text style={styles.logoText}>PADPOK</Text>
        </View>
        <Text style={styles.title}>Encuentra tu próximo partido de pádel</Text>
        <Text style={styles.subtitle}>
          Conecta con jugadores de tu nivel y zona
        </Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Empezar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f0f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22C55E',
    letterSpacing: 2,
  },
  button: {
    backgroundColor: '#22C55E',
    width: '100%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default WelcomeScreen; 