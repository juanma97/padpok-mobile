import React from 'react';
import { View, Text, StyleSheet, StatusBar, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NotificationHeader from './NotificationHeader';

// Altura moderna de AppBar para móviles
const APP_BAR_HEIGHT = 44; // Altura más compacta

interface AppBarProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const AppBar: React.FC<AppBarProps> = ({ title, showBackButton, onBackPress }) => {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.content}>
          {showBackButton && (
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, showBackButton && styles.titleWithBack]}>{title}</Text>
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
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.15,
    flex: 1,
  },
  titleWithBack: {
    marginLeft: 8,
  },
});

export default AppBar;