import { collection, doc, getDocs, getDoc, updateDoc, arrayUnion, arrayRemove, query, where, orderBy, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Match, Score } from '@app/types/index';
import { checkAndUpdateMedals } from './medals';
import { notifyMatchFull, notifyResultAdded, notifyResultConfirmed } from './notifications';

// Función para actualizar las estadísticas de los jugadores
const updatePlayerStats = async (match: Match, score: Score): Promise<void> => {
  const { teams } = match;
  if (!teams) return;

  const winningTeam = score.winner;
  const losingTeam = winningTeam === 'team1' ? 'team2' : 'team1';

  // Actualizar estadísticas de los ganadores
  for (const playerId of teams[winningTeam]) {
    const userRef = doc(db, 'users', playerId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const stats = userData.stats || {
        points: 0,
        matchesPlayed: 0,
        wins: 0,
        losses: 0
      };

      await updateDoc(userRef, {
        stats: {
          ...stats,
          points: stats.points + 3, // 3 puntos por victoria
          matchesPlayed: stats.matchesPlayed + 1,
          wins: stats.wins + 1
        }
      });
    }
  }

  // Actualizar estadísticas de los perdedores
  for (const playerId of teams[losingTeam]) {
    const userRef = doc(db, 'users', playerId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const stats = userData.stats || {
        points: 0,
        matchesPlayed: 0,
        wins: 0,
        losses: 0
      };

      await updateDoc(userRef, {
        stats: {
          ...stats,
          points: stats.points + 1, // 1 punto por derrota
          matchesPlayed: stats.matchesPlayed + 1,
          losses: stats.losses + 1
        }
      });
    }
  }
};

// Función para actualizar el resultado de un partido
export const updateMatchScore = async (matchId: string, score: Score): Promise<void> => {
  const matchRef = doc(db, 'matches', matchId);
  const matchDoc = await getDoc(matchRef);
  
  if (!matchDoc.exists()) {
    throw new Error('El partido no existe');
  }

  const matchData = matchDoc.data() as Match;
  
  // Actualizar el resultado del partido
  await updateDoc(matchRef, { 
    score,
    updatedAt: serverTimestamp()
  });

  // Actualizar las estadísticas de los jugadores
  await updatePlayerStats(matchData, score);

  // Actualizar las medallas de todos los jugadores
  if (matchData.teams) {
    const allPlayers = [...matchData.teams.team1, ...matchData.teams.team2];
    for (const playerId of allPlayers) {
      await checkAndUpdateMedals(playerId, {
        ...matchData,
        score
      });
    }
  }

  // Notificar a los jugadores sobre el nuevo resultado
  await notifyResultAdded({
    ...matchData,
    id: matchId
  }, score);

  // Añadir al historial de todos los jugadores
  if (matchData.teams) {
    const allPlayers = [...matchData.teams.team1, ...matchData.teams.team2];
    for (const playerId of allPlayers) {
      const team = matchData.teams.team1.includes(playerId) ? 'team1' : 'team2';
      const position = matchData.teams[team][0] === playerId ? 'first' : 'second';
      const partnerId = matchData.teams[team].find((id: string) => id !== playerId);
      const opponentIds = matchData.teams[team === 'team1' ? 'team2' : 'team1'];
      const result = (score.winner === team) ? 'win' : 'loss';
      await addMatchToHistory(matchId, playerId, result, team, position, partnerId, opponentIds);
    }
  }
};

// Función para confirmar un resultado
export const confirmMatchScore = async (matchId: string, userId: string): Promise<void> => {
  const matchRef = doc(db, 'matches', matchId);
  const matchDoc = await getDoc(matchRef);
  
  if (!matchDoc.exists()) {
    throw new Error('El partido no existe');
  }

  const matchData = matchDoc.data() as Match;
  
  // Actualizar el array de confirmaciones
  await updateDoc(matchRef, {
    'score.confirmedBy': arrayUnion(userId)
  });

  // Notificar a los otros jugadores sobre la confirmación
  await notifyResultConfirmed(matchData, userId);
};

// Función para validar el resultado de un partido
export const validateScore = (score: Score): boolean => {
  // Validar que los resultados son números positivos
  if (
    score.set1.team1 < 0 || score.set1.team2 < 0 ||
    score.set2.team1 < 0 || score.set2.team2 < 0 ||
    (score.set3 && (score.set3.team1 < 0 || score.set3.team2 < 0))
  ) {
    return false;
  }

  // Validar que el equipo ganador ha ganado al menos 2 sets
  const team1Wins = 
    (score.set1.team1 > score.set1.team2 ? 1 : 0) +
    (score.set2.team1 > score.set2.team2 ? 1 : 0) +
    (score.set3 && score.set3.team1 > score.set3.team2 && !(score.set3.team1 === 0 && score.set3.team2 === 0) ? 1 : 0);
  
  const team2Wins = 
    (score.set1.team2 > score.set1.team1 ? 1 : 0) +
    (score.set2.team2 > score.set2.team1 ? 1 : 0) +
    (score.set3 && score.set3.team2 > score.set3.team1 && !(score.set3.team1 === 0 && score.set3.team2 === 0) ? 1 : 0);
  
  // Verificar que el ganador coincide con los sets ganados
  if (score.winner === 'team1' && team1Wins < 2) return false;
  if (score.winner === 'team2' && team2Wins < 2) return false;

  // Validar que los resultados siguen las reglas del pádel
  // Un set se gana al llegar a 6 juegos con diferencia de 2
  // Si es 6-6, se juega un tie-break (7-6)
  const isValidSet = (team1: number, team2: number): boolean => {
    // Caso de victoria normal (6-4, 6-3, etc.)
    if ((team1 >= 6 && team1 - team2 >= 2) || (team2 >= 6 && team2 - team1 >= 2)) {
      return true;
    }
    
    // Caso de tie-break (7-6, 7-5, etc.)
    if ((team1 === 7 && team2 <= 6) || (team2 === 7 && team1 <= 6)) {
      return true;
    }
    
    return false;
  };

  // Validar cada set
  if (!isValidSet(score.set1.team1, score.set1.team2)) return false;
  if (!isValidSet(score.set2.team1, score.set2.team2)) return false;
  if (score.set3 && !(score.set3.team1 === 0 && score.set3.team2 === 0) && !isValidSet(score.set3.team1, score.set3.team2)) return false;

  return true;
};

// Función para unirse a un partido
export const joinMatch = async (matchId: string, userId: string, team: 'team1' | 'team2', position: 'first' | 'second'): Promise<void> => {
  const matchRef = doc(db, 'matches', matchId);
  const matchDoc = await getDoc(matchRef);
  
  if (!matchDoc.exists()) {
    throw new Error('El partido no existe');
  }

  const matchData = matchDoc.data();
  const teams = matchData.teams || {
    team1: [matchData.createdBy],
    team2: []
  };

  // Verificar si el equipo está lleno
  if (teams[team].length >= 2) {
    throw new Error('El equipo está completo');
  }

  // Verificar si el usuario ya está en algún equipo
  if (teams.team1.includes(userId) || teams.team2.includes(userId)) {
    throw new Error('Ya estás en un equipo');
  }

  // Añadir el usuario al equipo seleccionado
  teams[team].push(userId);

  // Actualizar el documento
  await updateDoc(matchRef, {
    playersJoined: arrayUnion(userId),
    teams
  });

  // Verificar si el partido está lleno
  const updatedMatchDoc = await getDoc(matchRef);
  const updatedMatchData = updatedMatchDoc.data();
  if (updatedMatchData.playersJoined.length === updatedMatchData.playersNeeded) {
    await notifyMatchFull({
      id: matchId,
      ...updatedMatchData
    });
  }
};

// Función para abandonar un partido
export const leaveMatch = async (matchId: string, userId: string): Promise<void> => {
  const matchRef = doc(db, 'matches', matchId);
  const matchDoc = await getDoc(matchRef);
  
  if (!matchDoc.exists()) {
    throw new Error('El partido no existe');
  }

  const matchData = matchDoc.data();
  const teams = matchData.teams || {
    team1: [matchData.createdBy],
    team2: []
  };

  // Remover el usuario de los equipos
  teams.team1 = teams.team1.filter((id: string) => id !== userId);
  teams.team2 = teams.team2.filter((id: string) => id !== userId);

  // Actualizar el documento
  await updateDoc(matchRef, {
    playersJoined: arrayRemove(userId),
    teams
  });
};

// Función para obtener los usuarios de un partido
export const getMatchUsers = async (playerIds: string[]): Promise<{ [key: string]: { username: string; gender?: "Masculino" | "Femenino" } }> => {
  const users: { [key: string]: { username: string; gender?: "Masculino" | "Femenino" } } = {};

  for (const userId of playerIds) {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      users[userId] = {
        username: data.username || 'Usuario',
        gender: data.gender,
      };
    }
  }

  return users;
};

export const addMatchToHistory = async (
  matchId: string,
  userId: string,
  result: 'win' | 'loss',
  team: 'team1' | 'team2',
  position: 'first' | 'second',
  partnerId?: string,
  opponentIds: string[] = []
): Promise<void> => {
  const matchRef = doc(db, 'matches', matchId);
  const matchDoc = await getDoc(matchRef);
  
  if (!matchDoc.exists()) {
    throw new Error('El partido no existe');
  }

  const matchData = matchDoc.data() as Match;
  const historyRef = collection(db, 'matchHistory');
  
  await addDoc(historyRef, {
    matchId,
    userId,
    date: matchData.date,
    result,
    score: matchData.score,
    team,
    position,
    partnerId,
    opponentIds,
    createdAt: new Date()
  });

  // Actualizar estadísticas del usuario
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    const userData = userDoc.data();
    const stats = userData.stats || {
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      currentStreak: 0,
      bestStreak: 0
    };

    stats.matchesPlayed += 1;
    if (result === 'win') {
      stats.matchesWon += 1;
      stats.currentStreak += 1;
      stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
    } else {
      stats.matchesLost += 1;
      stats.currentStreak = 0;
    }

    await updateDoc(userRef, { stats });
  }
};

export const getUserMatchHistory = async (userId: string): Promise<MatchHistory[]> => {
  const historyRef = collection(db, 'matchHistory');
  const q = query(
    historyRef,
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MatchHistory[];
};

// Añadir partido de grupo al historial
export const addGroupMatchToHistory = async (
  groupId: string,
  matchId: string,
  userId: string,
  result: 'win' | 'loss',
  team: 'team1' | 'team2',
  position: 'first' | 'second',
  partnerId?: string,
  opponentIds: string[] = []
): Promise<void> => {
  // Obtener el grupo y buscar el partido en el array matches
  const groupRef = doc(db, 'groups', groupId);
  const groupDoc = await getDoc(groupRef);
  if (!groupDoc.exists()) {
    throw new Error('El grupo no existe');
  }
  const groupData = groupDoc.data();
  const matchData = (groupData.matches || []).find((m: any) => m.id === matchId);
  if (!matchData) {
    throw new Error('El partido no existe en el grupo');
  }
  const historyRef = collection(db, 'matchHistory');
  await addDoc(historyRef, {
    matchId,
    groupId,
    userId,
    date: matchData.date,
    result,
    score: matchData.score,
    team,
    position,
    partnerId,
    opponentIds,
    createdAt: new Date()
  });

  // Actualizar estadísticas del usuario
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    const userData = userDoc.data();
    const stats = userData.stats || {
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      currentStreak: 0,
      bestStreak: 0
    };
    stats.matchesPlayed += 1;
    if (result === 'win') {
      stats.matchesWon += 1;
      stats.currentStreak += 1;
      stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak);
    } else {
      stats.matchesLost += 1;
      stats.currentStreak = 0;
    }
    await updateDoc(userRef, { stats });
  }
};

// Solo para partidos de grupos: /groups/{groupId}/matches/{matchId}
export const updateGroupMatchScore = async (
  groupId: string,
  matchId: string,
  score: Score
): Promise<void> => {
  const groupRef = doc(db, 'groups', groupId);
  const groupDoc = await getDoc(groupRef);
  if (!groupDoc.exists()) {
    throw new Error('El grupo no existe');
  }
  const groupData = groupDoc.data();
  const matches = groupData.matches || [];
  const matchIndex = matches.findIndex((m: any) => m.id === matchId);
  if (matchIndex === -1) throw new Error('El partido no existe en el grupo');

  // Actualizar el score y updatedAt
  matches[matchIndex].score = score;
  matches[matchIndex].updatedAt = new Date();

  await updateDoc(groupRef, { matches });

  // --- NUEVO: Actualizar ranking del grupo ---
  const ranking = groupData.ranking || {};
  const matchData = matches[matchIndex];
  const { teams } = matchData;
  if (teams) {
    const winningTeam = score.winner;
    const losingTeam = winningTeam === 'team1' ? 'team2' : 'team1';

    // Ganadores
    for (const playerId of teams[winningTeam]) {
      if (!ranking[playerId]) {
        ranking[playerId] = { points: 0, matchesPlayed: 0, wins: 0, losses: 0 };
      }
      ranking[playerId].points += 3;
      ranking[playerId].matchesPlayed += 1;
      ranking[playerId].wins += 1;
    }
    // Perdedores
    for (const playerId of teams[losingTeam]) {
      if (!ranking[playerId]) {
        ranking[playerId] = { points: 0, matchesPlayed: 0, wins: 0, losses: 0 };
      }
      ranking[playerId].points += 1;
      ranking[playerId].matchesPlayed += 1;
      ranking[playerId].losses += 1;
    }
    await updateDoc(groupRef, { ranking });
  }
  // --- FIN NUEVO ---
  // Actualizar las estadísticas de los jugadores
  await updatePlayerStats(matchData, score);

  // Actualizar las medallas de todos los jugadores
  if (matchData.teams) {
    const allPlayers = [...matchData.teams.team1, ...matchData.teams.team2];
    for (const playerId of allPlayers) {
      await checkAndUpdateMedals(playerId, {
        ...matchData,
        score
      });
    }
    // Añadir al historial de todos los jugadores
    for (const playerId of allPlayers) {
      const team = matchData.teams.team1.includes(playerId) ? 'team1' : 'team2';
      const position = matchData.teams[team][0] === playerId ? 'first' : 'second';
      const partnerId = matchData.teams[team].find((id: string) => id !== playerId);
      const opponentIds = matchData.teams[team === 'team1' ? 'team2' : 'team1'];
      const result = (score.winner === team) ? 'win' : 'loss';
      await addGroupMatchToHistory(groupId, matchId, playerId, result, team, position, partnerId, opponentIds);
    }
  }
}; 