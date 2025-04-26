import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@app/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@app/lib/firebase';
import { Ionicons } from '@expo/vector-icons';

type FollowersScreenRouteProp = RouteProp<RootStackParamList, 'Followers'>;
type FollowersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Followers'>;

type User = {
  id: string;
  username: string;
  displayName: string;
  photoURL: string;
};

export default function FollowersScreen() {
  const route = useRoute<FollowersScreenRouteProp>();
  const navigation = useNavigation<FollowersScreenNavigationProp>();
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState<User[]>([]);

  useEffect(() => {
    fetchFollowers();
  }, [route.params.userId]);

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      const userRef = doc(db, 'users', route.params.userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const followersIds = userData.followers || [];

        const followersData = await Promise.all(
          followersIds.map(async (id: string) => {
            const followerDoc = await getDoc(doc(db, 'users', id));
            return followerDoc.exists() ? { id: followerDoc.id, ...followerDoc.data() } as User : null;
          })
        );

        setFollowers(followersData.filter(Boolean) as User[]);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
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
      <FlatList
        data={followers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No hay seguidores</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 16,
  },
}); 