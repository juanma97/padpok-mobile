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
import { COLORS, SIZES, FONTS, SPACING } from '@app/constants/theme';

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <SafeAreaView style={{ backgroundColor: COLORS.primary }} edges={['top']}>
        <View style={{ backgroundColor: COLORS.primary, padding: SPACING.lg, flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            style={{ marginRight: SPACING.md }}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={SIZES.lg} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={{ fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.white }}>Notificaciones</Text>
        </View>
      </SafeAreaView>

      {notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg }}>
          <Ionicons name="notifications-off-outline" size={SIZES.xl} color={COLORS.gray} />
          <Text style={{ fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.gray, marginTop: SPACING.lg }}>
            No tienes notificaciones
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={{
                flexDirection: 'row',
                backgroundColor: item.read ? COLORS.white : COLORS.light,
                borderRadius: 12,
                padding: SPACING.lg,
                marginBottom: SPACING.md,
                shadowColor: COLORS.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 2,
                borderWidth: item.read ? 1 : 2,
                borderColor: item.read ? COLORS.border : COLORS.primary,
                alignItems: 'center',
              }}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.85}
              testID={`notification-${item.id}`}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: COLORS.light,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: SPACING.lg,
                borderWidth: 1,
                borderColor: item.read ? COLORS.border : COLORS.primary,
              }}>
                <Ionicons 
                  name={getNotificationIcon(item.type)} 
                  size={SIZES.lg} 
                  color={item.read ? COLORS.gray : COLORS.primary} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: SIZES.md, fontFamily: FONTS.bold, color: COLORS.primary, marginBottom: 2 }}>{getNotificationTitle(item.type)}</Text>
                <Text style={{ fontSize: SIZES.sm, color: COLORS.gray, fontFamily: FONTS.regular, marginBottom: 2 }}>{item.matchTitle}</Text>
                <Text style={{ fontSize: SIZES.xs, color: COLORS.gray, fontFamily: FONTS.medium }}>
                  {item.createdAt.toDate().toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: SPACING.lg }}
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