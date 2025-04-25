import React, { useState } from 'react';
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
import { HomeStackParamList, Match } from '@app/types';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@app/lib/firebase';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<HomeStackParamList, 'MatchDetails'>;

const MatchDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { match } = route.params;
  const [loading, setLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(
    match.playersJoined.includes(auth.currentUser?.uid || '')
  );

  const handleJoinMatch = async () => {
    if (!auth.currentUser) {
      Alert.alert('Error', 'Debes iniciar sesión para unirte a un partido');
      return;
    }

    if (isJoined) {
      Alert.alert('Ya estás apuntado', 'Ya formas parte de este partido');
      return;
    }

    if (match.playersJoined.length >= match.playersNeeded) {
      Alert.alert('Partido completo', 'Este partido ya tiene todos los jugadores necesarios');
      return;
    }

    setLoading(true);
    try {
      const matchRef = doc(db, 'matches', match.id);
      await updateDoc(matchRef, {
        playersJoined: [...match.playersJoined, auth.currentUser.uid]
      });
      
      setIsJoined(true);
      Alert.alert('¡Listo!', 'Te has unido al partido correctamente');
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo unirte al partido: ' + error.message);
    } finally {
      setLoading(false);
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
                <Text style={styles.levelLabel}>Nivel</Text>
                <Text style={styles.levelText}>{match.level}</Text>
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
                  {match.playersJoined.map((playerId, index) => (
                    <View key={playerId} style={styles.playerItem}>
                      <View style={styles.playerNumber}>
                        <Text style={styles.playerNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.playerName}>
                        {playerId === auth.currentUser?.uid ? 'Tú' : `Jugador ${index + 1}`}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noPlayersText}>Aún no hay jugadores apuntados</Text>
              )}
            </View>

            {match.description && (
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionTitle}>Descripción</Text>
                <Text style={styles.descriptionText}>{match.description}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.joinButton,
              (isJoined || match.playersJoined.length >= match.playersNeeded) && styles.joinButtonDisabled
            ]}
            onPress={handleJoinMatch}
            disabled={isJoined || match.playersJoined.length >= match.playersNeeded || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.joinButtonText}>
                {isJoined ? 'Ya estás apuntado' : 'Unirse al partido'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  content: {
    padding: 16,
  },
  mainInfoCard: {
    backgroundColor: '#fff',
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
    backgroundColor: 'rgba(30,58,138,0.1)',
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  mainInfoTextContainer: {
    flex: 1,
  },
  mainInfoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  mainInfoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  playersCard: {
    backgroundColor: '#fff',
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
    color: '#1e3a8a',
  },
  playersCount: {
    backgroundColor: 'rgba(30,58,138,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  playersCountText: {
    color: '#1e3a8a',
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
    borderBottomColor: '#f0f0f0',
  },
  playerNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(30,58,138,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerNumberText: {
    color: '#1e3a8a',
    fontWeight: '600',
  },
  playerName: {
    fontSize: 16,
    color: '#4b5563',
  },
  noPlayersText: {
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  levelCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  levelInfo: {
    marginLeft: 16,
  },
  levelLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  levelText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  descriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  joinButton: {
    backgroundColor: '#1e3a8a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MatchDetailsScreen; 