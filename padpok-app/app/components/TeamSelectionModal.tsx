import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Match } from '@app/types';

interface TeamSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTeam: (team: 'team1' | 'team2', position: 'first' | 'second') => void;
  match: any;
  userInfos?: { [key: string]: { username: string } };
  currentUserId?: string;
}

const TeamSelectionModal: React.FC<TeamSelectionModalProps> = ({
  visible,
  onClose,
  onSelectTeam,
  match,
  userInfos,
  currentUserId
}) => {
  const isTeam1Full = match.teams?.team1.length === 2;
  const isTeam2Full = match.teams?.team2.length === 2;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecciona tu equipo</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.teamsContainer}>
            {/* Equipo 1 */}
            <View style={styles.teamSection}>
              <Text style={styles.teamTitle}>Equipo 1</Text>
              <View style={styles.teamInfo}>
                <Text style={styles.teamStatus}>
                  {isTeam1Full ? 'Completo' : '1/2 jugadores'}
                </Text>
                {match.teams?.team1.map((playerId: string, index: number) => (
                  <Text key={playerId} style={styles.playerName}>
                    {userInfos && userInfos[playerId]
                      ? (playerId === currentUserId ? 'Tú' : userInfos[playerId].username)
                      : (playerId === match.createdBy ? 'Creador del partido' : `Jugador ${index + 1}`)}
                  </Text>
                ))}
              </View>
              {!isTeam1Full && (
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => onSelectTeam('team1', 'second')}
                >
                  <Text style={styles.joinButtonText}>Unirse como compañero</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Equipo 2 */}
            <View style={styles.teamSection}>
              <Text style={styles.teamTitle}>Equipo 2</Text>
              <View style={styles.teamInfo}>
                <Text style={styles.teamStatus}>
                  {isTeam2Full ? 'Completo' : `${match.teams?.team2.length || 0}/2 jugadores`}
                </Text>
                {match.teams?.team2.map((playerId: string, index: number) => (
                  <Text key={playerId} style={styles.playerName}>
                    Jugador {index + 1}
                  </Text>
                ))}
              </View>
              {!isTeam2Full && (
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => onSelectTeam('team2', match.teams?.team2.length === 0 ? 'first' : 'second')}
                >
                  {match.teams?.team2.length === 1 ? <Text style={styles.joinButtonText}>Unirse como compañero</Text> : <Text style={styles.joinButtonText}>Unirse al equipo</Text>}
                </TouchableOpacity>
              )}
            </View>
          </View>
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
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  closeButton: {
    padding: 5,
  },
  teamsContainer: {
    gap: 20,
  },
  teamSection: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 15,
  },
  teamTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 10,
  },
  teamInfo: {
    marginBottom: 10,
  },
  teamStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  playerName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  joinButton: {
    backgroundColor: '#1e3a8a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default TeamSelectionModal;