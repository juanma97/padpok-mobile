import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateMatchScore, validateScore } from '@app/lib/matches';
import { Score } from '@app/types';

interface ScoreFormProps {
  matchId: string;
  onScoreSubmitted: (score: Score) => void;
  visible: boolean;
  onClose: () => void;
}

const ScoreForm: React.FC<ScoreFormProps> = ({ matchId, onScoreSubmitted, visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [showSet3, setShowSet3] = useState(false);
  const [score, setScore] = useState<Score>({
    set1: { team1: 0, team2: 0 },
    set2: { team1: 0, team2: 0 },
    winner: 'team1'
  });

  const handleScoreChange = (set: 'set1' | 'set2' | 'set3', team: 'team1' | 'team2', value: number) => {
    setScore(prev => ({
      ...prev,
      [set]: {
        ...prev[set],
        [team]: value
      }
    }));
  };

  const calculateWinner = (score: Score): 'team1' | 'team2' => {
    const team1Wins = 
      (score.set1.team1 > score.set1.team2 ? 1 : 0) +
      (score.set2.team1 > score.set2.team2 ? 1 : 0) +
      (score.set3 && score.set3.team1 > score.set3.team2 ? 1 : 0);
    
    return team1Wins >= 2 ? 'team1' : 'team2';
  };

  const handleSubmit = async () => {
    // Si no se jugó el tercer set, eliminarlo del objeto
    const scoreToSubmit = showSet3 ? {
      ...score,
      set3: score.set3,
      winner: calculateWinner(score)
    } : {
      set1: score.set1,
      set2: score.set2,
      winner: calculateWinner(score)
    };

    // Validar el resultado
    if (!validateScore(scoreToSubmit)) {
      Alert.alert('Error', 'El resultado no es válido según las reglas del pádel');
      return;
    }

    setLoading(true);
    try {
      await updateMatchScore(matchId, scoreToSubmit);
      Alert.alert('Éxito', 'Resultado guardado correctamente');
      onScoreSubmitted(scoreToSubmit);
      onClose();
    } catch (error) {
      console.error('Error al guardar el resultado:', error);
      Alert.alert('Error', 'No se pudo guardar el resultado');
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.modalTitle}>Añadir Resultado</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {/* Set 1 */}
          <View style={styles.setContainer}>
            <Text style={styles.setTitle}>Set 1</Text>
            <View style={styles.scoreContainer}>
              <View style={styles.teamContainer}>
                <Text style={styles.teamLabel}>Equipo 1</Text>
                <View style={styles.scoreInput}>
                  <TouchableOpacity 
                    style={styles.scoreButton}
                    onPress={() => handleScoreChange('set1', 'team1', Math.max(0, score.set1.team1 - 1))}
                  >
                    <Ionicons name="remove" size={20} color="#1e3a8a" />
                  </TouchableOpacity>
                  <Text style={styles.scoreText}>{score.set1.team1}</Text>
                  <TouchableOpacity 
                    style={styles.scoreButton}
                    onPress={() => handleScoreChange('set1', 'team1', score.set1.team1 + 1)}
                  >
                    <Ionicons name="add" size={20} color="#1e3a8a" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.teamContainer}>
                <Text style={styles.teamLabel}>Equipo 2</Text>
                <View style={styles.scoreInput}>
                  <TouchableOpacity 
                    style={styles.scoreButton}
                    onPress={() => handleScoreChange('set1', 'team2', Math.max(0, score.set1.team2 - 1))}
                  >
                    <Ionicons name="remove" size={20} color="#1e3a8a" />
                  </TouchableOpacity>
                  <Text style={styles.scoreText}>{score.set1.team2}</Text>
                  <TouchableOpacity 
                    style={styles.scoreButton}
                    onPress={() => handleScoreChange('set1', 'team2', score.set1.team2 + 1)}
                  >
                    <Ionicons name="add" size={20} color="#1e3a8a" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          
          {/* Set 2 */}
          <View style={styles.setContainer}>
            <Text style={styles.setTitle}>Set 2</Text>
            <View style={styles.scoreContainer}>
              <View style={styles.teamContainer}>
                <Text style={styles.teamLabel}>Equipo 1</Text>
                <View style={styles.scoreInput}>
                  <TouchableOpacity 
                    style={styles.scoreButton}
                    onPress={() => handleScoreChange('set2', 'team1', Math.max(0, score.set2.team1 - 1))}
                  >
                    <Ionicons name="remove" size={20} color="#1e3a8a" />
                  </TouchableOpacity>
                  <Text style={styles.scoreText}>{score.set2.team1}</Text>
                  <TouchableOpacity 
                    style={styles.scoreButton}
                    onPress={() => handleScoreChange('set2', 'team1', score.set2.team1 + 1)}
                  >
                    <Ionicons name="add" size={20} color="#1e3a8a" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.teamContainer}>
                <Text style={styles.teamLabel}>Equipo 2</Text>
                <View style={styles.scoreInput}>
                  <TouchableOpacity 
                    style={styles.scoreButton}
                    onPress={() => handleScoreChange('set2', 'team2', Math.max(0, score.set2.team2 - 1))}
                  >
                    <Ionicons name="remove" size={20} color="#1e3a8a" />
                  </TouchableOpacity>
                  <Text style={styles.scoreText}>{score.set2.team2}</Text>
                  <TouchableOpacity 
                    style={styles.scoreButton}
                    onPress={() => handleScoreChange('set2', 'team2', score.set2.team2 + 1)}
                  >
                    <Ionicons name="add" size={20} color="#1e3a8a" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          
          {/* Opción para mostrar Set 3 */}
          <TouchableOpacity 
            style={styles.set3Toggle}
            onPress={() => setShowSet3(!showSet3)}
          >
            <Ionicons 
              name={showSet3 ? 'chevron-down' : 'chevron-forward'} 
              size={20} 
              color="#1e3a8a" 
            />
            <Text style={styles.set3ToggleText}>
              {showSet3 ? 'Ocultar Set 3' : 'Añadir Set 3 (Opcional)'}
            </Text>
          </TouchableOpacity>
          
          {/* Set 3 (condicional) */}
          {showSet3 && (
            <View style={styles.setContainer}>
              <Text style={styles.setTitle}>Set 3</Text>
              <View style={styles.scoreContainer}>
                <View style={styles.teamContainer}>
                  <Text style={styles.teamLabel}>Equipo 1</Text>
                  <View style={styles.scoreInput}>
                    <TouchableOpacity 
                      style={styles.scoreButton}
                      onPress={() => handleScoreChange('set3', 'team1', Math.max(0, score.set3!.team1 - 1))}
                    >
                      <Ionicons name="remove" size={20} color="#1e3a8a" />
                    </TouchableOpacity>
                    <Text style={styles.scoreText}>{score.set3!.team1}</Text>
                    <TouchableOpacity 
                      style={styles.scoreButton}
                      onPress={() => handleScoreChange('set3', 'team1', score.set3!.team1 + 1)}
                    >
                      <Ionicons name="add" size={20} color="#1e3a8a" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.teamContainer}>
                  <Text style={styles.teamLabel}>Equipo 2</Text>
                  <View style={styles.scoreInput}>
                    <TouchableOpacity 
                      style={styles.scoreButton}
                      onPress={() => handleScoreChange('set3', 'team2', Math.max(0, score.set3!.team2 - 1))}
                    >
                      <Ionicons name="remove" size={20} color="#1e3a8a" />
                    </TouchableOpacity>
                    <Text style={styles.scoreText}>{score.set3!.team2}</Text>
                    <TouchableOpacity 
                      style={styles.scoreButton}
                      onPress={() => handleScoreChange('set3', 'team2', score.set3!.team2 + 1)}
                    >
                      <Ionicons name="add" size={20} color="#1e3a8a" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
          
          {/* Botón de envío */}
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Guardar Resultado</Text>
            )}
          </TouchableOpacity>
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
  setContainer: {
    marginBottom: 20,
  },
  setTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e3a8a',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  scoreInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 5,
  },
  scoreButton: {
    padding: 5,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 10,
    color: '#1e3a8a',
  },
  set3Toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  set3ToggleText: {
    marginLeft: 5,
    color: '#1e3a8a',
  },
  submitButton: {
    backgroundColor: '#1e3a8a',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ScoreForm; 