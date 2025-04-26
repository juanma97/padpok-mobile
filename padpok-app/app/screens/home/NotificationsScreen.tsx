import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@app/lib/AuthContext';
import { getUserNotifications, markNotificationAsRead } from '@app/lib/notifications';
import { Notification } from '@app/types';
import { useNavigation } from '@react-navigation/native';
import { Timestamp } from 'firebase/firestore';

// Datos mock para pruebas
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'match_full',
    matchId: 'match1',
    matchTitle: 'Partido en Club de Pádel Central',
    userId: 'user1',
    read: false,
    createdAt: Timestamp.now(),
  },
  {
    id: '2',
    type: 'result_added',
    matchId: 'match2',
    matchTitle: 'Partido en Pádel Indoor',
    userId: 'user1',
    read: false,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000)), // 1 hora atrás
    data: {
      score: {
        set1: { team1: 6, team2: 4 },
        set2: { team1: 6, team2: 3 },
        winner: 'team1'
      }
    }
  },
  {
    id: '3',
    type: 'result_confirmed',
    matchId: 'match3',
    matchTitle: 'Partido en Club de Pádel Norte',
    userId: 'user1',
    read: true,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000)), // 1 día atrás
    data: {
      score: {
        set1: { team1: 6, team2: 4 },
        set2: { team1: 6, team2: 3 },
        winner: 'team1'
      },
      confirmedBy: ['user2', 'user3']
    }
  }
];

const NotificationsScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      try {
        const userNotifications = await getUserNotifications(user.uid);
        setNotifications(userNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }

    // Navegar al detalle del partido
    navigation.navigate('MatchDetails', { matchId: notification.matchId });
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'match_full':
        return 'people';
      case 'result_added':
        return 'trophy';
      case 'result_confirmed':
        return 'checkmark-circle';
      default:
        return 'notifications';
    }
  };

  const getNotificationTitle = (type: Notification['type']) => {
    switch (type) {
      case 'match_full':
        return 'Partido completo';
      case 'result_added':
        return 'Resultado añadido';
      case 'result_confirmed':
        return 'Resultado confirmado';
      default:
        return 'Notificación';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationIcon}>
        <Ionicons 
          name={getNotificationIcon(item.type)} 
          size={24} 
          color="#1e3a8a" 
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>
          {getNotificationTitle(item.type)}
        </Text>
        <Text style={styles.matchTitle}>{item.matchTitle}</Text>
        <Text style={styles.notificationTime}>
          {item.createdAt.toDate().toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notificaciones</Text>
        </View>
      </SafeAreaView>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>No tienes notificaciones</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    backgroundColor: '#1e3a8a',
  },
  header: {
    backgroundColor: '#1e3a8a',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadNotification: {
    backgroundColor: '#f0f5ff',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  matchTitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
  },
});

export default NotificationsScreen; 