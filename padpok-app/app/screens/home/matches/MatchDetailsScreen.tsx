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
  StatusBar,
  Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@app/types/navigation';
import { Match, Score } from '@app/types/models';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@app/lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@app/lib/AuthContext';
import { joinMatch, leaveMatch, getMatchUsers } from '@app/lib/matches';
import ScoreForm from '@app/components/ScoreForm';
import TeamSelectionModal from '@app/components/TeamSelectionModal';
import UserProfileModal from '@app/components/UserProfileModal';
import CustomDialog from '@app/components/CustomDialog';
import { COLORS, FONTS, SIZES, SPACING } from '@app/constants/theme';
import { createNotification } from '@app/lib/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'MatchDetails'>;

const MatchDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const initialMatch = (route.params as any)?.match;
  const matchId = (route.params as any)?.matchId;
  const [match, setMatch] = useState<Match | null>(initialMatch || null);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [userInfos, setUserInfos] = useState<{ [key: string]: { username: string; gender?: 'Masculino' | 'Femenino' } }>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dialog, setDialog] = useState({ visible: false, title: '', message: '', onClose: () => {} });

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
              date: matchData.date && typeof (matchData.date as any).toDate === 'function' ? (matchData.date as any).toDate() : matchData.date,
              createdAt: matchData.createdAt && typeof (matchData.createdAt as any).toDate === 'function' ? (matchData.createdAt as any).toDate() : matchData.createdAt,
              updatedAt: matchData.updatedAt && typeof (matchData.updatedAt as any).toDate === 'function' ? (matchData.updatedAt as any).toDate() : matchData.updatedAt
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
    if (user && match?.playersJoined?.includes(user.uid)) {
      setIsJoined(true);
    }
  }, [user, match]);

  useEffect(() => {
    const fetchUserInfos = async () => {
      if (match && Array.isArray(match.playersJoined) && match.playersJoined.length > 0) {
        const users = await getMatchUsers(match.playersJoined);
        setUserInfos(users);
      }
    };
    fetchUserInfos();
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

  const handleJoinMatch = async () => {
    const now = new Date();
    const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (match.date <= minDate && match.playersJoined.length < match.playersNeeded) {
      // Cancelar el partido
      await updateDoc(doc(db, 'matches', match.id), { status: 'cancelled' });
      await createNotification(
        'match_cancelled',
        match.id,
        match.title,
        match.createdBy,
        { reason: 'No se completaron los jugadores 24h antes del inicio.' }
      );
      setDialog({
        visible: true,
        title: 'Partido cancelado',
        message: 'El partido ha sido cancelado automáticamente porque no se completaron los jugadores 24h antes del inicio.',
        onClose: () => setDialog({ ...dialog, visible: false })
      });
      return;
    }

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
      setMatch((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          playersJoined: [...prev.playersJoined, user.uid],
          teams: {
            team1: team === 'team1' ? [...(prev.teams?.team1 || []), user.uid] : (prev.teams?.team1 || []),
            team2: team === 'team2' ? [...(prev.teams?.team2 || []), user.uid] : (prev.teams?.team2 || [])
          }
        };
      });
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
      setMatch((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          playersJoined: prev.playersJoined.filter((id: string) => id !== user.uid),
          teams: {
            team1: (prev.teams?.team1 || []).filter((id: string) => id !== user.uid),
            team2: (prev.teams?.team2 || []).filter((id: string) => id !== user.uid)
          }
        };
      });
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
    setMatch((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        score: newScore
      };
    });
    setShowScoreForm(false);
  };

  const handleUserPress = (userId: string) => {

  };

  const handleDeleteMatch = async () => {
    if (!match) return;
    try {
      await deleteDoc(doc(db, 'matches', match.id));
      setDialog({
        visible: true,
        title: 'Partido eliminado',
        message: 'El partido ha sido eliminado correctamente',
        onClose: () => {
          setDialog((prev) => ({ ...prev, visible: false }));
          navigation.navigate('Home', {
            screen: 'Matches',
            params: { refresh: true }
          });
        }
      });
    } catch (error) {
      setDialog({
        visible: true,
        title: 'Error',
        message: 'No se pudo eliminar el partido',
        onClose: () => setDialog((prev) => ({ ...prev, visible: false }))
      });
    }
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
      <View style={[styles.mainContainer, Platform.OS === 'android' && { paddingTop: 24 }]}>
        <ScrollView style={styles.scrollView}>
          {/* Header premium con sombra y alineación */}
          <View style={{
            backgroundColor: COLORS.white,
            borderRadius: 16,
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.lg,
            marginBottom: SPACING.md,
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
              testID="back-button"
            >
              <Ionicons name="arrow-back" size={SIZES.lg} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.title} testID="match-title">{match.title}</Text>
            {isJoined && (
              <TouchableOpacity 
                style={{ padding: 8, backgroundColor: COLORS.lightGray, borderRadius: 8 }}
                onPress={() => navigation.navigate('MatchChat', { matchId: match.id })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="chatbubble-outline" size={SIZES.md} color={COLORS.primary} />
                  <Text style={{ marginLeft: 4, color: COLORS.primary, fontFamily: FONTS.medium, fontSize: SIZES.sm }}>Chat</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.content}>
            <View style={[styles.mainInfoCard, {
              backgroundColor: COLORS.white,
              borderRadius: 16,
              padding: SPACING.lg,
              marginBottom: SPACING.md,
              shadowColor: COLORS.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.10,
              shadowRadius: 8,
              elevation: 4,
              justifyContent: 'center',
            }]}
            >
              <Text style={{
                fontSize: SIZES.lg,
                fontFamily: FONTS.bold,
                color: COLORS.primary,
                marginBottom: SPACING.md,
                textAlign: 'left',
              }}>{match.title}</Text>
              <View style={{ gap: SPACING.sm }}>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={SIZES.md} color={COLORS.primary} />
                  <Text style={styles.infoText} testID="match-location">{match.location}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={SIZES.md} color={COLORS.primary} />
                  <Text style={styles.infoText}>{formattedDate}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="trophy" size={SIZES.md} color={COLORS.primary} />
                  <Text style={styles.infoText} testID="match-level">{match.level}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="people" size={SIZES.md} color={COLORS.primary} />
                  <Text style={styles.infoText} testID="match-age-range">{match.ageRange}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={SIZES.md} color={COLORS.primary} />
                  <Text style={styles.infoText} testID="players-count">
                    {match.playersJoined.length}/{match.playersNeeded} jugadores
                  </Text>
                </View>
              </View>
            </View>

            {/* Tarjeta de jugadores con estilo premium */}
            <View style={[
              styles.playersCard,
              {
                backgroundColor: COLORS.white,
                borderRadius: 16,
                padding: SPACING.lg,
                marginBottom: SPACING.md,
                shadowColor: COLORS.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.10,
                shadowRadius: 8,
                elevation: 4,
              },
            ]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
                <Text style={{ fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.primary }}>Jugadores</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: 16, minWidth: 48, justifyContent: 'center' }}>
                  <Ionicons name="people-outline" size={SIZES.md} color={COLORS.primary} style={{ marginRight: 2 }} />
                  <Text style={{ fontSize: SIZES.md, color: COLORS.gray, fontFamily: FONTS.medium }}>{match.playersJoined.length}/{match.playersNeeded}</Text>
                </View>
              </View>
              {match.playersJoined.length > 0 ? (
                <View style={{ marginTop: 8 }}>
                  {/* Equipo 1 */}
                  {match.teams?.team1.map((playerId: string, index: number) => (
                    <View key={playerId} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <Text style={{ color: COLORS.primary, fontFamily: FONTS.bold }}>{index + 1}</Text>
                      </View>
                      <TouchableOpacity style={{ flex: 1, paddingVertical: 4 }} onPress={() => handleUserPress(playerId)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: SIZES.md, color: COLORS.gray, fontFamily: FONTS.regular }}>
                            {playerId === auth.currentUser?.uid ? 'Tú' : userInfos[playerId]?.username || 'Cargando...'}
                          </Text>
                          {userInfos[playerId] && userInfos[playerId].gender === 'Masculino' && (
                            <Ionicons name="male" size={16} color="#3B82F6" style={{ marginLeft: 6 }} />
                          )}
                          {userInfos[playerId] && userInfos[playerId].gender === 'Femenino' && (
                            <Ionicons name="female" size={16} color="#EC4899" style={{ marginLeft: 6 }} />
                          )}
                        </View>
                      </TouchableOpacity>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginLeft: 8, backgroundColor: 'rgba(49,78,153,0.1)' }}>
                        <Text style={{ fontSize: 12, fontFamily: FONTS.medium, color: COLORS.primary }}>Equipo 1</Text>
                      </View>
                    </View>
                  ))}
                  {/* Equipo 2 */}
                  {match.teams?.team2.map((playerId: string, index: number) => (
                    <View key={playerId} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <Text style={{ color: COLORS.primary, fontFamily: FONTS.bold }}>{index + 1}</Text>
                      </View>
                      <TouchableOpacity style={{ flex: 1, paddingVertical: 4 }} onPress={() => handleUserPress(playerId)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: SIZES.md, color: COLORS.gray, fontFamily: FONTS.regular }}>
                            {playerId === auth.currentUser?.uid ? 'Tú' : userInfos[playerId]?.username || 'Cargando...'}
                          </Text>
                          {userInfos[playerId] && userInfos[playerId].gender === 'Masculino' && (
                            <Ionicons name="male" size={16} color="#3B82F6" style={{ marginLeft: 6 }} />
                          )}
                          {userInfos[playerId] && userInfos[playerId].gender === 'Femenino' && (
                            <Ionicons name="female" size={16} color="#EC4899" style={{ marginLeft: 6 }} />
                          )}
                        </View>
                      </TouchableOpacity>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginLeft: 8, backgroundColor: 'rgba(220,38,38,0.1)' }}>
                        <Text style={{ fontSize: 12, fontFamily: FONTS.medium, color: COLORS.primary }}>Equipo 2</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ color: COLORS.gray, fontStyle: 'italic', textAlign: 'center', marginVertical: 16, fontFamily: FONTS.regular }}>Aún no hay jugadores apuntados</Text>
              )}
            </View>

            {/* Sección de resultado con estilo premium */}
            {match.score && (
              <View style={{
                backgroundColor: COLORS.lightGray,
                borderRadius: 16,
                padding: SPACING.lg,
                marginBottom: SPACING.md,
                shadowColor: COLORS.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.10,
                shadowRadius: 8,
                elevation: 2,
              }}>
                <Text style={{ fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.primary, marginBottom: SPACING.md }}>Resultado</Text>
                <View style={{ backgroundColor: COLORS.white, borderRadius: 8, padding: SPACING.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: SIZES.md, color: COLORS.gray, fontFamily: FONTS.medium }}>Set 1</Text>
                    <Text style={{ fontSize: SIZES.md, color: COLORS.primary, fontFamily: FONTS.bold }}>{match.score.set1.team1} - {match.score.set1.team2}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: SIZES.md, color: COLORS.gray, fontFamily: FONTS.medium }}>Set 2</Text>
                    <Text style={{ fontSize: SIZES.md, color: COLORS.primary, fontFamily: FONTS.bold }}>{match.score.set2.team1} - {match.score.set2.team2}</Text>
                  </View>
                  {match.score.set3 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: SIZES.md, color: COLORS.gray, fontFamily: FONTS.medium }}>Set 3</Text>
                      <Text style={{ fontSize: SIZES.md, color: COLORS.primary, fontFamily: FONTS.bold }}>{match.score.set3.team1} - {match.score.set3.team2}</Text>
                    </View>
                  )}
                  <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.lightGray }}>
                    <Text style={{ fontSize: SIZES.md, fontFamily: FONTS.bold, color: '#22C55E' }}>
                      Ganador: Equipo {match.score.winner === 'team1' ? '1' : '2'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Formulario de resultado con estilo premium */}
            {!match.score && isJoined && (
              <View style={{
                marginBottom: SPACING.md,
                backgroundColor: COLORS.white,
                borderRadius: 16,
                padding: SPACING.lg,
                shadowColor: COLORS.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.10,
                shadowRadius: 8,
                elevation: 2,
              }}>
                {(() => {
                  const now = new Date();
                  const matchDate = match.date;
                  const timeDiff = matchDate.getTime() - now.getTime();
                  const minutesRemaining = Math.ceil(timeDiff / (1000 * 60));
                  if (timeDiff <= 0) {
                    return (
                      <TouchableOpacity 
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: COLORS.primary,
                          padding: 16,
                          borderRadius: 12,
                          shadowColor: COLORS.shadow,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.10,
                          shadowRadius: 8,
                          elevation: 2,
                          marginBottom: 4,
                        }}
                        onPress={() => setShowScoreForm(true)}
                      >
                        <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16, fontFamily: FONTS.medium }}>Añadir Resultado</Text>
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: COLORS.lightGray,
                      padding: 16,
                      borderRadius: 12,
                      shadowColor: COLORS.shadow,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.10,
                      shadowRadius: 8,
                      elevation: 1,
                      marginBottom: 4,
                    }}>
                      <Ionicons name="time-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                      <Text style={{ color: COLORS.gray, fontWeight: '600', fontSize: 16, fontFamily: FONTS.medium }}>
                        {minutesRemaining > 1380 
                          ? `El partido comienza en ${Math.floor(minutesRemaining / 1440)}d ${Math.floor((minutesRemaining % 1440) / 60)}h`
                          : minutesRemaining > 60 
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
              userInfos={userInfos}
              currentUserId={user?.uid}
            />
          </View>
        </ScrollView>

        <View style={styles.actionButtons}>
          {!isJoined && match?.playersJoined?.length < match?.playersNeeded && (
            <TouchableOpacity
              style={styles.joinButton}
              onPress={handleJoinMatch}
              testID="join-button"
            >
              <Text style={styles.buttonText}>Unirse al Partido</Text>
            </TouchableOpacity>
          )}

          {isJoined && match?.createdBy !== user?.uid && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleLeaveMatch}
              testID="leave-button"
            >
              <Text style={styles.buttonText}>Abandonar Partido</Text>
            </TouchableOpacity>
          )}

          {match?.createdBy === user?.uid && match?.playersJoined?.length === 1 && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setShowDeleteConfirm(true)}
              testID="delete-button"
            >
              <Text style={styles.buttonText}>Eliminar Partido</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <UserProfileModal
        visible={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={selectedUserId || ''}
      />

      <CustomDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        onClose={dialog.onClose}
      />

      {/* Modal de confirmación para eliminar partido */}
      <CustomDialog
        visible={showDeleteConfirm}
        title="Eliminar partido"
        message="¿Estás seguro de que quieres eliminar este partido? Esta acción no se puede deshacer."
        options={[
          { text: 'Cancelar', onPress: () => setShowDeleteConfirm(false), style: { backgroundColor: '#aaa' } },
          { text: 'Eliminar', onPress: handleDeleteMatch, style: { backgroundColor: '#e11d48' } }
        ]}
        onClose={() => setShowDeleteConfirm(false)}
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 2,
  },
  infoText: {
    fontSize: SIZES.md,
    color: COLORS.gray,
    fontFamily: FONTS.regular,
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
  buttonText: {
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
  title: {
    flex: 1,
    fontSize: SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    textAlign: 'center',
    marginRight: 8,
  },
  infoContainer: {
    padding: 16,
  },
  deleteButton: {
    backgroundColor: '#e11d48',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 4,
  },
  actionButtons: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});

export default MatchDetailsScreen; 