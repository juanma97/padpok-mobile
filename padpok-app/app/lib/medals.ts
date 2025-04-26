import { collection, doc, getDocs, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';
import { Medal, UserMedal } from '@app/types/medals';
import { MEDALS } from '@app/types/medals';

// Función para obtener todas las medallas
export const getAllMedals = async (): Promise<Medal[]> => {
  return MEDALS;
};

// Función para obtener las medallas del usuario
export const getUserMedals = async (userId: string): Promise<UserMedal[]> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return [];
  }

  const userData = userDoc.data();
  const userMedals = userData.medals || [];

  // Asegurarnos de que todas las medallas existan en el array del usuario
  const allUserMedals = MEDALS.map(medal => {
    const existingMedal = userMedals.find((m: UserMedal) => m.id === medal.id);
    if (existingMedal) {
      return existingMedal;
    }
    return {
      id: medal.id,
      unlocked: false,
      progress: 0,
      lastUpdated: new Date()
    };
  });

  return allUserMedals;
};

// Función para desbloquear una medalla
export const unlockMedal = async (userId: string, medalId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    'stats.medals': arrayUnion(medalId)
  });
};

// Función para actualizar el progreso de una medalla
const updateMedalProgress = (userMedal: UserMedal, medal: Medal, match: any, userId: string): UserMedal => {
  const updatedMedal = { ...userMedal };

  switch (medal.requirements.type) {
    case 'matches_played':
      updatedMedal.progress = (userMedal.progress || 0) + 1;
      break;

    case 'wins':
      if (match.score && (
        (match.score.winner === 'team1' && match.teams.team1.includes(userId)) ||
        (match.score.winner === 'team2' && match.teams.team2.includes(userId))
      )) {
        updatedMedal.progress = (userMedal.progress || 0) + 1;
      }
      break;

    case 'win_streak':
      if (match.score && (
        (match.score.winner === 'team1' && match.teams.team1.includes(userId)) ||
        (match.score.winner === 'team2' && match.teams.team2.includes(userId))
      )) {
        updatedMedal.winStreak = (userMedal.winStreak || 0) + 1;
        updatedMedal.progress = Math.max(updatedMedal.winStreak, userMedal.progress);
      } else {
        updatedMedal.winStreak = 0;
      }
      break;

    case 'unique_players':
      const allPlayers = [...match.teams.team1, ...match.teams.team2];
      // Excluir al usuario actual de la lista de jugadores
      const otherPlayers = allPlayers.filter(playerId => playerId !== userId);
      // Combinar con los jugadores únicos anteriores, excluyendo al usuario actual
      const uniquePlayers = new Set([...(userMedal.uniquePlayers || []).filter(id => id !== userId), ...otherPlayers]);
      updatedMedal.uniquePlayers = Array.from(uniquePlayers);
      // El progreso es el número de jugadores únicos (excluyendo al usuario actual)
      updatedMedal.progress = uniquePlayers.size;
      break;

    case 'time_of_day':
      const matchHour = match.date.toDate().getHours();
      if (medal.requirements.timeOfDay === 'morning' && matchHour < 9 ||
          medal.requirements.timeOfDay === 'night' && matchHour >= 22) {
        updatedMedal.progress = 1;
      }
      break;

    case 'weekend_matches':
      const matchDay = match.date.toDate().getDay();
      if (matchDay === 0 || matchDay === 6) {
        updatedMedal.weekendMatches = (userMedal.weekendMatches || 0) + 1;
        updatedMedal.progress = updatedMedal.weekendMatches;
      }
      break;
  }

  // Verificar si la medalla se ha desbloqueado
  if (updatedMedal.progress >= medal.requirements.value) {
    updatedMedal.unlocked = true;
  }

  updatedMedal.lastUpdated = new Date();
  return updatedMedal;
};

// Función para verificar y actualizar las medallas de un usuario
export const checkAndUpdateMedals = async (userId: string, match: any): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return;
  }

  const userData = userDoc.data();
  const userMedals = userData.medals || [];
  const updatedMedals: UserMedal[] = [];

  // Verificar cada medalla
  for (const medal of MEDALS) {
    // Buscar si el usuario ya tiene esta medalla
    let userMedal = userMedals.find((m: UserMedal) => m.id === medal.id);
    
    // Si no existe, crear una nueva
    if (!userMedal) {
      userMedal = {
        id: medal.id,
        unlocked: false,
        progress: 0,
        lastUpdated: new Date()
      };
    }

    // Si la medalla ya está desbloqueada, no la actualizamos
    if (userMedal.unlocked) {
      updatedMedals.push(userMedal);
      continue;
    }

    // Actualizar el progreso de la medalla
    const updatedMedal = updateMedalProgress(userMedal, medal, match, userId);
    updatedMedals.push(updatedMedal);
  }

  // Actualizar las medallas del usuario en la base de datos
  await updateDoc(userRef, {
    medals: updatedMedals
  });
};