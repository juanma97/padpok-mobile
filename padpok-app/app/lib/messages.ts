import { collection, addDoc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Message } from '@app/types';

// Función para enviar un mensaje
export const sendMessage = async (
  matchId: string,
  userId: string,
  username: string,
  text: string
): Promise<void> => {
  const messagesRef = collection(db, 'messages');
  await addDoc(messagesRef, {
    matchId,
    userId,
    username,
    text,
    createdAt: Timestamp.now()
  });
};

// Función para obtener los mensajes de un partido
export const getMatchMessages = async (matchId: string): Promise<Message[]> => {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('matchId', '==', matchId),
    orderBy('createdAt', 'asc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Message[];
}; 