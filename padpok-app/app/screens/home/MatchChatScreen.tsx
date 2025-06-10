import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@app/types';
import MatchChat from '@app/components/MatchChat';
import { COLORS, FONTS, SIZES, SPACING } from '@app/constants/theme';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<HomeStackParamList, 'MatchChat'>;

const MatchChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { matchId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.lightGray} />
      <View style={{
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 4,
      }}>
        <TouchableOpacity 
          style={{ padding: 8, marginRight: 8 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={SIZES.lg} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={{
          flex: 1,
          fontSize: SIZES.lg,
          fontFamily: FONTS.bold,
          color: COLORS.primary,
          textAlign: 'center',
          marginRight: 8,
        }}>Chat del partido</Text>
        <View style={{ width: SIZES.lg + 16 }} />
      </View>
      <MatchChat matchId={matchId} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
});

export default MatchChatScreen; 