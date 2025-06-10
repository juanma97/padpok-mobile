import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@app/lib/AuthContext';
import { getAllMedals, getUserMedals } from '@app/lib/medals';
import { Medal, UserMedal } from '@app/types/medals';
import { COLORS, SIZES, FONTS, SPACING } from '@app/constants/theme';

const MedalsScreen = () => {
  const { user } = useAuth();
  const [medals, setMedals] = useState<Medal[]>([]);
  const [userMedals, setUserMedals] = useState<UserMedal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedals = async () => {
      if (!user) return;
      
      try {
        const [allMedals, userMedalsList] = await Promise.all([
          getAllMedals(),
          getUserMedals(user.uid)
        ]);
        
        setMedals(allMedals);
        setUserMedals(userMedalsList);
      } catch (error) {
        console.error('Error fetching medals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedals();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#314E99" />
      </View>
    );
  }

  const unlockedMedalsCount = userMedals.filter(medal => medal.unlocked).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
        <View style={{ alignItems: 'center', padding: SPACING.xl, backgroundColor: COLORS.background, borderBottomLeftRadius: SPACING.xl, borderBottomRightRadius: SPACING.xl, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 4, marginBottom: SPACING.lg }}>
          <Text style={{ fontSize: SIZES.xl, fontFamily: FONTS.bold, color: COLORS.primary, marginBottom: SPACING.xs }}>Tu Colección de Medallas</Text>
          <Text style={{ fontSize: SIZES.md, color: COLORS.gray, fontFamily: FONTS.medium }}>
            {unlockedMedalsCount} de {medals.length} medallas desbloqueadas
          </Text>
        </View>

        <View style={{ padding: SPACING.lg }}>
          {medals.map((medal) => {
            const userMedal = userMedals.find(um => um.id === medal.id);
            const isUnlocked = userMedal?.unlocked || false;
            const progress = userMedal?.progress || 0;
            const getProgressText = () => {
              if (isUnlocked) return '¡Desbloqueada!';
              const requirements = medal.requirements;
              if (!requirements) return 'Progreso no disponible';
              const { type, value } = requirements;
              const typeText = type === 'matches_played' ? 'partidos' : 
                type === 'wins' ? 'victorias' :
                type === 'win_streak' ? 'victorias consecutivas' :
                type === 'unique_players' ? 'jugadores diferentes' :
                type === 'time_of_day' ? 'partidos' :
                type === 'weekend_matches' ? 'partidos en fin de semana' : '';
              return `${progress}/${value} ${typeText}`;
            };
            return (
              <View key={medal.id} style={{
                flexDirection: 'row',
                backgroundColor: COLORS.light,
                borderRadius: 16,
                padding: SPACING.lg,
                marginBottom: SPACING.md,
                shadowColor: COLORS.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.10,
                shadowRadius: 4,
                elevation: 2,
                opacity: isUnlocked ? 1 : 0.6,
                borderWidth: 2,
                borderColor: isUnlocked ? COLORS.accent : COLORS.border,
                alignItems: 'center',
              }}>
                <View style={{ position: 'relative', marginRight: SPACING.lg }}>
                  <View style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: isUnlocked ? 'rgba(49,78,153,0.08)' : COLORS.lightGray,
                    borderWidth: 2,
                    borderColor: isUnlocked ? COLORS.accent : COLORS.gray,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Ionicons name={medal.icon as any} size={SIZES.xl} color={isUnlocked ? COLORS.accent : COLORS.gray} />
                  </View>
                  {!isUnlocked && (
                    <View style={{ position: 'absolute', bottom: -4, right: -4, backgroundColor: COLORS.gray, borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="lock-closed" size={SIZES.md} color={COLORS.white} />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={{ fontSize: SIZES.lg, fontFamily: FONTS.bold, color: isUnlocked ? COLORS.primary : COLORS.gray, marginBottom: 2 }}>{medal.name}</Text>
                  <Text style={{ fontSize: SIZES.sm, color: COLORS.dark, fontFamily: FONTS.regular, marginBottom: 4, opacity: isUnlocked ? 1 : 0.7 }}>{medal.description}</Text>
                  <Text style={{ fontSize: SIZES.xs, color: isUnlocked ? COLORS.success : COLORS.gray, fontFamily: FONTS.medium }}>
                    {getProgressText()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#314E99',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#1D1B20',
  },
  medalsContainer: {
    padding: 16,
  },
  medalCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medalCardLocked: {
    opacity: 0.7,
  },
  medalIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  medalCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalCircleUnlocked: {
    backgroundColor: 'rgba(49,78,153,0.1)',
    borderWidth: 2,
    borderColor: '#314E99',
  },
  medalCircleLocked: {
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: '#1D1B20',
  },
  lockIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#1D1B20',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  medalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#314E99',
    marginBottom: 4,
  },
  medalNameLocked: {
    color: '#1D1B20',
  },
  medalDescription: {
    fontSize: 14,
    color: '#1D1B20',
    marginBottom: 8,
  },
  medalDescriptionLocked: {
    color: '#1D1B20',
    opacity: 0.7,
  },
  medalProgress: {
    fontSize: 12,
    color: '#314E99',
    fontWeight: '500',
  },
  medalProgressLocked: {
    color: '#1D1B20',
    opacity: 0.7,
  },
});

export default MedalsScreen; 