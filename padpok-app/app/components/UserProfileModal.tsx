import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@app/lib/firebase';
import { useAuth } from '@app/lib/AuthContext';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

interface UserProfile {
  username: string;
  level: string;
  stats: {
    matchesPlayed: number;
    wins: number;
  };
  followers: string[];
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ visible, onClose, userId }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile({
            username: userData.username || '',
            level: userData.level || 'Principiante',
            stats: userData.stats || {
              matchesPlayed: 0,
              wins: 0
            },
            followers: userData.followers || []
          });

          // Verificar si el usuario actual sigue a este usuario
          if (user && userData.followers?.includes(user.uid)) {
            setIsFollowing(true);
          } else {
            setIsFollowing(false);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        Alert.alert('Error', 'No se pudo cargar el perfil del usuario');
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchUserProfile();
    } else {
      // Resetear el estado cuando se cierra el modal
      setUserProfile(null);
      setIsFollowing(false);
    }
  }, [userId, visible, user]);

  const handleFollowToggle = async () => {
    if (!user || !userProfile) return;

    try {
      const userRef = doc(db, 'users', userId);
      const currentUserRef = doc(db, 'users', user.uid);

      if (isFollowing) {
        // Dejar de seguir
        await updateDoc(userRef, {
          followers: arrayRemove(user.uid)
        });
        await updateDoc(currentUserRef, {
          following: arrayRemove(userId)
        });
        setIsFollowing(false);
        // Actualizar el contador de seguidores en el estado local
        setUserProfile(prev => prev ? {
          ...prev,
          followers: prev.followers.filter(id => id !== user.uid)
        } : null);
      } else {
        // Seguir
        await updateDoc(userRef, {
          followers: arrayUnion(user.uid)
        });
        await updateDoc(currentUserRef, {
          following: arrayUnion(userId)
        });
        setIsFollowing(true);
        // Actualizar el contador de seguidores en el estado local
        setUserProfile(prev => prev ? {
          ...prev,
          followers: [...prev.followers, user.uid]
        } : null);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado de seguimiento');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#1e3a8a" />
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#1e3a8a" />
          ) : userProfile ? (
            <>
              <View style={styles.header}>
                <View style={styles.avatarContainer}>
                  <Ionicons name="person-circle-outline" size={50} color="#1e3a8a" />
                </View>
                <Text style={styles.username}>@{userProfile.username}</Text>
                <View style={styles.levelBadge}>
                  <Ionicons name="trophy-outline" size={16} color="#22C55E" />
                  <Text style={styles.levelText}>{userProfile.level}</Text>
                </View>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userProfile.stats.matchesPlayed}</Text>
                  <Text style={styles.statLabel}>Partidos</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userProfile.stats.wins}</Text>
                  <Text style={styles.statLabel}>Victorias</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userProfile.followers.length}</Text>
                  <Text style={styles.statLabel}>Seguidores</Text>
                </View>
              </View>

              {user && user.uid !== userId && (
                <TouchableOpacity 
                  style={[styles.followButton, isFollowing && styles.followingButton]}
                  onPress={handleFollowToggle}
                >
                  <Text style={styles.followButtonText}>
                    {isFollowing ? 'Dejar de seguir' : 'Seguir'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  levelText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  followButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#6b7280',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default UserProfileModal; 