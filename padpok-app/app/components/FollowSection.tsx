import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@app/lib/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@app/lib/firebase';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@app/types';

type FollowSectionProps = {
  userId: string;
};

type User = {
  id: string;
  username: string;
  displayName: string;
  photoURL: string;
};

export default function FollowSection({ userId }: FollowSectionProps) {
  const { user: currentUser } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchFollowData();
  }, [userId]);

  const fetchFollowData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const followersIds = userData.followers || [];
        const followingIds = userData.following || [];

        // Fetch followers data
        const followersData = await Promise.all(
          followersIds.map(async (id: string) => {
            const followerDoc = await getDoc(doc(db, 'users', id));
            return followerDoc.exists() ? { id: followerDoc.id, ...followerDoc.data() } as User : null;
          })
        );

        // Fetch following data
        const followingData = await Promise.all(
          followingIds.map(async (id: string) => {
            const followingDoc = await getDoc(doc(db, 'users', id));
            return followingDoc.exists() ? { id: followingDoc.id, ...followingDoc.data() } as User : null;
          })
        );

        setFollowers(followersData.filter(Boolean) as User[]);
        setFollowing(followingData.filter(Boolean) as User[]);
        setIsFollowing(followersIds.includes(currentUser?.uid || ''));
      }
    } catch (error) {
      console.error('Error fetching follow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !userId) return;

    try {
      setLoading(true);
      const userRef = doc(db, 'users', userId);
      const currentUserRef = doc(db, 'users', currentUser.uid);

      if (isFollowing) {
        // Unfollow
        await updateDoc(userRef, {
          followers: arrayRemove(currentUser.uid)
        });
        await updateDoc(currentUserRef, {
          following: arrayRemove(userId)
        });
      } else {
        // Follow
        await updateDoc(userRef, {
          followers: arrayUnion(currentUser.uid)
        });
        await updateDoc(currentUserRef, {
          following: arrayUnion(userId)
        });
      }

      setIsFollowing(!isFollowing);
      fetchFollowData();
    } catch (error) {
      console.error('Error updating follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => navigation.navigate('Home', {
        screen: 'Profile',
        params: { userId: item.id }
      })}
    >
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        {item.displayName && (
          <Text style={styles.displayName}>{item.displayName}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6b7280" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentUser && currentUser.uid !== userId && (
        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={handleFollow}
          disabled={loading}
        >
          <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
            {isFollowing ? 'Dejar de seguir' : 'Seguir'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => navigation.navigate('Followers', { userId })}
        >
          <Text style={styles.statNumber}>{followers.length}</Text>
          <Text style={styles.statLabel}>Seguidores</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.statItem}
          onPress={() => navigation.navigate('Following', { userId })}
        >
          <Text style={styles.statNumber}>{following.length}</Text>
          <Text style={styles.statLabel}>Siguiendo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  followButton: {
    backgroundColor: '#1e3a8a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  followingButton: {
    backgroundColor: '#f3f4f6',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  followingButtonText: {
    color: '#4b5563',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  displayName: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
}); 