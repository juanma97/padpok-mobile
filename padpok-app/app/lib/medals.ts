import { collection, doc, getDocs, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';


export type Medal = {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: string;
  category: 'matches' | 'wins' | 'social' | 'special';
  requirement: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

// Función para obtener todas las medallas
export const getAllMedals = async (): Promise<Medal[]> => {
  const medalsRef = collection(db, 'medals');
  const snapshot = await getDocs(medalsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Medal));
};

// Función para obtener las medallas del usuario
export const getUserMedals = async (userId: string): Promise<string[]> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  if (userDoc.exists()) {
    return userDoc.data().stats?.medals || [];
  }
  return [];
};

// Función para desbloquear una medalla
export const unlockMedal = async (userId: string, medalId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    'stats.medals': arrayUnion(medalId)
  });
};