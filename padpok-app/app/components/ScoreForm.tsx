import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateGroupMatchScore, updateMatchScore, validateScore } from '@app/lib/matches';
import { Score } from '@app/types/index';
import { COLORS, FONTS, SIZES, SPACING } from '@app/constants/theme';

interface ScoreFormProps {
  matchId: string;
  onScoreSubmitted: (score: Score) => void;
  visible: boolean;
  onClose: () => void;
  collection?: 'matches' | 'groups';
  groupId?: string;
}

const ScoreForm: React.FC<ScoreFormProps> = ({ matchId, onScoreSubmitted, visible, onClose, collection, groupId }) => {
  const [loading, setLoading] = useState(false);
  const [showSet3, setShowSet3] = useState(false);
  const [score, setScore] = useState<Score>({
    set1: { team1: 0, team2: 0 },
    set2: { team1: 0, team2: 0 },
    set3: { team1: 0, team2: 0 },
    winner: 'team1'
  });

  const handleScoreChange = (set: 'set1' | 'set2' | 'set3', team: 'team1' | 'team2', value: number) => {
    setScore((prev: Score) => ({
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
      if (collection === 'groups') {
        if (!groupId) throw new Error('Falta groupId para partidos de grupo');
        await updateGroupMatchScore(groupId, matchId, scoreToSubmit);
      } else {
        await updateMatchScore(matchId, scoreToSubmit);
      }
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
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <View style={{
          backgroundColor: COLORS.white,
          borderRadius: 20,
          padding: SPACING.xl,
          width: '92%',
          maxHeight: '85%',
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 8,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg }}>
            <Text style={{ fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.primary }}>Añadir Resultado</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
          {/* Set 1 */}
          <View style={{ marginBottom: SPACING.md }}>
            <Text style={{ fontSize: SIZES.md, fontFamily: FONTS.medium, color: COLORS.primary, marginBottom: 8 }}>Set 1</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              {/* Equipo 1 */}
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: SIZES.sm, color: COLORS.gray, fontFamily: FONTS.medium, marginBottom: 4 }}>Equipo 1</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 6, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 }}>
                  <TouchableOpacity style={{ padding: 6 }} onPress={() => handleScoreChange('set1', 'team1', Math.max(0, score.set1.team1 - 1))}>
                    <Ionicons name="remove" size={22} color={COLORS.primary} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.primary, marginHorizontal: 10 }}>{score.set1.team1}</Text>
                  <TouchableOpacity style={{ padding: 6 }} onPress={() => handleScoreChange('set1', 'team1', score.set1.team1 + 1)}>
                    <Ionicons name="add" size={22} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              {/* Equipo 2 */}
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: SIZES.sm, color: COLORS.gray, fontFamily: FONTS.medium, marginBottom: 4 }}>Equipo 2</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 6, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 }}>
                  <TouchableOpacity style={{ padding: 6 }} onPress={() => handleScoreChange('set1', 'team2', Math.max(0, score.set1.team2 - 1))}>
                    <Ionicons name="remove" size={22} color={COLORS.primary} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.primary, marginHorizontal: 10 }}>{score.set1.team2}</Text>
                  <TouchableOpacity style={{ padding: 6 }} onPress={() => handleScoreChange('set1', 'team2', score.set1.team2 + 1)}>
                    <Ionicons name="add" size={22} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          {/* Set 2 */}
          <View style={{ marginBottom: SPACING.md }}>
            <Text style={{ fontSize: SIZES.md, fontFamily: FONTS.medium, color: COLORS.primary, marginBottom: 8 }}>Set 2</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              {/* Equipo 1 */}
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: SIZES.sm, color: COLORS.gray, fontFamily: FONTS.medium, marginBottom: 4 }}>Equipo 1</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 6, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 }}>
                  <TouchableOpacity style={{ padding: 6 }} onPress={() => handleScoreChange('set2', 'team1', Math.max(0, score.set2.team1 - 1))}>
                    <Ionicons name="remove" size={22} color={COLORS.primary} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.primary, marginHorizontal: 10 }}>{score.set2.team1}</Text>
                  <TouchableOpacity style={{ padding: 6 }} onPress={() => handleScoreChange('set2', 'team1', score.set2.team1 + 1)}>
                    <Ionicons name="add" size={22} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              {/* Equipo 2 */}
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: SIZES.sm, color: COLORS.gray, fontFamily: FONTS.medium, marginBottom: 4 }}>Equipo 2</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 6, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 }}>
                  <TouchableOpacity style={{ padding: 6 }} onPress={() => handleScoreChange('set2', 'team2', Math.max(0, score.set2.team2 - 1))}>
                    <Ionicons name="remove" size={22} color={COLORS.primary} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.primary, marginHorizontal: 10 }}>{score.set2.team2}</Text>
                  <TouchableOpacity style={{ padding: 6 }} onPress={() => handleScoreChange('set2', 'team2', score.set2.team2 + 1)}>
                    <Ionicons name="add" size={22} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          {/* Opción para mostrar Set 3 */}
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}
            onPress={() => setShowSet3(!showSet3)}
          >
            <Ionicons 
              name={showSet3 ? 'chevron-down' : 'chevron-forward'} 
              size={20} 
              color={COLORS.primary} 
            />
            <Text style={{ marginLeft: 5, color: COLORS.primary, fontFamily: FONTS.medium }}>
              {showSet3 ? 'Ocultar Set 3' : 'Añadir Set 3 (Opcional)'}
            </Text>
          </TouchableOpacity>
          {/* Set 3 (condicional) */}
          {showSet3 && (
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={{ fontSize: SIZES.md, fontFamily: FONTS.medium, color: COLORS.primary, marginBottom: 8 }}>Set 3</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                {/* Equipo 1 */}
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: SIZES.sm, color: COLORS.gray, fontFamily: FONTS.medium, marginBottom: 4 }}>Equipo 1</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 6, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 }}>
                    <TouchableOpacity style={{ padding: 6 }} onPress={() => handleScoreChange('set3', 'team1', Math.max(0, score.set3!.team1 - 1))}>
                      <Ionicons name="remove" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.primary, marginHorizontal: 10 }}>{score.set3!.team1}</Text>
                    <TouchableOpacity style={{ padding: 6 }} onPress={() => handleScoreChange('set3', 'team1', score.set3!.team1 + 1)}>
                      <Ionicons name="add" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Equipo 2 */}
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: SIZES.sm, color: COLORS.gray, fontFamily: FONTS.medium, marginBottom: 4 }}>Equipo 2</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 6, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 }}>
                    <TouchableOpacity style={{ padding: 6 }} onPress={() => handleScoreChange('set3', 'team2', Math.max(0, score.set3!.team2 - 1))}>
                      <Ionicons name="remove" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.primary, marginHorizontal: 10 }}>{score.set3!.team2}</Text>
                    <TouchableOpacity style={{ padding: 6 }} onPress={() => handleScoreChange('set3', 'team2', score.set3!.team2 + 1)}>
                      <Ionicons name="add" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
          {/* Botón de envío premium */}
          <TouchableOpacity 
            style={{
              backgroundColor: COLORS.primary,
              padding: 18,
              borderRadius: 16,
              alignItems: 'center',
              marginTop: 12,
              shadowColor: COLORS.shadow,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.14,
              shadowRadius: 12,
              elevation: 4,
              transform: [{ scale: loading ? 0.98 : 1 }],
              opacity: loading ? 0.7 : 1,
            }}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: SIZES.md, fontFamily: FONTS.bold }}>Guardar Resultado</Text>
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