import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList, Match, Score } from '@app/types';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@app/lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@app/lib/AuthContext';
import { joinMatch, leaveMatch, getMatchUsers } from '@app/lib/matches';
import ScoreForm from '@app/components/ScoreForm';
import TeamSelectionModal from '@app/components/TeamSelectionModal';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { HomeTabsParamList } from '@app/types';
import UserProfileModal from '@app/components/UserProfileModal';

type MatchDetailsScreenNavigationProp = CompositeNavigationProp<
  NativeStackScreenProps<HomeStackParamList, 'MatchDetails'>['navigation'],
  BottomTabNavigationProp<HomeTabsParamList>
>;

type Props = NativeStackScreenProps<HomeStackParamList, 'MatchDetails'>;

const MatchDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { match: initialMatch, matchId } = route.params;
  const [match, setMatch] = useState<Match | null>(initialMatch || null);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [usernames, setUsernames] = useState<{ [key: string]: string }>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  useEffect(() => {
    const fetchMatch = async () => {
      if (matchId) {
        try {
          const matchDoc = await getDoc(doc(db, 'matches', matchId));
          if (matchDoc.exists()) {
            const matchData = matchDoc.data() as Match;
            setMatch({
              ...matchData,
              id: matchDoc.id,
              date: matchData.date.toDate(),
              createdAt: matchData.createdAt.toDate(),
              updatedAt: matchData.updatedAt?.toDate()
            });
          }
        } catch (error) {
          console.error('Error fetching match:', error);
          Alert.alert('Error', 'No se pudo cargar el partido');
        }
      }
      setLoading(false);
    };

    if (!initialMatch && matchId) {
      fetchMatch();
    } else {
      setLoading(false);
    }
  }, [matchId, initialMatch]);

  useEffect(() => {
    if (user && match?.playersJoined.includes(user.uid)) {
      setIsJoined(true);
    }
  }, [user, match]);

  useEffect(() => {
    const fetchUsernames = async () => {
      if (match?.playersJoined.length > 0) {
        const users = await getMatchUsers(match.playersJoined);
        setUsernames(users);
      }
    };
    fetchUsernames();
  }, [match?.playersJoined]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se encontró el partido</Text>
      </View>
    );
  }

  const handleJoinMatch = () => {
    if (!user || !auth.currentUser) {
      Alert.alert('Error', 'Debes iniciar sesión para unirte a un partido');
      return;
    }

    if (match.playersJoined.length >= match.playersNeeded) {
      Alert.alert('Error', 'El partido ya está completo');
      return;
    }

    setShowTeamSelection(true);
  };

  const handleTeamSelection = async (team: 'team1' | 'team2', position: 'first' | 'second') => {
    if (!user) return;

    setLoading(true);
    try {
      await joinMatch(match.id, user.uid, team, position);
      setMatch(prev => ({
        ...prev,
        playersJoined: [...prev.playersJoined, user.uid],
        teams: {
          team1: team === 'team1' ? [...(prev.teams?.team1 || []), user.uid] : (prev.teams?.team1 || []),
          team2: team === 'team2' ? [...(prev.teams?.team2 || []), user.uid] : (prev.teams?.team2 || [])
        }
      }));
      setIsJoined(true);
      setShowTeamSelection(false);
      Alert.alert('Éxito', 'Te has unido al partido correctamente');
    } catch (error) {
      console.error('Error al unirse al partido:', error);
      Alert.alert('Error', 'No se pudo unir al partido');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveMatch = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await leaveMatch(match.id, user.uid);
      setMatch(prev => ({
        ...prev,
        playersJoined: prev.playersJoined.filter(id => id !== user.uid),
        teams: {
          team1: (prev.teams?.team1 || []).filter(id => id !== user.uid),
          team2: (prev.teams?.team2 || []).filter(id => id !== user.uid)
        }
      }));
      setIsJoined(false);
      Alert.alert('Éxito', 'Has abandonado el partido correctamente');
    } catch (error) {
      console.error('Error al abandonar el partido:', error);
      Alert.alert('Error', 'No se pudo abandonar el partido');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreSubmitted = async (newScore: Score) => {
    setMatch(prev => ({
      ...prev,
      score: newScore
    }));
    setShowScoreForm(false);
  };

  const handleUserPress = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserProfile(true);
  };

  const formattedDate = match.date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.mainContainer}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
            </TouchableOpacity>
            <Text style={styles.title}>{match.title}</Text>
            {isJoined && (
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={() => navigation.navigate('MatchChat', { matchId: match.id })}
              >
                <View style={styles.chatButtonContent}>
                  <Ionicons name="chatbubble-outline" size={20} color="#1e3a8a" />
                  <Text style={styles.chatButtonText}>Chat</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.content}>
            <View style={styles.mainInfoCard}>
              <View style={styles.mainInfoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="location-outline" size={28} color="#1e3a8a" />
                </View>
                <View style={styles.mainInfoTextContainer}>
                  <Text style={styles.mainInfoLabel}>Lugar</Text>
                  <Text style={styles.mainInfoText}>{match.location}</Text>
                </View>
              </View>

              <View style={styles.mainInfoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar-outline" size={28} color="#1e3a8a" />
                </View>
                <View style={styles.mainInfoTextContainer}>
                  <Text style={styles.mainInfoLabel}>Fecha y hora</Text>
                  <Text style={styles.mainInfoText}>{formattedDate}</Text>
                </View>
              </View>

              <View style={styles.mainInfoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="trophy-outline" size={28} color="#1e3a8a" />
                </View>
                <View style={styles.mainInfoTextContainer}>
                  <Text style={styles.mainInfoLabel}>Nivel</Text>
                  <Text style={styles.mainInfoText}>{match.level}</Text>
                </View>
              </View>

              <View style={styles.mainInfoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="people-outline" size={28} color="#1e3a8a" />
                </View>
                <View style={styles.mainInfoTextContainer}>
                  <Text style={styles.mainInfoLabel}>Rango de edad</Text>
                  <Text style={styles.mainInfoText}>{match.ageRange}</Text>
                </View>
              </View>
            </View>

            <View style={styles.playersCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Jugadores</Text>
                <View style={styles.playersCount}>
                  <Text style={styles.playersCountText}>
                    {match.playersJoined.length}/{match.playersNeeded}
                  </Text>
                </View>
              </View>

              {match.playersJoined.length > 0 ? (
                <View style={styles.playersList}>
                  {/* Equipo 1 */}
                  {match.teams?.team1.map((playerId, index) => (
                    <View key={playerId} style={styles.playerItem}>
                      <View style={styles.playerNumber}>
                        <Text style={styles.playerNumberText}>{index + 1}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.playerNameContainer}
                        onPress={() => handleUserPress(playerId)}
                      >
                        <Text style={styles.playerName}>
                          {playerId === auth.currentUser?.uid ? 'Tú' : usernames[playerId] || 'Cargando...'}
                        </Text>
                      </TouchableOpacity>
                      <View style={[styles.teamBadge, styles.team1Badge]}>
                        <Text style={styles.teamBadgeText}>Equipo 1</Text>
                      </View>
                    </View>
                  ))}

                  {/* Equipo 2 */}
                  {match.teams?.team2.map((playerId, index) => (
                    <View key={playerId} style={styles.playerItem}>
                      <View style={styles.playerNumber}>
                        <Text style={styles.playerNumberText}>{index + 1}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.playerNameContainer}
                        onPress={() => handleUserPress(playerId)}
                      >
                        <Text style={styles.playerName}>
                          {playerId === auth.currentUser?.uid ? 'Tú' : usernames[playerId] || 'Cargando...'}
                        </Text>
                      </TouchableOpacity>
                      <View style={[styles.teamBadge, styles.team2Badge]}>
                        <Text style={styles.teamBadgeText}>Equipo 2</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noPlayersText}>Aún no hay jugadores apuntados</Text>
              )}
            </View>

            {/* Resultado del partido (si existe) */}
            {match.score && (
              <View style={styles.scoreSection}>
                <Text style={styles.scoreTitle}>Resultado</Text>
                <View style={styles.scoreContainer}>
                  <View style={styles.scoreSet}>
                    <Text style={styles.scoreSetTitle}>Set 1</Text>
                    <Text style={styles.scoreSetValue}>
                      {match.score.set1.team1} - {match.score.set1.team2}
                    </Text>
                  </View>
                  <View style={styles.scoreSet}>
                    <Text style={styles.scoreSetTitle}>Set 2</Text>
                    <Text style={styles.scoreSetValue}>
                      {match.score.set2.team1} - {match.score.set2.team2}
                    </Text>
                  </View>
                  {match.score.set3 && (
                    <View style={styles.scoreSet}>
                      <Text style={styles.scoreSetTitle}>Set 3</Text>
                      <Text style={styles.scoreSetValue}>
                        {match.score.set3.team1} - {match.score.set3.team2}
                      </Text>
                    </View>
                  )}
                  <View style={styles.winnerContainer}>
                    <Text style={styles.winnerText}>
                      Ganador: Equipo {match.score.winner === 'team1' ? '1' : '2'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Formulario de resultados (condicional) */}
            {!match.score && isJoined && (
              <View style={styles.scoreFormContainer}>
                {(() => {
                  const now = new Date();
                  const matchDate = match.date;
                  const timeDiff = matchDate.getTime() - now.getTime();
                  const minutesRemaining = Math.ceil(timeDiff / (1000 * 60));
                  
                  if (timeDiff <= 0) {
                    return (
                      <TouchableOpacity 
                        style={styles.addScoreButton}
                        onPress={() => setShowScoreForm(true)}
                      >
                        <Ionicons name="add-circle-outline" size={20} color="#fff" style={styles.addScoreIcon} />
                        <Text style={styles.addScoreText}>Añadir Resultado</Text>
                      </TouchableOpacity>
                    );
                  }
                  
                  return (
                    <View style={[styles.addScoreButton, styles.addScoreButtonDisabled]}>
                      <Ionicons name="time-outline" size={20} color="#fff" style={styles.addScoreIcon} />
                      <Text style={styles.addScoreText}>
                        {minutesRemaining > 60 
                          ? `El partido comienza en ${Math.floor(minutesRemaining / 60)}h ${minutesRemaining % 60}m`
                          : `El partido comienza en ${minutesRemaining}m`}
                      </Text>
                    </View>
                  );
                })()}
              </View>
            )}

            <ScoreForm 
              matchId={match.id}
              onScoreSubmitted={handleScoreSubmitted}
              visible={showScoreForm}
              onClose={() => setShowScoreForm(false)}
            />

            <TeamSelectionModal
              visible={showTeamSelection}
              onClose={() => setShowTeamSelection(false)}
              onSelectTeam={handleTeamSelection}
              match={match}
            />
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          {!match.score && (
            <TouchableOpacity
              style={[
                styles.joinButton,
                isJoined ? styles.leaveButton : null,
                loading && styles.buttonDisabled,
                match.playersJoined.length >= match.playersNeeded && !isJoined && styles.buttonDisabled
              ]}
              onPress={isJoined ? handleLeaveMatch : handleJoinMatch}
              disabled={loading || (match.playersJoined.length >= match.playersNeeded && !isJoined)}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.joinButtonText}>
                  {isJoined 
                    ? 'Abandonar Partido' 
                    : match.playersJoined.length >= match.playersNeeded 
                      ? 'Partido Completo' 
                      : 'Unirse al Partido'
                  }
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <UserProfileModal
        visible={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserId || ''}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    color: '#314E99',
  },
  content: {
    padding: 16,
  },
  mainInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mainInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    backgroundColor: 'rgba(49,78,153,0.1)',
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  mainInfoTextContainer: {
    flex: 1,
  },
  mainInfoLabel: {
    fontSize: 14,
    color: '#1D1B20',
    marginBottom: 4,
  },
  mainInfoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#314E99',
  },
  playersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#314E99',
  },
  playersCount: {
    backgroundColor: 'rgba(49,78,153,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  playersCountText: {
    color: '#314E99',
    fontWeight: '600',
  },
  playersList: {
    marginTop: 8,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  playerNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(49,78,153,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerNumberText: {
    color: '#314E99',
    fontWeight: '600',
  },
  playerNameContainer: {
    flex: 1,
    paddingVertical: 4,
  },
  playerName: {
    fontSize: 16,
    color: '#1D1B20',
  },
  teamBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  team1Badge: {
    backgroundColor: 'rgba(49,78,153,0.1)',
  },
  team2Badge: {
    backgroundColor: 'rgba(220,38,38,0.1)',
  },
  teamBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1D1B20',
  },
  noPlayersText: {
    color: '#1D1B20',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  joinButton: {
    backgroundColor: '#314E99',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveButton: {
    backgroundColor: '#dc2626',
  },
  buttonDisabled: {
    backgroundColor: '#F0F0F0',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreSection: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#314E99',
    marginBottom: 12,
  },
  scoreContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  scoreSet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scoreSetTitle: {
    fontSize: 14,
    color: '#1D1B20',
  },
  scoreSetValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#314E99',
  },
  winnerContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  winnerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
  },
  scoreFormContainer: {
    marginBottom: 16,
  },
  addScoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#314E99',
    padding: 16,
    borderRadius: 8,
  },
  addScoreIcon: {
    marginRight: 8,
  },
  addScoreText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  addScoreButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.8,
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
  errorText: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatButton: {
    padding: 8,
    backgroundColor: 'rgba(49,78,153,0.1)',
    borderRadius: 8,
  },
  chatButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatButtonText: {
    marginLeft: 4,
    color: '#314E99',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default MatchDetailsScreen; 