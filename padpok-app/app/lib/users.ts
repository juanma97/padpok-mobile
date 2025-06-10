import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export const getUserUsername = async (userId: string): Promise<string> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    return userDoc.data().username || 'Usuario';
  }
  
  return 'Usuario';
};