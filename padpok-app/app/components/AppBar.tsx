import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NotificationHeader from './NotificationHeader';
import { COLORS, FONTS, SIZES, SPACING } from '@app/constants/theme';

const APP_BAR_HEIGHT = SIZES.xl + SPACING.xl;
const FEEDBACK_FORM_URL = 'https://forms.gle/gAe37ZzMC6udozNM7';

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
          {showBackButton ? (
            <TouchableOpacity 
              onPress={onBackPress} 
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={SIZES.xl} color={COLORS.white} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: SIZES.xl + SPACING.md }} />
          )}
          <View style={styles.titleWrapper}>
            <Text 
              style={styles.title}
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>
          <NotificationHeader />
          <TouchableOpacity
            onPress={() => Linking.openURL(FEEDBACK_FORM_URL)}
            style={{ marginLeft: SPACING.md }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            accessibilityLabel="Enviar feedback"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={SIZES.xl} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  safeArea: {
    backgroundColor: COLORS.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    height: APP_BAR_HEIGHT,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.md,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: 'center',
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

export default AppBar;