import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './firebase';

export const getUserUsername = async (userId: string): Promise<string> => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  console.log('userDoc', userDoc.data());
  
  if (userDoc.exists()) {
    return userDoc.data().username || 'Usuario';
  }
  
  return 'Usuario';
};

export const followUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetUserId);

  // Añadir a following del usuario actual
  await updateDoc(currentUserRef, {
    following: arrayUnion(targetUserId)
  });

  // Añadir a followers del usuario objetivo
  await updateDoc(targetUserRef, {
    followers: arrayUnion(currentUserId)
  });
};

export const unfollowUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetUserId);

  // Remover de following del usuario actual
  await updateDoc(currentUserRef, {
    following: arrayRemove(targetUserId)
  });

  // Remover de followers del usuario objetivo
  await updateDoc(targetUserRef, {
    followers: arrayRemove(currentUserId)
  });
};

export const isFollowing = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  const userRef = doc(db, 'users', currentUserId);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    const following = userDoc.data().following || [];
    return following.includes(targetUserId);
  }
  
  return false;
}; 