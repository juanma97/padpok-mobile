import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@app/lib/firebase';
import { Medal, UserMedal } from '@app/types/medals';
import { getAllMedals, getUserMedals } from '@app/lib/medals';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

interface UserProfile {
  username: string;
  displayName: string;
  level: string | null;
  clubZone?: string;
  bio?: string;
  stats: {
    matchesPlayed: number;
    wins: number;
    medals: string[];
  };
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ visible, onClose, userId }) => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [medals, setMedals] = useState<Medal[]>([]);
  const [userMedals, setUserMedals] = useState<UserMedal[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !visible) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile({
            username: userData.username || '',
            displayName: userData.displayName || '',
            level: userData.level || null,
            clubZone: userData.clubZone || '',
            bio: userData.bio || '',
            stats: userData.stats || {
              matchesPlayed: 0,
              wins: 0,
              medals: []
            }
          });
          
          try {
            // Fetch medals
            const allMedals = await getAllMedals();
            setMedals(allMedals);
            
            const userMedalsList = await getUserMedals(userId);
            setUserMedals(userMedalsList);
          } catch (medalError) {
            console.error('Error fetching medals:', medalError);
            // No mostramos error al usuario si falla solo la carga de medallas
            // Continuamos con el perfil básico
            setUserMedals([]);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('No se pudo cargar el perfil del usuario');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, visible]);

  const unlockedMedalsCount = userMedals.filter(medal => medal.unlocked).length || 0;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Perfil de Jugador</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1e3a8a" />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : userProfile ? (
            <ScrollView style={styles.scrollView}>
              <View style={styles.profileContent}>
                <View style={styles.userHeader}>
                  <View style={styles.avatarContainer}>
                    <Ionicons name="person-circle-outline" size={50} color="#1e3a8a" />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.name}>{userProfile.username}</Text>
                    <View style={styles.userBadges}>
                      {userProfile.level && (
                        <View style={styles.badge}>
                          <Ionicons name="trophy-outline" size={16} color="#22C55E" />
                          <Text style={styles.badgeText}>{userProfile.level}</Text>
                        </View>
                      )}
                      {userProfile.clubZone && (
                        <View style={styles.badge}>
                          <Ionicons name="location-outline" size={16} color="#22C55E" />
                          <Text style={styles.badgeText}>{userProfile.clubZone}</Text>
                        </View>
                      )}
                    </View>
                    {userProfile.bio && (
                      <Text style={styles.bioText}>{userProfile.bio}</Text>
                    )}
                  </View>
                </View>

                {/* Estadísticas */}
                <View style={styles.statsSection}>
                  <Text style={styles.sectionTitle}>Estadísticas</Text>
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <View style={styles.statIconContainer}>
                        <Ionicons name="tennisball-outline" size={20} color="#22C55E" />
                      </View>
                      <Text style={styles.statNumber}>{userProfile.stats.matchesPlayed || 0}</Text>
                      <Text style={styles.statLabel}>Partidos</Text>
                    </View>
                    <View style={styles.statItem}>
                      <View style={styles.statIconContainer}>
                        <Ionicons name="trophy-outline" size={20} color="#22C55E" />
                      </View>
                      <Text style={styles.statNumber}>{userProfile.stats.wins || 0}</Text>
                      <Text style={styles.statLabel}>Victorias</Text>
                    </View>
                    <View style={styles.statItem}>
                      <View style={styles.statIconContainer}>
                        <Ionicons name="medal-outline" size={20} color="#22C55E" />
                      </View>
                      <Text style={styles.statNumber}>
                        {unlockedMedalsCount}
                      </Text>
                      <Text style={styles.statLabel}>Medallas</Text>
                    </View>
                  </View>
                </View>

                {/* Medallas */}
                <View style={styles.medalsSection}>
                  <Text style={styles.sectionTitle}>Medallas</Text>
                  {unlockedMedalsCount > 0 ? (
                    <View style={styles.medalsGrid}>
                      {userMedals
                        .filter(medal => medal.unlocked)
                        .slice(0, 4)
                        .map((userMedal) => {
                          const medal = medals.find(m => m.id === userMedal.id);
                          return medal ? (
                            <View key={medal.id} style={styles.medalItem}>
                              <View style={styles.medalCircleUnlocked}>
                                <Ionicons name={medal.icon as any} size={20} color="#22C55E" />
                              </View>
                              <Text style={styles.medalName} numberOfLines={1}>
                                {medal.name}
                              </Text>
                            </View>
                          ) : null;
                        })}
                    </View>
                  ) : (
                    <View style={styles.noMedalsContainer}>
                      <Ionicons name="trophy-outline" size={24} color="#9ca3af" />
                      <Text style={styles.noMedalsText}>
                        Sin medallas desbloqueadas
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileContent: {
    padding: 16,
  },
  userHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  userBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E15',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  badgeText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '500',
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  errorContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
  },
  statsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  statLabel: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '500',
  },
  medalsSection: {
    marginBottom: 16,
  },
  medalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  medalItem: {
    width: '22%',
    alignItems: 'center',
  },
  medalCircleUnlocked: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#22C55E',
    marginBottom: 6,
  },
  medalName: {
    fontSize: 11,
    color: '#4b5563',
    textAlign: 'center',
    fontWeight: '500',
  },
  noMedalsContainer: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
  },
  noMedalsText: {
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  }
});

export default UserProfileModal; 