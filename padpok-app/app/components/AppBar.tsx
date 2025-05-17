import React from 'react';
import { View, Text, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationHeader from './NotificationHeader';

// Altura moderna de AppBar para móviles
const APP_BAR_HEIGHT = 44; // Altura más compacta

interface AppBarProps {
  title: string;
}

const AppBar: React.FC<AppBarProps> = ({ title }) => {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <NotificationHeader />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#314E99',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  safeArea: {
    backgroundColor: '#314E99',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
    height: APP_BAR_HEIGHT,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.15,
  },
});

export default AppBar;