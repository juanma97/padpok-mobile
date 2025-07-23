import { collection, doc, addDoc, updateDoc, query, where, orderBy, getDocs, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Notification, NotificationType } from '@app/types/models';

// Función para crear una notificación
export const createNotification = async (
  type: NotificationType,
  matchId: string,
  matchTitle: string,
  userId: string,
  data?: any
): Promise<void> => {
  const notificationsRef = collection(db, 'notifications');
  await addDoc(notificationsRef, {
    type,
    matchId,
    matchTitle,
    userId,
    read: false,
    createdAt: Timestamp.now(),
    data
  });
};

// Función para marcar una notificación como leída
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const notificationRef = doc(db, 'notifications', notificationId);
  await updateDoc(notificationRef, {
    read: true
  });
};

// Función para obtener las notificaciones de un usuario
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Notification[];
};

// Función para obtener el número de notificaciones no leídas
export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    where('read', '==', false)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
};

// Función para notificar cuando un partido está lleno
export const notifyMatchFull = async (match: any): Promise<void> => {
  const allPlayers = [...match.teams.team1, ...match.teams.team2];
  
  for (const playerId of allPlayers) {
    await createNotification(
      'match_full',
      match.id,
      match.title,
      playerId,
      {}
    );
  }
};

// Función para notificar cuando se añade un resultado
export const notifyResultAdded = async (match: any, score: any): Promise<void> => {
  const allPlayers = [...match.teams.team1, ...match.teams.team2];
  const playersToNotify = allPlayers.filter(id => id !== match.createdBy);
  
  for (const playerId of playersToNotify) {
    await createNotification(
      'result_added',
      match.id,
      match.title,
      playerId,
      { score }
    );
  }
};

// Función para notificar cuando se confirma un resultado
export const notifyResultConfirmed = async (match: any, confirmedBy: string): Promise<void> => {
  const allPlayers = [...match.teams.team1, ...match.teams.team2];
  const playersToNotify = allPlayers.filter(id => id !== confirmedBy);
  
  for (const playerId of playersToNotify) {
    await createNotification(
      'result_confirmed',
      match.id,
      match.title,
      playerId,
      { confirmedBy }
    );
  }
};

// Función para notificar cuando un partido termina sin resultado
export const notifyAddResult = async (match: any): Promise<void> => {
  const allPlayers = [...match.teams.team1, ...match.teams.team2];
  
  for (const playerId of allPlayers) {
    await createNotification(
      'add_result',
      match.id,
      match.title,
      playerId,
      {}
    );
  }
};

// Función para limpiar notificaciones con tipos incorrectos
export const cleanInvalidNotifications = async (): Promise<void> => {
  const notificationsRef = collection(db, 'notifications');
  const querySnapshot = await getDocs(notificationsRef);
  
  const validTypes = ['match_full', 'result_added', 'result_confirmed', 'add_result', 'match_cancelled'];
  
  for (const docSnapshot of querySnapshot.docs) {
    const data = docSnapshot.data();
    if (!validTypes.includes(data.type)) {
      console.log(`Eliminando notificación con tipo inválido: ${data.type}`);
      await deleteDoc(doc(db, 'notifications', docSnapshot.id));
    }
  }
}; 