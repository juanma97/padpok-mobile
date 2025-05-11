import React from 'react';
import { View, Text, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationHeader from './NotificationHeader';

// Altura estándar de AppBar según Material Design
const APP_BAR_HEIGHT = 56; // Altura base del AppBar
const STATUS_BAR_HEIGHT = 24; // Altura aproximada de la barra de estado
const TOTAL_HEIGHT = APP_BAR_HEIGHT + STATUS_BAR_HEIGHT;

interface AppBarProps {
  title: string;
}

const AppBar: React.FC<AppBarProps> = ({ title }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#314E99" />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <NotificationHeader />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#314E99',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: APP_BAR_HEIGHT,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.15,
  },
});

export default AppBar;