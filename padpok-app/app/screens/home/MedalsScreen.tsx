import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@app/lib/AuthContext';
import { getAllMedals, getUserMedals, Medal } from '@app/lib/medals';

const MedalsScreen = () => {
  const { user } = useAuth();
  const [medals, setMedals] = useState<Medal[]>([]);
  const [userMedals, setUserMedals] = useState<string[]>([]);
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
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Tu Colección de Medallas</Text>
          <Text style={styles.subtitle}>
            {userMedals.length} de {medals.length} medallas desbloqueadas
          </Text>
        </View>

        <View style={styles.medalsContainer}>
          {medals.map((medal) => {
            const isUnlocked = userMedals.includes(medal.id);
            
            return (
              <View key={medal.id} style={[styles.medalCard, !isUnlocked && styles.medalCardLocked]}>
                <View style={styles.medalIconContainer}>
                  <View style={[styles.medalCircle, isUnlocked ? styles.medalCircleUnlocked : styles.medalCircleLocked]}>
                    <Ionicons 
                      name={medal.icon as any} 
                      size={32} 
                      color={isUnlocked ? '#22C55E' : '#9ca3af'} 
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
                    {isUnlocked ? '¡Desbloqueada!' : medal.progress}
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
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    color: '#1e3a8a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  medalsContainer: {
    padding: 16,
  },
  medalCard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#22C55E15',
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  medalCircleLocked: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#9ca3af',
  },
  lockIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#6b7280',
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
    color: '#1e3a8a',
    marginBottom: 4,
  },
  medalNameLocked: {
    color: '#6b7280',
  },
  medalDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  medalDescriptionLocked: {
    color: '#9ca3af',
  },
  medalProgress: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
  },
  medalProgressLocked: {
    color: '#9ca3af',
  },
});

export default MedalsScreen; 