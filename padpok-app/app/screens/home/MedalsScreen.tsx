import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@app/lib/AuthContext';
import { getAllMedals, getUserMedals } from '@app/lib/medals';
import { Medal, UserMedal } from '@app/types/medals';

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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Tu Colección de Medallas</Text>
          <Text style={styles.subtitle}>
            {unlockedMedalsCount} de {medals.length} medallas desbloqueadas
          </Text>
        </View>

        <View style={styles.medalsContainer}>
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
              <View key={medal.id} style={[styles.medalCard, !isUnlocked && styles.medalCardLocked]}>
                <View style={styles.medalIconContainer}>
                  <View style={[styles.medalCircle, isUnlocked ? styles.medalCircleUnlocked : styles.medalCircleLocked]}>
                    <Ionicons 
                      name={medal.icon as any} 
                      size={32} 
                      color={isUnlocked ? '#314E99' : '#1D1B20'} 
                    />
                  </View>
                  {!isUnlocked && (
                    <View style={styles.lockIcon}>
                      <Ionicons name="lock-closed" size={16} color="#fff" />
                    </View>
                  )}
                </View>
                
                <View style={styles.medalInfo}>
                  <Text style={[styles.medalName, !isUnlocked && styles.medalNameLocked]}>
                    {medal.name}
                  </Text>
                  <Text style={[styles.medalDescription, !isUnlocked && styles.medalDescriptionLocked]}>
                    {medal.description}
                  </Text>
                  <Text style={[styles.medalProgress, !isUnlocked && styles.medalProgressLocked]}>
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