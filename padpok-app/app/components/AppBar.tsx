import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NotificationHeader from './NotificationHeader';

const APP_BAR_HEIGHT = 56;

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
            <TouchableOpacity 
              onPress={onBackPress} 
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text 
            style={[
              styles.title, 
              showBackButton && styles.titleWithBack
            ]}
            numberOfLines={1}
          >
            padpok
          </Text>
          <NotificationHeader />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E3A8A',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  safeArea: {
    backgroundColor: '#1E3A8A',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: APP_BAR_HEIGHT,
    backgroundColor: '#1E3A8A',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.15,
    flex: 1,
    textAlign: 'left',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  titleWithBack: {
    marginLeft: 8,
    textAlign: 'left',
  },
});

export default AppBar;