import React from 'react';
import { View, Text, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationHeader from './NotificationHeader';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASELINE_HEIGHT = 812; // Altura base de referencia
const SCALE = SCREEN_HEIGHT / BASELINE_HEIGHT;
const CONTAINER_HEIGHT = Math.round(120 * SCALE);
const CONTENT_HEIGHT = Math.round(56 * SCALE);

interface AppBarProps {
  title: string;
}

const AppBar: React.FC<AppBarProps> = ({ title }) => {
  return (
    <SafeAreaView style={[styles.container, { height: CONTAINER_HEIGHT }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <View style={[styles.content, { height: CONTENT_HEIGHT }]}>
        <Text style={styles.title}>{title}</Text>
        <NotificationHeader />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e3a8a',
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '500',
    color: '#ffffff',
  },
});

export default AppBar;