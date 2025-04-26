import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '@app/contexts/AuthContext';
import { getUser, followUser, unfollowUser, isFollowing } from '@app/lib/users';
import { getUserMatchHistory } from '@app/lib/matches';
import { User, MatchHistory } from '@app/types';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@app/types';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [profile, setProfile] = useState<User | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);

  useEffect(() => {
    loadProfile();
  }, [user?.uid]);

  const loadProfile = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const userData = await getUser(user.uid);
      setProfile(userData);
      
      const following = await isFollowing(user.uid, user.uid);
      setIsFollowingUser(following);
      
      const history = await getUserMatchHistory(user.uid);
      setMatchHistory(history);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user?.uid || !profile) return;
    
    try {
      if (isFollowingUser) {
        await unfollowUser(user.uid, profile.id);
      } else {
        await followUser(user.uid, profile.id);
      }
      setIsFollowingUser(!isFollowingUser);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text>Error al cargar el perfil</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={profile.photoURL ? { uri: profile.photoURL } : require('@app/assets/default-avatar.png')}
          style={styles.avatar}
        />
        <Text style={styles.username}>@{profile.username}</Text>
        <Text style={styles.name}>{profile.displayName}</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats?.matchesPlayed || 0}</Text>
            <Text style={styles.statLabel}>Partidos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats?.matchesWon || 0}</Text>
            <Text style={styles.statLabel}>Victorias</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Racha</Text>
          </View>
        </View>

        <View style={styles.socialContainer}>
          <View style={styles.socialItem}>
            <Text style={styles.socialValue}>{profile.followers?.length || 0}</Text>
            <Text style={styles.socialLabel}>Seguidores</Text>
          </View>
          <View style={styles.socialItem}>
            <Text style={styles.socialValue}>{profile.following?.length || 0}</Text>
            <Text style={styles.socialLabel}>Siguiendo</Text>
          </View>
        </View>

        {user?.uid !== profile.id && (
          <TouchableOpacity
            style={[styles.followButton, isFollowingUser && styles.followingButton]}
            onPress={handleFollowToggle}
          >
            <Text style={styles.followButtonText}>
              {isFollowingUser ? 'Siguiendo' : 'Seguir'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Historial de Partidos</Text>
        {matchHistory.map((match) => (
          <TouchableOpacity
            key={match.id}
            style={styles.matchItem}
            onPress={() => navigation.navigate('MatchDetails', { matchId: match.matchId })}
          >
            <View style={styles.matchHeader}>
              <Text style={styles.matchDate}>
                {new Date(match.date).toLocaleDateString()}
              </Text>
              <Text style={[
                styles.matchResult,
                match.result === 'win' ? styles.winText : styles.lossText
              ]}>
                {match.result === 'win' ? 'Victoria' : 'Derrota'}
              </Text>
            </View>
            {match.score && (
              <Text style={styles.matchScore}>
                {match.score.set1.team1}-{match.score.set1.team2}, {match.score.set2.team1}-{match.score.set2.team2}
                {match.score.set3 && `, ${match.score.set3.team1}-${match.score.set3.team2}`}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  socialItem: {
    alignItems: 'center',
  },
  socialValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  socialLabel: {
    fontSize: 12,
    color: '#666',
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
  },
  followingButton: {
    backgroundColor: '#666',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  historySection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  matchItem: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  matchDate: {
    color: '#666',
  },
  matchResult: {
    fontWeight: 'bold',
  },
  winText: {
    color: '#4CAF50',
  },
  lossText: {
    color: '#F44336',
  },
  matchScore: {
    fontSize: 16,
  },
}); 